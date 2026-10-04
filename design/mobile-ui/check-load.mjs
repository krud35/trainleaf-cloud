import assert from 'node:assert/strict';
import {computeTrainleafLoad, snapshotTrainleafLoad, loadDisplay, loadSummary, LOAD_PARAMETERS} from './load-model.js';

const base = {id: 'a', date: '2026-10-03', status: 'completed', trainingType: 'strength', duration: '60', postSession: {aerobic: 5, muscular: 5, satisfaction: 8}};
const calculate = overrides => computeTrainleafLoad({...base, ...overrides});
const survey = overrides => calculate({postSession: {...base.postSession, ...overrides}});
let checks = 0;
function check(name, action) { action(); checks++; console.log(`OK ${name}`); }

check('each type uses its chosen weight and technical aliases technique', () => {
  for (const [trainingType, weight] of Object.entries(LOAD_PARAMETERS.weights)) assert.equal(calculate({trainingType}).value, 60 * weight);
  assert.equal(calculate({trainingType: 'technical'}).value, 36);
  assert.equal(calculate({trainingType: 'technical'}).inputs.trainingType, 'technical');
});
check('both fatigue modifiers, including true zero, affect result', () => {
  assert.equal(survey({aerobic: 0, muscular: 0}).value, 19.5);
  assert.equal(survey({aerobic: 0, muscular: 10}).value, 58.5);
  assert.equal(survey({aerobic: 10, muscular: 10}).value, 175.5);
  assert.equal(survey({aerobic: '0', muscular: '0'}).value, 19.5);
});
check('duration must be actual, finite and positive', () => {
  for (const duration of [null, undefined, '', '  ']) assert.equal(calculate({duration}).reason, 'missing_duration');
  for (const duration of [0, '0', -1, NaN, Infinity, 'Infinity', 'oops', false, [], {}]) assert.equal(calculate({duration}).reason, 'invalid_duration');
  assert.equal(calculate({duration: '2.5'}).value, 3.25);
  assert.equal(calculate({duration: '', planned: {duration: 60}}).reason, 'missing_duration');
});
check('missing/invalid physical ratings are never converted to zero', () => {
  for (const field of ['aerobic', 'muscular']) {
    for (const value of [null, undefined, '', '  ']) assert.equal(survey({[field]: value}).reason, `missing_${field}`);
    for (const value of [-1, 11, NaN, Infinity, 'Infinity', 'oops', false, [], {}]) assert.equal(survey({[field]: value}).reason, `invalid_${field}`);
  }
  assert.equal(calculate({postSession: null}).reason, 'missing_aerobic');
});
check('physical load requires explicit type; no inference from sport', () => {
  assert.equal(calculate({trainingType: undefined, sport: 'Trening siłowy'}).reason, 'missing_training_type');
  assert.equal(calculate({trainingType: 'other', sport: 'Bieganie'}).reason, 'unknown_training_type');
  assert.equal(calculate({trainingType: '__proto__'}).reason, 'unknown_training_type');
  assert.equal(calculate({trainingType: 'constructor'}).reason, 'unknown_training_type');
});
check('mental is zero with absent physical data but still requires completion', () => {
  const mental = calculate({trainingType: 'mental', duration: null, postSession: {aerobic: null, muscular: null}});
  assert.equal(mental.status, 'calculated'); assert.equal(mental.value, 0);
  assert.deepEqual(mental.inputs, {trainingType: 'mental', duration: null, aerobic: null, muscular: null});
  for (const status of ['planned', 'draft', undefined]) assert.equal(calculate({trainingType: 'mental', status}).reason, 'not_completed');
});
check('satisfaction and RPE do not affect this index', () => {
  assert.equal(survey({satisfaction: 0}).value, survey({satisfaction: 10}).value);
  assert.equal(calculate({rpe: 0}).value, calculate({rpe: 10}).value);
  assert(!('satisfaction' in calculate({}).inputs));
});
check('snapshot captures raw inputs and parameters, retains full precision', () => {
  const workout = {...base, duration: '13.7', postSession: {aerobic: '3', muscular: '7'}};
  const snapshot = snapshotTrainleafLoad(workout);
  assert.equal(snapshot.value, 1.3 * 13.7 * 0.8 * 1.2);
  assert.notEqual(snapshot.value, Number(snapshot.value.toFixed(1)));
  assert.equal(snapshot.inputs.aerobic, '3');
  assert.equal(snapshot.inputs.duration, '13.7');
  assert.equal(snapshot.algorithm, 'trainleaf-load-v1');
  assert.equal(snapshot.parameters.scale.offset, 0.5);
  workout.duration = 2; workout.postSession.aerobic = 10;
  assert.equal(snapshot.inputs.duration, '13.7'); assert.equal(snapshot.inputs.aerobic, '3');
  snapshot.parameters.weights.strength = 100;
  assert.equal(calculate({}).parameters.weights.strength, 1.3);
});
check('formatting rounds only display and preserves explicit zero', () => {
  assert.equal(loadDisplay(calculate({})), '78,0');
  assert.equal(loadDisplay(calculate({trainingType: 'mental'})), '0,0');
  assert.equal(loadDisplay(calculate({duration: ''})), '—');
  assert.equal(loadDisplay(null), '—');
});
check('summary includes completed sessions through today only', () => {
  const saved = {...base, loadSnapshot: snapshotTrainleafLoad(base)};
  const summary = loadSummary([saved, {...saved, status: 'planned'}, {...saved, status: 'draft'}, {...saved, date: '2026-10-04'}, {...saved, date: 'bad'}, {...saved, date: '2026-02-30'}], '2026-10-03');
  assert.equal(summary.completedCount, 1); assert.equal(summary.total, 78);
  assert.equal(summary.calculatedCount, 1); assert.equal(summary.missingCount, 0);
  assert.equal(summary.algorithmCounts['trainleaf-load-v1'], 1);
  assert.throws(() => loadSummary([], 'yesterday'), RangeError);
});
check('summary never silently recomputes missing or outdated snapshots', () => {
  const saved = {...base, loadSnapshot: {...snapshotTrainleafLoad(base), value: 17, algorithm: 'saved-previous-version'}};
  const missing = {...base};
  const unavailable = {...base, loadSnapshot: snapshotTrainleafLoad({...base, duration: ''})};
  const summary = loadSummary([saved, missing, unavailable], '2026-10-03');
  assert.equal(summary.total, 17); assert.equal(summary.calculatedCount, 1);
  assert.equal(summary.missingCount, 2); assert.equal(summary.missingByReason.missing_snapshot, 1);
  assert.equal(summary.missingByReason.missing_duration, 1);
  assert.equal(loadSummary([missing], '2026-10-03').total, null);
});
check('summary distinguishes a true mental zero from missing physical data', () => {
  const mental = {...base, trainingType: 'mental', duration: null, postSession: null};
  mental.loadSnapshot = snapshotTrainleafLoad(mental);
  const summary = loadSummary([mental, base], '2026-10-03');
  assert.equal(summary.total, 0); assert.equal(summary.calculatedCount, 1); assert.equal(summary.missingCount, 1);
  assert.equal(summary.mentalCount, 1); assert.equal(summary.mentalZeroCount, 1);
  assert.equal(loadSummary([], '2026-10-03').total, null);
});
check('invalid saved results remain unavailable; history can expose mixed versions', () => {
  const valid = snapshotTrainleafLoad(base);
  for (const value of [NaN, Infinity, -1, '78']) {
    const summary = loadSummary([{...base, loadSnapshot: {...valid, value}}], '2026-10-03');
    assert.equal(summary.total, null); assert.equal(summary.missingByReason.invalid_snapshot, 1);
  }
  const summary = loadSummary([{...base, loadSnapshot: valid}, {...base, loadSnapshot: {...valid, algorithm: 'earlier-model', value: 9}}], '2026-10-03');
  assert.equal(summary.mixedAlgorithms, true); assert.equal(summary.total, 87);
});
console.log(`Passed ${checks} load-model checks.`);
