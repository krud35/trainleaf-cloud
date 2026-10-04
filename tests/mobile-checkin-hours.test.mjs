// The check-in windows follow the device's local clock; a zone with daylight saving makes that visible.
process.env.TZ = 'Europe/Warsaw';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtemp, rm } from 'node:fs/promises';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import ts from 'typescript';

const root = path.resolve(import.meta.dirname, '..');
const require = createRequire(import.meta.url);
const modules = new Map();
function loadTs(file) {
  const absolute = path.resolve(root, file);
  if (modules.has(absolute)) return modules.get(absolute).exports;
  const compiledModule = { exports: {} };
  modules.set(absolute, compiledModule);
  const js = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const localRequire = name => name.startsWith('.')
    ? loadTs(path.relative(root, path.resolve(path.dirname(absolute), `${name}.ts`)))
    : require(name);
  new Function('require', 'module', 'exports', js)(localRequire, compiledModule, compiledModule.exports);
  return compiledModule.exports;
}
const { currentWellnessSlot, currentCheckinDay, WELLNESS_SLOT_START_HOUR } = loadTs('mobile/src/features/shared/localTime.ts');
const { today } = loadTs('mobile/src/data/analytics.ts');
const { createLocalRepository } = loadTs('mobile/src/data/repository.ts');

/** A local wall-clock moment on the device. */
const local = (day, time) => new Date(`${day}T${time}:00`);
const slotAt = (day, time) => currentWellnessSlot(local(day, time));

test('the test process really runs in a zone with daylight saving', () => {
  assert.equal(new Date('2026-01-15T12:00:00Z').getHours(), 13);
  assert.equal(new Date('2026-07-15T12:00:00Z').getHours(), 14);
});

test('window boundaries: morning 03:00-09:59, daytime 10:00-17:59, evening 18:00-02:59', () => {
  const day = '2026-10-05';
  const expected = [
    ['02:59', 'evening'], ['03:00', 'morning'],
    ['09:59', 'morning'], ['10:00', 'daytime'],
    ['17:59', 'daytime'], ['18:00', 'evening'],
    ['23:59', 'evening'], ['00:00', 'evening'], ['00:01', 'evening'],
  ];
  for (const [time, slot] of expected) assert.equal(slotAt(day, time), slot, time);
  assert.deepEqual(WELLNESS_SLOT_START_HOUR, { morning: 3, daytime: 10, evening: 18 });
});

test('every minute of a day falls into exactly the documented window', () => {
  const counts = { morning: 0, daytime: 0, evening: 0 };
  for (let minute = 0; minute < 1440; minute++) {
    const hour = Math.floor(minute / 60), slot = currentWellnessSlot(new Date(2026, 5, 10, hour, minute % 60));
    assert.equal(slot, hour >= 3 && hour < 10 ? 'morning' : hour >= 10 && hour < 18 ? 'daytime' : 'evening', `${hour}:${minute % 60}`);
    counts[slot]++;
  }
  assert.deepEqual(counts, { morning: 7 * 60, daytime: 8 * 60, evening: 9 * 60 });
});

test('across midnight the evening window continues and the check-in stays on the evening\'s day; the calendar day is unchanged', () => {
  // `today()` (Today screen, sessions, plan) is still the calendar day; only the check-in day waits until 03:00.
  const moments = [
    ['2026-10-05', '23:59', 'evening', '2026-10-05'],
    ['2026-10-06', '00:00', 'evening', '2026-10-05'],
    ['2026-10-06', '00:01', 'evening', '2026-10-05'],
    ['2026-10-06', '01:30', 'evening', '2026-10-05'],
    ['2026-10-06', '02:59', 'evening', '2026-10-05'],
    ['2026-10-06', '03:00', 'morning', '2026-10-06'],
    ['2026-10-06', '10:00', 'daytime', '2026-10-06'],
    ['2026-10-06', '18:00', 'evening', '2026-10-06'],
  ];
  for (const [day, time, slot, checkinDay] of moments) {
    const moment = local(day, time);
    assert.equal(currentWellnessSlot(moment), slot, `${day} ${time} slot`);
    assert.equal(currentCheckinDay(moment), checkinDay, `${day} ${time} check-in day`);
    assert.equal(today(moment), day, `${day} ${time} calendar day`);
  }
  // Month, year and leap-day ends.
  assert.equal(currentCheckinDay(local('2027-01-01', '00:30')), '2026-12-31');
  assert.equal(today(local('2027-01-01', '00:30')), '2027-01-01');
  assert.equal(slotAt('2027-01-01', '00:30'), 'evening');
  assert.equal(currentCheckinDay(local('2026-03-01', '02:59')), '2026-02-28');
  assert.equal(currentCheckinDay(local('2028-03-01', '00:00')), '2028-02-29');
  assert.equal(currentCheckinDay(local('2028-03-01', '03:00')), '2028-03-01');
  // One evening is one (day, window) pair on both sides of midnight.
  assert.equal(`${currentCheckinDay(local('2026-10-05', '20:00'))} ${slotAt('2026-10-05', '20:00')}`, `${currentCheckinDay(local('2026-10-06', '01:30'))} ${slotAt('2026-10-06', '01:30')}`);
});

test('daylight saving changes keep the windows on the local wall clock', () => {
  // Spring forward, 29 March 2026: 01:59 CET is followed by 03:00 CEST; the hour 02 does not exist.
  const beforeSpring = new Date('2026-03-29T00:59:00Z'), afterSpring = new Date('2026-03-29T01:00:00Z');
  assert.deepEqual([beforeSpring.getHours(), beforeSpring.getMinutes(), afterSpring.getHours()], [1, 59, 3]);
  assert.equal(currentWellnessSlot(beforeSpring), 'evening');
  assert.equal(currentWellnessSlot(afterSpring), 'morning');
  assert.equal(today(beforeSpring), '2026-03-29');
  assert.equal(today(afterSpring), '2026-03-29');
  // Fall back, 25 October 2026: 02:00-02:59 happens twice and is the evening window both times.
  const firstPass = new Date('2026-10-25T00:30:00Z'), secondPass = new Date('2026-10-25T01:30:00Z'), three = new Date('2026-10-25T02:00:00Z');
  assert.deepEqual([firstPass.getHours(), secondPass.getHours(), three.getHours()], [2, 2, 3]);
  assert.equal(currentWellnessSlot(firstPass), 'evening');
  assert.equal(currentWellnessSlot(secondPass), 'evening');
  assert.equal(currentWellnessSlot(three), 'morning');
  for (const moment of [firstPass, secondPass, three]) assert.equal(today(moment), '2026-10-25');
  // The small hours of both changeover nights belong to the previous day's evening.
  assert.equal(currentCheckinDay(beforeSpring), '2026-03-28');
  assert.equal(currentCheckinDay(afterSpring), '2026-03-29');
  assert.equal(currentCheckinDay(new Date('2026-03-28T23:30:00Z')), '2026-03-28');
  assert.equal(currentCheckinDay(firstPass), '2026-10-24');
  assert.equal(currentCheckinDay(secondPass), '2026-10-24');
  assert.equal(currentCheckinDay(three), '2026-10-25');
  // The other boundaries on both changeover days.
  for (const day of ['2026-03-29', '2026-10-25']) {
    assert.equal(slotAt(day, '09:59'), 'morning'); assert.equal(slotAt(day, '10:00'), 'daytime');
    assert.equal(slotAt(day, '17:59'), 'daytime'); assert.equal(slotAt(day, '18:00'), 'evening');
  }
});

test('one shared rule: no other source file derives a check-in window from the clock', () => {
  const sources = [];
  const walk = directory => { for (const entry of fs.readdirSync(directory, { withFileTypes: true })) { const full = path.join(directory, entry.name); if (entry.isDirectory()) walk(full); else if (/\.tsx?$/.test(entry.name)) sources.push(full); } };
  walk(path.join(root, 'mobile/src'));
  const relative = file => path.relative(root, file).replaceAll('\\', '/');
  const readsHours = sources.filter(file => /\.getHours\(/.test(fs.readFileSync(file, 'utf8'))).map(relative);
  assert.deepEqual(readsHours, ['mobile/src/features/shared/localTime.ts']);
  const users = sources.filter(file => /\bcurrentWellnessSlot\(/.test(fs.readFileSync(file, 'utf8'))).map(relative).sort();
  assert.deepEqual(users, ['mobile/src/features/navigation/useAppNavigation.ts', 'mobile/src/features/shared/localTime.ts', 'mobile/src/features/today/useLocalDay.ts', 'mobile/src/ui/WellnessView.tsx']);
});

function openDatabase(filename) {
  const connection = new DatabaseSync(filename);
  let tail = Promise.resolve();
  const enqueue = operation => { const result = tail.then(operation); tail = result.catch(() => {}); return result; };
  const executor = {
    async execute(sql, params = []) { return { changes: Number(connection.prepare(sql).run(...params).changes) }; },
    async query(sql, params = []) { return connection.prepare(sql).all(...params); },
  };
  return {
    execute: (sql, params) => enqueue(() => executor.execute(sql, params)),
    query: (sql, params) => enqueue(() => executor.query(sql, params)),
    transaction: operation => enqueue(async () => {
      connection.exec('BEGIN IMMEDIATE');
      try { const result = await operation(executor); connection.exec('COMMIT'); return result; }
      catch (error) { connection.exec('ROLLBACK'); throw error; }
    }),
    close: () => enqueue(() => connection.close()),
    raw: connection,
  };
}

test('saved entries keep their slot and date; reopening the journal does not reclassify them', async context => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'trainleaf-checkin-hours-'));
  const filename = path.join(directory, 'training.sqlite');
  const databases = [];
  context.after(async () => { for (const database of databases) await database.close().catch(() => {}); await rm(directory, { recursive: true, force: true }); });
  const open = () => { const database = openDatabase(filename); databases.push(database); return database; };
  const first = open();
  const repository = await createLocalRepository(first);
  await repository.saveProfile({ displayName: 'Alicja', roles: ['athlete'], sportIds: ['ultimate'], modules: ['journal'] });
  const own = { profileId: 'local-profile' };
  // Windows of 0.4.0: a late-morning entry (11:30) and a small-hours entry (01:30) were both "morning"; 0.4.1 would name them differently.
  await repository.createWellness({ ...own, date: '2026-09-30', slot: 'morning', answers: { sleepHours: 7.5, fatigue: 3 }, notes: 'Zapis z 11:30 według starych okien' });
  await repository.createWellness({ ...own, date: '2026-10-01', slot: 'morning', answers: { sleepQuality: 4 }, notes: 'Zapis z 01:30 według starych okien' });
  await repository.createWellness({ ...own, date: '2026-10-01', slot: 'daytime', answers: { energy: 4 }, notes: '' });
  await repository.createWellness({ ...own, date: '2026-10-01', slot: 'evening', answers: { recovery: 5 }, notes: '' });
  const before = (await repository.readSnapshot()).wellness;
  const rowsBefore = first.raw.prepare('SELECT * FROM local_wellness ORDER BY id').all();
  assert.equal(before.length, 4);
  await first.close();
  const reopened = await createLocalRepository(open());
  const after = (await reopened.readSnapshot()).wellness;
  assert.deepEqual(after, before);
  assert.deepEqual(databases[1].raw.prepare('SELECT * FROM local_wellness ORDER BY id').all(), rowsBefore);
  assert.deepEqual(after.map(entry => `${entry.date} ${entry.slot}`).sort(), ['2026-09-30 morning', '2026-10-01 daytime', '2026-10-01 evening', '2026-10-01 morning']);
  // One entry per date and window still holds.
  await assert.rejects(reopened.createWellness({ ...own, date: '2026-10-01', slot: 'evening', answers: { stress: 2 }, notes: '' }));
});
