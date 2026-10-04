import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';
mock.timers.enable({ apis: ['Date'], now: new Date('2026-10-04T12:00:00Z') });
const root = path.resolve(import.meta.dirname, '..'), require = createRequire(import.meta.url), modules = new Map();
function load(file) {
  const absolute = path.resolve(root, file);
  if (modules.has(absolute)) return modules.get(absolute).exports;
  const module = { exports: {} }; modules.set(absolute, module);
  const js = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require', 'module', 'exports', js)(name => name.startsWith('.') ? load(path.relative(root, path.resolve(path.dirname(absolute), `${name}.ts`))) : require(name), module, module.exports);
  return module.exports;
}
const { comparablePeriods, insightPeriod, completedSummary, sessionBuckets, dayCount } = load('mobile/src/features/progress/summary.ts');
const { wellbeingTrend, previousWellbeingTrend } = load('mobile/src/features/wellbeing/trends.ts');
const { goalProgress } = load('mobile/src/data/analytics.ts');
const workout = (id, props = {}) => ({ id, profileId: 'p', date: '2026-10-04', status: 'completed', deletedAt: null, sportId: 'ultimate', trainingType: 'team', durationMinutes: null, rpe: null, loadCalculation: null, ...props });
const entry = (id, date, slot, answers) => ({ id, profileId: 'p', date, slot, answers });

test('insight calendar ranges show elapsed days and compare the same inclusive length', () => {
  for (const [anchor, range, expectedStart, asOf] of [
    ['2026-10-04', 'week', '2026-09-28', '2026-10-04'],
    ['2026-10-01', 'week', '2026-09-28', '2026-10-04'],
    ['2026-10-04', 'month', '2026-10-01', '2026-10-04'],
    ['2026-10-31', 'six-months', '2026-04-30', '2026-10-31'],
    ['2024-08-31', 'six-months', '2024-02-29', '2024-08-31'],
    ['2026-11-30', 'month', '2026-10-01', '2026-10-04'],
  ]) {
    const p = insightPeriod(anchor, range, asOf);
    assert.equal(p.start, expectedStart);
    assert.equal(p.days, dayCount(p.start, p.end));
    assert.equal(p.days, dayCount(p.previousStart, p.previousEnd));
    assert.ok(p.previousEnd < p.start);
    assert.ok(p.end <= asOf);
  }
  assert.equal(insightPeriod('2026-10-01', 'month').days, 1);
});

test('rolling comparisons have equal inclusive lengths across leap days and year boundaries; future anchors clamp', () => {
  for (const [date, days, asOf] of [['2026-01-02', 7, '2026-01-02'], ['2024-03-02', 28, '2024-03-02'], ['2026-12-31', 28, '2026-10-04']]) {
    const p = comparablePeriods(date, days, asOf);
    assert.equal(dayCount(p.start, p.end), days); assert.equal(dayCount(p.previousStart, p.previousEnd), days);
    assert.ok(p.previousEnd < p.start); assert.ok(p.end <= asOf);
  }
});
test('actual work excludes future, deleted, skipped and planned; mental still counts and repeated days stay unique', () => {
  const list = [workout('a'), workout('mental', { trainingType: 'mental', durationMinutes: 30 }), workout('future', { date: '2026-10-05' }), workout('plan', { status: 'planned' }), workout('skip', { status: 'skipped' }), workout('deleted', { deletedAt: 'x' })];
  const result = completedSummary(list, '2026-10-01', '2026-10-31');
  assert.equal(result.count, 2); assert.equal(result.activeDays, 1); assert.equal(result.minutes, 30); assert.equal(result.measuredMinutes, 1);
  assert.equal(completedSummary(list, '2026-10-01', '2026-10-31', '', 'team').count, 1);
});
test('missing measurements are null while explicit zero remains measured; load is read from frozen snapshots', () => {
  assert.equal(completedSummary([workout('missing')], '2026-10-04', '2026-10-04').minutes, null);
  const r = completedSummary([workout('zero', { durationMinutes: 0, rpe: 0, loadCalculation: { value: 321.75 } })], '2026-10-04', '2026-10-04');
  assert.equal(r.minutes, 0); assert.equal(r.rpeLoad, 0); assert.equal(r.measuredMinutes, 1); assert.equal(r.customLoad, 321.75);
});
test('chart buckets cover every day once and contain the same filtered completed total as the headline', () => {
  const p = comparablePeriods('2026-10-04', 28), list = [workout('a'), workout('b', { date: p.start }), workout('c', { date: '2026-09-20', sportId: 'running' })];
  const bins = sessionBuckets(list, p.start, p.end, 'ultimate');
  assert.equal(bins.length, 4); assert.equal(bins.reduce((sum, b) => sum + dayCount(b.start, b.end), 0), 28);
  assert.equal(bins.reduce((sum, b) => sum + b.count, 0), completedSummary(list, p.start, p.end, 'ultimate').count);
  const short = sessionBuckets(list, '2026-10-01', '2026-10-04');
  assert.equal(short.length, 1);
  assert.equal(dayCount(short[0].start, short[0].end), 4);
});
test('wellbeing does not mix slots/scales, skips missing/null and future, retains measured zero', () => {
  const records = [entry('zero', '2026-10-01', 'morning', { fatigue: 0 }), entry('missing', '2026-10-02', 'morning', { fatigue: null }), entry('none', '2026-10-03', 'morning', { sleepHours: 8 }), entry('evening', '2026-10-01', 'evening', { fatigue: 10 }), entry('future', '2026-10-05', 'morning', { fatigue: 10 })];
  const r = wellbeingTrend(records, 'morning', 'fatigue', '2026-10-01', '2026-10-31');
  assert.equal(r.average, 0); assert.equal(r.answeredDays, 1); assert.equal(r.entryDays, 3); assert.equal(r.days, 4);
  assert.deepEqual(wellbeingTrend(records, 'morning', 'energy', '2026-10-01', '2026-10-04').points, []);
});
test('wellbeing comparison uses the same elapsed day denominator and missing series stays empty', () => {
  const records = [entry('old', '2026-09-29', 'daytime', { stress: 2 }), entry('now', '2026-10-03', 'daytime', { stress: 6 })];
  const current = wellbeingTrend(records, 'daytime', 'stress', '2026-10-01', '2026-10-31');
  const previous = previousWellbeingTrend(records, 'daytime', 'stress', '2026-10-01', '2026-10-31');
  assert.equal(current.days, 4); assert.equal(previous.days, 4); assert.equal(previous.average, 2);
  assert.equal(wellbeingTrend([], 'morning', 'sleepHours', '2026-10-01', '2026-10-04').average, null);
});
test('goal day denominators are unique; sleep is morning-only and no data does not fabricate achievement', () => {
  const base = { profileId: 'p', cadence: 'range', start: '2026-10-01', end: '2026-10-31', target: 7.5, sportId: 'running' };
  const records = [entry('m', '2026-10-01', 'morning', { sleepHours: 0 }), entry('e', '2026-10-01', 'evening', { fatigue: 0 }), entry('s', '2026-10-03', 'morning', { sleepHours: 9 }), entry('blank', '2026-10-04', 'morning', { fatigue: 2 }), entry('future', '2026-10-05', 'morning', { sleepHours: 24 })];
  const sleep = goalProgress({ ...base, metric: 'sleepAverageHours' }, [], undefined, records);
  assert.equal(sleep.actual, 4.5); assert.equal(sleep.observedDays, 2); assert.equal(sleep.expectedDays, 4);
  assert.equal(goalProgress({ ...base, metric: 'checkinDays' }, [], undefined, records).actual, 3);
  const empty = goalProgress({ ...base, metric: 'sleepAverageHours' }, [], undefined, []);
  assert.equal(empty.actual, null); assert.equal(empty.met, null);
  assert.equal(goalProgress({ ...base, metric: 'sleepAverageHours', target: 3 }, [], undefined, records).percent, 100);
});
test('unique training days and minute completeness are independent of session count', () => {
  const base = { profileId: 'p', cadence: 'range', start: '2026-10-01', end: '2026-10-04', target: 3, sportId: null };
  const records = [workout('one'), workout('two', { durationMinutes: 0 }), workout('other', { profileId: 'q' })];
  assert.equal(goalProgress({ ...base, metric: 'activeDays' }, records).actual, 1);
  const minutes = goalProgress({ ...base, metric: 'minutes' }, records);
  assert.equal(minutes.hasData, true); assert.equal(minutes.actual, 0); assert.equal(minutes.observedDays, 1);
});
