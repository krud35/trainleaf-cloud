import { test, mock } from 'node:test';
// Existing historical fixtures stay deterministic as the calendar advances.
mock.timers.enable({ apis: ['Date'], now: new Date('2026-12-31T12:00:00Z') });
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
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
const { addDays, monday, trainingTotals, weeklyTrend, goalProgress, exerciseVolumes, snapshotCsv } = loadTs('mobile/src/data/analytics.ts');
const metadata = { profileId: 'local-profile', revision: 1, createdAt: '2026-10-03T10:00:00.000Z', updatedAt: '2026-10-03T10:00:00.000Z', syncState: 'local-only' };
const sections = () => ({ warmup: [], main: [], cooldown: [] });
const workout = (id, override = {}) => ({ ...metadata, id, sportId: 'ultimate', title: 'Trening', date: '2026-10-03', status: 'completed', durationMinutes: null, rpe: null, notes: '', planNotes: '', time: null, plannedMinutes: null, periodId: null, wasPlanned: false, sections: sections(), deletedAt: null, ...override });
const goal = (override = {}) => ({ ...metadata, id: 'goal', name: 'Regularność', metric: 'count', cadence: 'weekly', target: 2, sportId: null, start: null, end: null, ...override });
const snapshot = (override = {}) => ({ epoch: 1, profile: { id: 'local-profile', displayName: 'Alicja', sportIds: ['ultimate', 'running'], modules: ['journal'], roles: ['athlete'], revision: 1, createdAt: metadata.createdAt, updatedAt: metadata.updatedAt, syncState: 'local-only' }, workouts: [], customExercises: [], exerciseNotes: [], templates: [], periods: [], wellness: [], goals: [], drafts: [], ...override });

const { muscleWorkSummary, muscleTargetForWeek, muscleRolesForExercise } = loadTs('mobile/src/data/analytics.ts');
const { calculateTrainingLoad, calculatePlannedTrainingLoad } = loadTs('mobile/src/data/load.ts');
const loadedWorkout = (id, override = {}) => { const w = workout(id,{date:'2026-10-10',trainingType:'team',durationMinutes:60,wasPlanned:true,plannedMinutes:30,plannedFatigue:{aerobicFatigue:5,muscularFatigue:5},postWorkout:{aerobicFatigue:5,muscularFatigue:5},...override}); return {...w,loadCalculation:calculateTrainingLoad(w),plannedLoadCalculation:calculatePlannedTrainingLoad(w)}; };

test('sleep goal cannot display 100 percent just below its target', () => {
  const g=goal({metric:'sleepAverageHours',target:8});
  const result=goalProgress(g,[],'2026-10-03',[{...metadata,id:'sleep',date:'2026-10-03',slot:'morning',answers:{sleepHours:7.96}}]);
  assert.equal(result.percent,99); assert.equal(result.met,false);
  const achieved=goalProgress(g,[],'2026-10-03',[{...metadata,id:'sleep',date:'2026-10-03',slot:'morning',answers:{sleepHours:8}}]);
  assert.equal(achieved.percent,100); assert.equal(achieved.met,true);
});

test('plan fatigue is separate from actual answers, mental zero is explicit and missing is not zero', () => {
  const record=loadedWorkout('a',{plannedMinutes:60,trainingType:'strength',plannedFatigue:{aerobicFatigue:0,muscularFatigue:0}});
  assert.equal(record.plannedLoadCalculation.value,19.5); assert.equal(record.loadCalculation.value,78);
  assert.equal(calculatePlannedTrainingLoad({...record,plannedFatigue:{aerobicFatigue:null,muscularFatigue:0}}),null);
  assert.equal(calculatePlannedTrainingLoad({...record,trainingType:'mental',plannedMinutes:null,plannedFatigue:{aerobicFatigue:null,muscularFatigue:null}}).value,0);



});

const resistanceItem = (id, overrides={}) => ({id,exercise:{id:'lift',name:'Przysiad',category:'strength',types:['strength'],shares:[{muscle:'chest',weight:1}]},supersetId:'group',planned:{sets:3},actual:{sets:2},muscleRoles:[{muscle:'quads',role:'direct'},{muscle:'glutes',role:'indirect'}],...overrides});
test('muscle summary counts original working sets once across supersets and exposures once per session without shares conversion', () => {
  const w=workout('w',{wasPlanned:true,sections:{warmup:[resistanceItem('warm')],main:[resistanceItem('a'),resistanceItem('b')],cooldown:[resistanceItem('c')]}});
  const planned=muscleWorkSummary([w,w],'2026-10-01','2026-10-31','planned'), actual=muscleWorkSummary([w],'2026-10-01','2026-10-31','actual');
  assert.equal(planned.muscles.find(m=>m.muscle==='quads').effectiveSets,9);
  assert.equal(planned.muscles.find(m=>m.muscle==='glutes').effectiveSets,4.5);
  assert.equal(planned.muscles.find(m=>m.muscle==='quads').exposures,1);
  assert.equal(planned.muscles.find(m=>m.muscle==='chest').effectiveSets,0);
  assert.equal(actual.muscles.find(m=>m.muscle==='quads').effectiveSets,6); assert.equal(actual.complete,true);
});

test('muscle missing roles, sets and actual are explicit and link to incomplete sessions; running never creates strength sets', () => {
  const w=workout('w',{wasPlanned:true,sections:{warmup:[],cooldown:[],main:[resistanceItem('a',{actual:null}),resistanceItem('b',{planned:{sets:null},muscleRoles:null})]}});
  const planned=muscleWorkSummary([w],'2026-10-01','2026-10-31','planned');
  assert.equal(planned.unknownRolesCount,1); assert.equal(planned.unknownSetsCount,1); assert.equal(planned.complete,false);
  assert.deepEqual(planned.incompleteWorkoutIds,['w']); assert.equal(planned.muscles.find(m=>m.muscle==='quads').knownEffectiveSets,3);
  assert.equal(planned.muscles.find(m=>m.muscle==='quads').effectiveSets,null);
  assert.equal(muscleWorkSummary([w],'2026-10-01','2026-10-31','actual').missingActualCount,1);
  const run=workout('run',{wasPlanned:true,sections:{warmup:[],cooldown:[],main:[resistanceItem('r',{exercise:{category:'running',types:['conditioning'],name:'Bieg'}})]}});
  const empty=muscleWorkSummary([run],'2026-10-01','2026-10-31','planned'); assert.equal(empty.hasData,false); assert.equal(empty.muscles[0].effectiveSets,null);
});

test('muscle targets use inclusive periods and explicit week overrides; settings roles are copied without retroactive mutation', () => {
  const target={...metadata,id:'first',muscle:'quads',unit:'effectiveSets',target:8,start:'2026-10-01',end:'2026-12-31',scope:'period',definitionRevision:1,provenance:'własny',supersedesId:null};
  const later={...target,id:'later',start:'2026-11-01',target:12,definitionRevision:2};
  const override={...target,id:'override',start:'2026-10-05',end:'2026-10-11',target:0,scope:'week-override',definitionRevision:3};
  assert.equal(muscleTargetForWeek([target,later],'quads','2026-10-10').target,8);
  assert.equal(muscleTargetForWeek([target,later,override],'quads','2026-10-11').target,0);
  assert.equal(muscleTargetForWeek([target,later],'quads','2027-01-04'),null);
  const configs=[{exerciseId:'lift',roles:[{muscle:'quads',role:'direct'}]}]; const roles=muscleRolesForExercise(configs,'lift'); roles[0].role='indirect';
  assert.equal(configs[0].roles[0].role,'direct'); assert.equal(muscleRolesForExercise(configs,'missing'),null);
});

test('an empty completed workout counts, while missing measurements remain unmeasured', () => {
  assert.deepEqual(trainingTotals([workout('empty')], '2026-10-01', '2026-10-31'), {
    count: 1, customLoad: 0, measuredCustomLoadCount: 0, minutes: 0, measuredMinutesCount: 0, load: 0, measuredLoadCount: 0,
    planned: 0, plannedCompleted: 0, activeDays: 1,
  });
});

test('zero duration and zero RPE are measured; null and non-completed measurements are excluded', () => {
  const records = [
    workout('missing', { date: '2026-10-01' }),
    workout('zero', { date: '2026-10-01', durationMinutes: 0, rpe: 0 }),
    workout('zero-effort', { date: '2026-10-02', durationMinutes: 20, rpe: 0 }),
    workout('missing-effort', { date: '2026-10-03', durationMinutes: 30 }),
    workout('missing-time', { date: '2026-10-03', rpe: 5 }),
    workout('planned', { status: 'planned', wasPlanned: true, durationMinutes: 999, rpe: 10 }),
    workout('skipped', { status: 'skipped', wasPlanned: true, durationMinutes: 999, rpe: 10 }),
  ];
  const totals = trainingTotals(records, '2026-10-01', '2026-10-31');
  assert.equal(totals.count, 5);
  assert.equal(totals.minutes, 50);
  assert.equal(totals.measuredMinutesCount, 3);
  assert.equal(totals.load, 0);
  assert.equal(totals.measuredLoadCount, 2);
  assert.equal(totals.activeDays, 3);
  const measured = trainingTotals([workout('load', { durationMinutes: 45, rpe: 6 })], '2026-10-03', '2026-10-03');
  assert.equal(measured.load, 270);
  assert.equal(measured.measuredLoadCount, 1);
});

test('plan completion denominator includes planned and skipped plans and excludes unplanned sessions', () => {
  const totals = trainingTotals([
    workout('planned-done', { wasPlanned: true }),
    workout('still-planned', { status: 'planned', wasPlanned: true }),
    workout('planned-skipped', { status: 'skipped', wasPlanned: true }),
    workout('spontaneous'),
    workout('unplanned-skipped', { status: 'skipped' }),
  ], '2026-10-03', '2026-10-03');
  assert.equal(totals.count, 2);
  assert.equal(totals.planned, 3);
  assert.equal(totals.plannedCompleted, 1);
});

test('sport and inclusive date filters apply to actual, plan, load and active-day totals', () => {
  const records = [
    workout('run-start', { sportId: 'running', date: '2026-10-01', durationMinutes: 30, rpe: 4, wasPlanned: true }),
    workout('run-end', { sportId: 'running', date: '2026-10-07', durationMinutes: 20, rpe: 3 }),
    workout('other-sport', { date: '2026-10-02', durationMinutes: 99, rpe: 9, wasPlanned: true }),
    workout('too-early', { sportId: 'running', date: '2026-09-30', durationMinutes: 99 }),
    workout('too-late', { sportId: 'running', date: '2026-10-08', durationMinutes: 99 }),
    workout('run-plan', { sportId: 'running', date: '2026-10-07', status: 'planned', wasPlanned: true }),
  ];
  assert.deepEqual(trainingTotals(records, '2026-10-01', '2026-10-07', 'running'), {
    count: 2, customLoad: 0, measuredCustomLoadCount: 0, minutes: 50, measuredMinutesCount: 2, load: 180, measuredLoadCount: 2,
    planned: 2, plannedCompleted: 1, activeDays: 2,
  });
  assert.equal(trainingTotals(records, '2026-10-01', '2026-10-07', '').count, 3);
});

test('weeks run Monday to Sunday across the year boundary, both DST changes and leap day', () => {
  const cases = [
    ['2026-01-01', '2025-12-29', '2026-01-04'],
    ['2026-03-29', '2026-03-23', '2026-03-29'],
    ['2026-03-30', '2026-03-30', '2026-04-05'],
    ['2026-10-25', '2026-10-19', '2026-10-25'],
    ['2026-10-26', '2026-10-26', '2026-11-01'],
    ['2028-02-29', '2028-02-28', '2028-03-05'],
  ];
  for (const [anchor, first, last] of cases) {
    assert.equal(monday(anchor), first, anchor);
    assert.equal(addDays(first, 6), last, anchor);
    assert.equal(addDays(last, 1), addDays(first, 7), anchor);
  }
  assert.equal(addDays('2026-03-28', 2), '2026-03-30');
  assert.equal(addDays('2026-10-24', 2), '2026-10-26');
  assert.equal(addDays('2028-02-28', 1), '2028-02-29');
  assert.equal(addDays('2028-02-29', 1), '2028-03-01');
  assert.equal(addDays('2028-03-01', -1), '2028-02-29');
  assert.equal(addDays('2027-02-28', 1), '2027-03-01');
});

test('eight weekly trend buckets stay contiguous and assign boundary sessions exactly once', () => {
  const trend = weeklyTrend([
    workout('last-sunday', { date: '2025-12-28' }),
    workout('first-monday', { date: '2025-12-29', sportId: 'running' }),
    workout('new-year-sunday', { date: '2026-01-04' }),
    workout('following-week', { date: '2026-01-05' }),
  ], '2026-01-01');
  assert.equal(trend.length, 8);
  assert.deepEqual([trend[0].start, trend[0].end], ['2025-11-10', '2025-11-16']);
  assert.deepEqual([trend.at(-1).start, trend.at(-1).end], ['2025-12-29', '2026-01-04']);
  for (let index = 1; index < trend.length; index++) assert.equal(trend[index].start, addDays(trend[index - 1].end, 1));
  assert.equal(trend.at(-2).count, 1);
  assert.equal(trend.at(-1).count, 2);
  assert.equal(trend.reduce((sum, bucket) => sum + bucket.count, 0), 3);
  assert.equal(weeklyTrend([workout('filtered', { sportId: 'ultimate' })], '2026-10-03', 'running').at(-1).count, 0);
});

test('weekly goals use the anchor week and range goals use their own dates, metric and sport', () => {
  const records = [
    workout('last-week', { date: '2025-12-28', durationMinutes: 100 }),
    workout('first', { date: '2025-12-29', durationMinutes: 15 }),
    workout('second', { date: '2026-01-04', sportId: 'running', durationMinutes: 30 }),
    workout('future', { date: '2026-01-05', durationMinutes: 100 }),
    workout('not-done', { date: '2026-01-03', status: 'planned', wasPlanned: true, plannedMinutes: 60 }),
  ];
  assert.deepEqual(goalProgress(goal(), records, '2026-01-01'), { start: '2025-12-29', end: '2026-01-04', actual: 2, target: 2, percent: 100, met: true, hasData: true, observedDays: 2, expectedDays: 7 });
  assert.deepEqual(goalProgress(goal({ cadence: 'range', start: '2025-12-29', end: '2026-01-04', metric: 'minutes', target: 60 }), records, '2030-01-01'), { start: '2025-12-29', end: '2026-01-04', actual: 45, target: 60, percent: 75, met: false, hasData: true, observedDays: 2, expectedDays: 7 });
  assert.equal(goalProgress(goal({ cadence: 'range', start: '2025-12-29', end: '2026-01-04', metric: 'minutes', target: 60, sportId: 'running' }), records, '2030-01-01').percent, 50);
  assert.equal(goalProgress(goal({ sportId: 'cycling' }), records, '2026-01-01').actual, 0);
});

test('the final snapshot counts a planned-to-completed update as the same single session', () => {
  const original = workout('same-id', { status: 'planned', wasPlanned: true, plannedMinutes: 60 });
  const finalSnapshot = snapshot({ workouts: [{ ...original, status: 'completed', revision: 2, durationMinutes: 45, rpe: 6 }] });
  const totals = trainingTotals(finalSnapshot.workouts, '2026-10-01', '2026-10-31');
  assert.equal(totals.count, 1);
  assert.equal(totals.planned, 1);
  assert.equal(totals.plannedCompleted, 1);
  assert.equal(totals.minutes, 45);
  assert.equal(goalProgress(goal(), finalSnapshot.workouts, '2026-10-03').percent, 50);
});

test('exercise volume keeps units separate and measures only completed exercises with actual values', () => {
  const item = (id, metric, planned, actual = null) => ({ id, exercise: { id: `exercise-${id}`, name: id, category: 'strength', metric, shares: [], notes: '', video: '' }, planned, actual });
  const dose = (sets, quantity, kg = 0) => ({ sets, quantity, kg });
  const records = [
    workout('done', { sections: {
      warmup: [item('run', 'meters', dose(2, 100, 999), dose(1, 120, 999))],
      main: [item('lift', 'kg', dose(3, 8, 20), dose(2, 6, 25)), item('unknown-lift', 'kg', dose(1, 10, 10)), item('no-reps', 'reps', dose(2, 5), dose(2, 0))],
      cooldown: [item('throws', 'throws', dose(1, 50)), item('time', 'minutes', dose(2, 10), dose(1, 12))],
    } }),
    workout('future-plan', { status: 'planned', wasPlanned: true, sections: { ...sections(), main: [item('plan-lift', 'kg', dose(2, 5, 10), dose(99, 99, 99)), item('plan-run', 'meters', dose(3, 50), dose(99, 999))] } }),
    workout('skipped', { status: 'skipped', wasPlanned: true, sections: { ...sections(), main: [item('skip-lift', 'kg', dose(99, 99, 99), dose(99, 99, 99)), item('skip-run', 'meters', dose(99, 999), dose(99, 999))] } }),
    workout('outside', { date: '2026-09-30', sections: { ...sections(), main: [item('outside-lift', 'kg', dose(99, 99, 99), dose(99, 99, 99))] } }),
    workout('other-sport', { sportId: 'running', sections: { ...sections(), main: [item('other-lift', 'kg', dose(1, 10, 10), dose(1, 10, 10))] } }),
  ];
  assert.deepEqual(exerciseVolumes(records, '2026-10-01', '2026-10-07', 'ultimate'), [
    { metric: 'kg', planned: 680, actual: 300, measurements: 1 },
    { metric: 'reps', planned: 10, actual: 0, measurements: 1 },
    { metric: 'meters', planned: 350, actual: 120, measurements: 1 },
    { metric: 'throws', planned: 50, actual: 0, measurements: 0 },
    { metric: 'minutes', planned: 20, actual: 12, measurements: 1 },
  ]);
  assert.deepEqual(exerciseVolumes(records, '2026-10-01', '2026-10-07')[0], { metric: 'kg', planned: 780, actual: 400, measurements: 2 });
});

// Parse standard quoted CSV independently; multiline cell content must not become a new record.
function parseCsv(csv) {
  const input = csv.replace(/^\uFEFF/, '');
  const rows = []; let row = []; let cell = ''; let quoted = false;
  for (let index = 0; index < input.length; index++) {
    const character = input[index];
    if (character === '"') {
      if (quoted && input[index + 1] === '"') { cell += '"'; index++; }
      else quoted = !quoted;
    } else if (!quoted && character === ',') { row.push(cell); cell = ''; }
    else if (!quoted && character === '\r' && input[index + 1] === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; index++; }
    else cell += character;
  }
  assert.equal(quoted, false, 'CSV must close its quoted cells');
  row.push(cell); rows.push(row); return rows;
}

test('CSV quotes every cell, uses BOM and CRLF, and preserves commas, quotes and multiline notes', () => {
  const record = workout('csv', { title: 'Trening, "techniczny"', notes: 'Pierwsza linia\r\nDruga, "z cytatem"\nTrzecia', durationMinutes: null, rpe: 0 });
  const csv = snapshotCsv(snapshot({ profile: null, workouts: [record] }));
  assert.ok(csv.startsWith('\uFEFF"typ","id"'));
  assert.ok(csv.includes('"Trening, ""techniczny"""'));
  assert.ok(csv.includes('"pelny_rekord_JSON"\r\n"trening"'));
  const rows = parseCsv(csv);
  assert.equal(rows.length, 2);
  assert.ok(rows.every(row => row.length === 13));
  assert.equal(rows[1][3], record.title);
  assert.equal(rows[1][8], record.notes);
  assert.equal(rows[1][6], '');
  assert.equal(rows[1][7], '0');
  assert.deepEqual(JSON.parse(rows[1][12]), record);
});

test('CSV neutralizes each formula prefix after whitespace and control characters', () => {
  const dangerous = ['=1+1', '+SUM(A1)', '-1+1', '@SUM(A1)', '  =1+1', '\t+2', '\r\n-2', '\u0001@cmd'];
  const records = dangerous.map((value, index) => workout(`unsafe-${index}`, { title: value, notes: value }));
  records.push(workout('safe', { title: 'Zwykła nazwa', notes: 'Tekst = bez formuły' }));
  const rows = parseCsv(snapshotCsv(snapshot({ profile: null, workouts: records }))).slice(1);
  for (let index = 0; index < dangerous.length; index++) {
    assert.equal(rows[index][3], `'${dangerous[index]}`);
    assert.equal(rows[index][8], `'${dangerous[index]}`);
    assert.deepEqual(JSON.parse(rows[index][12]), records[index], 'embedded JSON retains exact original data');
  }
  assert.equal(rows.at(-1)[3], 'Zwykła nazwa');
  assert.equal(rows.at(-1)[8], 'Tekst = bez formuły');
});

test('CSV includes the profile and every collection with the complete JSON record', () => {
  const state = snapshot({
    workouts: [workout('workout')],
    customExercises: [{ ...metadata, id: 'exercise', name: 'Własne', category: 'strength', metric: 'reps', shares: [], video: '', notes: 'opis', archivedAt: null }],
    exerciseNotes: [{ ...metadata, id: 'exercise-note', exerciseId: 'exercise', notes: 'własne wskazówki' }],
    templates: [{ ...metadata, id: 'template', name: 'Cały trening', sportId: 'ultimate', section: 'whole', sections: sections(), notes: '' }],
    periods: [{ ...metadata, id: 'period', name: 'Jesień', start: '2026-10-01', end: '2026-10-31', level: null, parentId: null, description: 'opis okresu', goal: 'cel', preset: null }],
    wellness: [{ ...metadata, id: 'wellness', date: '2026-10-03', slot: 'morning', answers: { fatigue: 0 }, notes: '' }],
    goals: [goal()],
    drafts: [{ ...metadata, id: 'draft', kind: 'workout', entityId: null, baseRevision: null, epoch: 1, raw: { incomplete: '1,' } }],
  });
  const rows = parseCsv(snapshotCsv(state));
  assert.equal(rows.length, 10);
  assert.ok(rows.every(row => row.length === 13));
  assert.deepEqual(rows.slice(1).map(row => row[0]), ['profil', 'trening', 'cwiczenie', 'notatka_cwiczenia', 'szablon', 'okres', 'samopoczucie', 'cel', 'szkic']);
  const originals = [state.profile, ...state.workouts, ...state.customExercises, ...state.exerciseNotes, ...state.templates, ...state.periods, ...state.wellness, ...state.goals, ...state.drafts];
  for (let index = 0; index < originals.length; index++) assert.deepEqual(JSON.parse(rows[index + 1][12]), originals[index]);
});


test('future imported completed sessions remain outside history, actual volume and goal progress', () => {
  const { today, isCompletedHistory } = loadTs('mobile/src/data/analytics.ts');
  const now = today(); const future = addDays(now, 1);
  const exercise = { id: 'lift', name: 'Lift', metric: 'kg', category: 'strength', shares: [], notes: '', video: '' };
  const lift = { id: 'item', exercise, planned: { sets: 2, quantity: 5, kg: 20, rir: 0 }, actual: { sets: 2, quantity: 5, kg: 20, rir: 0 } };
  const records = [workout('current', { date: now, durationMinutes: 10, rpe: 3, trainingType: 'strength', wasPlanned: true }),
    workout('future', { date: future, durationMinutes: 999, rpe: 10, wasPlanned: true, sections: { ...sections(), main: [lift] } }),
    workout('deleted', { date: now, deletedAt: metadata.createdAt, durationMinutes: 999 })];
  assert.equal(isCompletedHistory(records[1]), false);
  const totals = trainingTotals(records, now, future);
  assert.equal(totals.count, 1); assert.equal(totals.load, 30); assert.equal(totals.plannedCompleted, 1);
  assert.equal(exerciseVolumes(records, now, future)[0].actual, 0);
  assert.equal(exerciseVolumes(records, now, future)[0].measurements, 0);
  assert.equal(goalProgress(goal({ cadence: 'range', start: now, end: future }), records).actual, 1);
});

test('training type is independent of sport and filters totals, trends, volumes and CSV explicitly', () => {
  const records = [workout('strength', { sportId: 'ultimate', trainingType: 'strength', durationMinutes: 20 }),
    workout('team', { sportId: 'ultimate', trainingType: 'team', durationMinutes: 30 }),
    workout('legacy', { sportId: 'strength', trainingType: null, durationMinutes: 40 })];
  assert.equal(trainingTotals(records, '2026-10-01', '2026-10-31', '', 'strength').minutes, 20);
  assert.equal(weeklyTrend(records, '2026-10-03', 'ultimate', 'team').at(-1).count, 1);
  assert.equal(trainingTotals(records, '2026-10-01', '2026-10-31', 'strength', 'strength').count, 0);
  const rows = parseCsv(snapshotCsv(snapshot({ profile: null, workouts: records })));
  assert.equal(rows[0][9], 'typ_treningu'); assert.equal(rows[1][9], 'strength'); assert.equal(rows[3][9], '');
});

test('period matching includes all overlapping independent and hierarchical periods at both date boundaries', () => {
  const { periodsForDate } = loadTs('mobile/src/data/analytics.ts');
  const period = (id, level, start, end, parentId = null) => ({ id, name: id, level, start, end, parentId });
  const records = [period('independent', null, '2026-10-03', '2026-10-03'), period('micro', 'micro', '2026-10-03', '2026-10-09', 'meso'),
    period('meso', 'meso', '2026-10-01', '2026-10-31', 'macro'), period('macro', 'macro', '2026-01-01', '2026-12-31'),
    period('overlap', 'macro', '2026-09-01', '2026-10-03')];
  assert.deepEqual(periodsForDate(records, '2026-10-03').map(p => p.id), ['macro', 'overlap', 'meso', 'micro', 'independent']);
  assert.deepEqual(periodsForDate(records, '2026-10-09').map(p => p.id), ['macro', 'meso', 'micro']);
  assert.equal(periodsForDate(records, '2027-01-01').length, 0);
  assert.equal(records[0].id, 'independent', 'input order is not mutated');
});

test('weekly planned muscles count each planned superset position once, weight sets, and separate unassigned from missing', () => {
  const { weeklyPlannedMuscles } = loadTs('mobile/src/data/analytics.ts');
  const item = (id, sets, shares) => ({ id, supersetId: 'g', exercise: { shares }, planned: { sets, quantity: null, kg: 0, rir: null }, actual: { sets: 99 } });
  const main = [item('one', 3, [{ muscle: 'quads', weight: .75 }, { muscle: 'glutes', weight: .25 }]), item('two', 2, [{ muscle: 'quads', weight: 1 }]),
    item('three', null, [{ muscle: 'quads', weight: 1 }]), item('four', 4, []), item('five', null, [])];
  const records = [workout('plan', { wasPlanned: true, status: 'completed', trainingType: 'strength', sections: { ...sections(), main } }),
    workout('unplanned', { wasPlanned: false, sections: { ...sections(), main } }),
    workout('skipped', { wasPlanned: true, status: 'skipped', sections: { ...sections(), main } }),
    workout('outside', { wasPlanned: true, date: '2026-10-10', sections: { ...sections(), main } })];
  const result = weeklyPlannedMuscles(records, '2026-09-28', '2026-10-04');
  assert.equal(result.exerciseCount, 5); assert.equal(result.sets, 9); assert.equal(result.measuredSetsCount, 3); assert.equal(result.missingSetsCount, 2);
  assert.deepEqual(result.muscles.find(m => m.muscle === 'quads'), { muscle: 'quads', name: 'Czworogłowe uda', exerciseCount: 3, sets: 4.25, missingSetsCount: 1 });
  assert.deepEqual(result.unassigned, { exerciseCount: 2, sets: 4, missingSetsCount: 1 });
  assert.equal(result.muscles.find(m => m.muscle === 'chest').sets, null);
  assert.equal(weeklyPlannedMuscles(records, '2026-09-28', '2026-10-04', '', 'running').exerciseCount, 0);
});

test('missing dose measurements do not become measured zero; RIR does not change kilogram volume', () => {
  const { measuredVolume } = loadTs('mobile/src/data/analytics.ts');
  assert.equal(measuredVolume({ sets: null, quantity: 5, kg: 40, rir: 2 }, 'kg'), null);
  assert.equal(measuredVolume({ sets: 3, quantity: null, kg: 40, rir: 2 }, 'kg'), null);
  assert.equal(measuredVolume({ sets: 3, quantity: 0, kg: 40, rir: 2 }, 'kg'), 0);
  assert.equal(measuredVolume({ sets: 3, quantity: 5, kg: 40, rir: 100 }, 'kg'), 600);
  assert.equal(measuredVolume({ sets: 3, quantity: 5, kg: 40, rir: 0 }, 'kg'), 600);
});

test('approved fatigue mapping preserves missing ratings and maps endpoints', () => {
  const { fatigueMultiplier } = loadTs('mobile/src/data/analytics.ts');
  assert.equal(fatigueMultiplier(null), null); assert.equal(fatigueMultiplier(0), .5);
  assert.equal(fatigueMultiplier(5), 1); assert.equal(fatigueMultiplier(10), 1.5);
  for (const value of [-1, 1.5, 11, NaN, Infinity]) assert.throws(() => fatigueMultiplier(value));
});


test('device today follows local midnight in opposite time zones and stays stable over DST', () => {
  const instants = ['2026-10-02T21:59:59Z', '2026-10-02T22:00:00Z', '2026-10-03T00:30:00Z', '2026-03-29T00:59:59Z', '2026-03-29T01:00:00Z'];
  const expected = {
    'Europe/Warsaw': ['2026-10-02','2026-10-03','2026-10-03','2026-03-29','2026-03-29'],
    'America/Los_Angeles': ['2026-10-02','2026-10-02','2026-10-02','2026-03-28','2026-03-28'],
    'Pacific/Kiritimati': ['2026-10-03','2026-10-03','2026-10-03','2026-03-29','2026-03-29'],
  };
  const script = `const fs = require('node:fs'), path = require('node:path'), ts = require('typescript'); const root = ${JSON.stringify(root)}; const modules = new Map(); ${loadTs.toString()}; const {today} = loadTs('mobile/src/data/analytics.ts'); process.stdout.write(JSON.stringify(${JSON.stringify(instants)}.map(value => today(new Date(value)))));`;
  for (const [TZ, dates] of Object.entries(expected)) {
    const output = execFileSync(process.execPath, ['-e', script], { cwd: root, env: { ...process.env, TZ }, encoding: 'utf8' });
    assert.deepEqual(JSON.parse(output), dates, TZ);
  }
});


test('v1 load examples use completed actual minutes, explicit fatigue mapping and type weights with zero distinct from missing', () => {
  const { calculateTrainingLoad } = loadTs('mobile/src/data/load.ts');
  const { trainingLoad } = loadTs('mobile/src/data/analytics.ts');
  const survey = { aerobicFatigue: 5, muscularFatigue: 5, satisfaction: 10, notes: '' };
  const values = { strength: 78, running: 63, endurance: 48, technical: 36, team: 60, mental: 0 };
  const records = Object.entries(values).map(([trainingType, expected], index) => {
    const record = workout(`load-${index}`, { trainingType, durationMinutes: 60, rpe: 4, postWorkout: survey });
    record.loadCalculation = calculateTrainingLoad(record);
    assert.equal(record.loadCalculation.value, expected);
    assert.equal(record.loadCalculation.version, 'trainleaf-v1');
    assert.equal(record.loadCalculation.parameters.fatigueMapping.base, .5);
    assert.equal(record.loadCalculation.parameters.fatigueMapping.perPoint, .1);
    assert.equal(record.loadCalculation.inputs.durationMinutes, 60);
    return record;
  });
  const totals = trainingTotals(records, '2026-10-01', '2026-10-31');
  assert.equal(totals.customLoad, 285); assert.equal(totals.measuredCustomLoadCount, 6);
  assert.equal(totals.load, 1440, 'minutes × RPE remains an independent measure');
  const base = records[0];
  for (const override of [{ trainingType: null }, { durationMinutes: null }, { status: 'planned' }, { date: '2027-01-01' },
    { postWorkout: { ...survey, aerobicFatigue: null } }, { postWorkout: { ...survey, muscularFatigue: null } }])
    assert.equal(calculateTrainingLoad({ ...base, ...override }), null);
  assert.equal(calculateTrainingLoad({ ...base, durationMinutes: 0 }).value, 0);
  assert.equal(calculateTrainingLoad({ ...base, postWorkout: { ...survey, aerobicFatigue: 0, muscularFatigue: 0 } }).value, 19.5);
  assert.equal(calculateTrainingLoad({ ...base, trainingType: 'mental', durationMinutes: null, postWorkout: { aerobicFatigue: null, muscularFatigue: null } }).value, 0);
  assert.equal(calculateTrainingLoad({ ...base, postWorkout: { ...survey, satisfaction: 0 } }).value, 78);
  const precise = calculateTrainingLoad({ ...base, durationMinutes: 17, postWorkout: { ...survey, aerobicFatigue: 3, muscularFatigue: 8 } });
  assert.ok(Math.abs(precise.value - 22.984) < 1e-10);
  assert.notEqual(precise.value, Math.round(precise.value * 10) / 10, 'stored values retain precision');
  assert.equal(trainingLoad({ ...base, date: '2027-01-01' }), null);
  assert.equal(trainingLoad({ ...base, loadCalculation: { ...base.loadCalculation, value: 123 } }), 123, 'history reads stored value instead of recomputing');
  const rows = parseCsv(snapshotCsv(snapshot({ profile: null, workouts: records })));
  assert.equal(rows[1][10], '78'); assert.equal(rows[1][11], 'trainleaf-v1');
  assert.deepEqual(JSON.parse(rows[1][12]).loadCalculation.parameters, base.loadCalculation.parameters);
});


test('an unknown runtime training type has no implicit default weight or NaN calculation', () => {
  const { calculateTrainingLoad } = loadTs('mobile/src/data/load.ts');
  const base = workout('unknown-type', { durationMinutes: 60, postWorkout: { aerobicFatigue: 5, muscularFatigue: 5 } });
  for (const trainingType of ['new-unknown', 'constructor', 'toString', '__proto__', '', null, undefined])
    assert.equal(calculateTrainingLoad({ ...base, trainingType }), null);
});


test('event range, day, month and week helpers include overlaps across boundaries without duplicates or workout effects', () => {
  const { dateRangesOverlap, eventsInRange, eventsForDate, eventsForWeek, eventsForMonth, monthRange } = loadTs('mobile/src/data/analytics.ts');
  const event = (id, start, end, time = null) => ({ ...metadata, id, kind: 'event', title: id, start, end, time, notes: '', location: '', availability: null });
  const events = [event('long', '2025-12-20', '2026-02-03'), event('day', '2026-01-01', '2026-01-01', '12:00'), event('ends', '2025-12-31', '2026-01-01'), event('next', '2026-01-05', '2026-01-05')];
  assert.equal(dateRangesOverlap('2026-01-01','2026-01-03','2026-01-03','2026-01-04'), true);
  assert.deepEqual(eventsForDate(events,'2026-01-01').map(event => event.id), ['long','ends','day']);
  assert.deepEqual(eventsForWeek(events,'2026-01-01').map(event => event.id), ['long','ends','day']);
  assert.equal(eventsForMonth(events,'2026-01-15').length, 4);
  assert.equal(eventsInRange(events,'2026-02-04','2026-02-28').length, 0);
  assert.deepEqual(monthRange('2028-02-15'), { start: '2028-02-01', end: '2028-02-29' });
  assert.deepEqual(monthRange('2026-12-31'), { start: '2026-12-01', end: '2026-12-31' });
  const rows = parseCsv(snapshotCsv(snapshot({ events })));
  assert.equal(rows.filter(row => row[0] === 'wydarzenie').length, 4);
  assert.deepEqual(JSON.parse(rows.find(row => row[1] === 'long')[12]), events[0]);
  assert.equal(trainingTotals([], '2026-01-01','2026-01-31').customLoad, 0);
});

test('active-day and checkin goals deduplicate dates, isolate profiles, ignore future entries and preserve no-data assessments', () => {
  const records = [workout('a'), workout('b'), workout('other', { date:'2026-10-04', sportId:'running' }), workout('foreign',{ profileId:'someone-else', date:'2026-10-05' }), workout('planned',{status:'planned',date:'2026-10-06'})];
  const weekly = goal({ metric:'activeDays', target:2 });
  assert.equal(goalProgress(weekly, records,'2026-10-03').actual, 2);
  assert.equal(goalProgress({ ...weekly, sportId:'ultimate' }, records,'2026-10-03').actual, 1);
  const entry = (id,date,slot,profileId='local-profile') => ({...metadata,id,date,slot,profileId,answers:{fatigue:0},notes:''});
  const wellness = [entry('a','2026-10-01','morning'), entry('b','2026-10-01','evening'), entry('c','2026-10-02','daytime'), entry('foreign','2026-10-03','morning','someone-else'),entry('future','2027-01-01','morning')];
  const checkin = goalProgress(goal({ metric:'checkinDays', sportId:'cycling', target:2 }), [], '2026-10-03', wellness);
  assert.equal(checkin.actual, 2); assert.equal(checkin.observedDays, 2); assert.equal(checkin.met,true); assert.equal(checkin.expectedDays,7);
  const missing = goalProgress(weekly, [],'2026-10-03');
  assert.equal(missing.actual,0); assert.equal(missing.percent,0); assert.equal(missing.met,null); assert.equal(missing.hasData,false);
});

test('sleep goals average only recorded mornings, keep zero and missing distinct, cap progress and report elapsed coverage', () => {
  const entry = (id,date,slot,answers,profileId='local-profile') => ({...metadata,id,date,slot,answers,profileId,notes:''});
  const wellness = [entry('seven','2026-10-01','morning',{sleepHours:7}),entry('missing','2026-10-02','morning',{fatigue:0}),entry('nine','2026-10-03','morning',{sleepHours:9}),entry('wrong-slot','2026-10-04','evening',{sleepHours:24}),entry('foreign','2026-10-04','morning',{sleepHours:24},'someone-else')];
  const target = goal({ metric:'sleepAverageHours',target:7.5,sportId:'cycling' });
  const progress = goalProgress(target, [],'2026-10-03',wellness);
  assert.equal(progress.actual,8); assert.equal(progress.percent,100); assert.equal(progress.met,true); assert.equal(progress.observedDays,2); assert.equal(progress.expectedDays,7);
  const missing = goalProgress(target, [],'2026-10-03',[]);
  assert.equal(missing.actual,null); assert.equal(missing.percent,null); assert.equal(missing.met,null);
  const zero = goalProgress(target, [],'2026-10-03',[entry('zero','2026-10-03','morning',{sleepHours:0})]);
  assert.equal(zero.actual,0); assert.equal(zero.percent,0); assert.equal(zero.hasData,true); assert.equal(zero.met,false);
  const current = goalProgress(goal({metric:'checkinDays'}),[],'2026-12-31',[]); assert.equal(current.expectedDays,4);
  const future = goalProgress(goal({metric:'sleepAverageHours',cadence:'range',start:'2027-01-01',end:'2027-01-07'}),[],'2027-01-01',[]); assert.equal(future.expectedDays,0);
});
