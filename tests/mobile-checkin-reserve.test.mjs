// 0.4.1 integration of the two features: the check-in day rule (features/shared/localTime.ts) feeding the
// plan-reserve-v2 learning step (data/reserve.ts). A check-in made after midnight is the evening of the previous day.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from '../tools/load-ts.mjs';

const { buildReserveModel, RESERVE_PARAMETERS } = loadTs('mobile/src/data/reserve.ts');
const { currentWellnessSlot, currentCheckinDay } = loadTs('mobile/src/features/shared/localTime.ts');

const stamp = '2026-10-01T10:00:00.000Z';
const meta = { profileId: 'local-profile', revision: 1, createdAt: stamp, updatedAt: stamp, syncState: 'local-only' };
const weights = { mental: 0, technical: 0.6, endurance: 0.8, running: 1.05, strength: 1.3, team: 1 };
let sequence = 0;
function done(date, minutes) {
  return { ...meta, id: `w${++sequence}`, sportId: 'ultimate', trainingType: 'team', date, title: '', status: 'completed', wasPlanned: false, deletedAt: null,
    durationMinutes: minutes, plannedMinutes: null, plannedFatigue: { aerobicFatigue: null, muscularFatigue: null }, plannedLoadCalculation: null,
    postWorkout: { aerobicFatigue: 5, muscularFatigue: 5, satisfaction: null, notes: '' },
    loadCalculation: { version: 'trainleaf-v1', inputs: { trainingType: 'team', durationMinutes: minutes, aerobicFatigue: 5, muscularFatigue: 5 },
      parameters: { weights, typeWeight: 1, fatigueMapping: { base: 0.5, perPoint: 0.1 } }, value: minutes } };
}
/** A check-in exactly as the form would create it at this local moment. */
function checkinAt(moment, answers) {
  const date = currentCheckinDay(moment), slot = currentWellnessSlot(moment);
  return { ...meta, id: `c-${date}-${slot}`, date, slot, answers, notes: '' };
}
const quiz = [{ ...meta, id: 'quiz', quizVersion: 1, status: 'completed', answeredAt: stamp,
  answers: { experience: '2to5y', level: 'intermediate', sessionsPerWeek: 4, typicalMinutes: 60, kinds: [{ type: 'team', intensity: 'moderate' }], rhythm: 'steady' } }];
const WEDNESDAY = '2026-10-07';
const workouts = () => [done('2026-10-05', 120), done('2026-10-06', 120)]; // Monday and Tuesday
const tolerance = wellness => buildReserveModel({ workouts: workouts(), wellness, trainingQuizzes: quiz }, WEDNESDAY).tolerance;
const fresh = { fatigue: 0, soreness: 0 };
const local = (day, hour, minute) => new Date(2026, 9, day, hour, minute);

test('a check-in made after midnight teaches the model as the evening of the previous day, exactly once', () => {
  const afterMidnight = checkinAt(local(6, 1, 30), fresh); // Tuesday 01:30
  assert.deepEqual([afterMidnight.date, afterMidnight.slot], ['2026-10-05', 'evening']);
  const beforeMidnight = checkinAt(local(5, 23, 30), fresh); // Monday 23:30
  assert.deepEqual([beforeMidnight.date, beforeMidnight.slot], ['2026-10-05', 'evening']);

  const late = tolerance([afterMidnight]), early = tolerance([beforeMidnight]);
  assert.equal(late.evidence.length, 1, 'counted once');
  assert.deepEqual([late.evidence[0].date, late.evidence[0].slot, late.evidence[0].direction], ['2026-10-05', 'evening', 1]);
  // Same evening, same evidence: the hour of the entry does not matter, only its day and window.
  assert.deepEqual(late.evidence, early.evidence);
  assert.equal(late.wellnessFactor, early.wellnessFactor);
  // An evening entry is compared with the load of its own day (Monday's session included), and Tuesday's session is not part of it.
  const mondayOnly = buildReserveModel({ workouts: [done('2026-10-05', 120)], wellness: [afterMidnight], trainingQuizzes: quiz }, '2026-10-05').tolerance;
  assert.equal(mondayOnly.evidence.length, 1);
  assert.ok(mondayOnly.evidence[0].demand >= RESERVE_PARAMETERS.demandingShare, 'Monday\'s own session is what the entry answers to');
  assert.equal(buildReserveModel({ workouts: [done('2026-10-06', 120)], wellness: [afterMidnight], trainingQuizzes: quiz }, WEDNESDAY).tolerance.evidence.length, 0,
    'a session of the next calendar day does not explain the entry');
});

test('the after-midnight entry does not use up the next day: the next evening is separate evidence', () => {
  const monday = checkinAt(local(6, 1, 30), fresh), tuesday = checkinAt(local(6, 20, 0), fresh);
  assert.deepEqual([tuesday.date, tuesday.slot], ['2026-10-06', 'evening']);
  const both = tolerance([monday, tuesday]);
  assert.deepEqual(both.evidence.map(entry => [entry.date, entry.slot]), [['2026-10-05', 'evening'], ['2026-10-06', 'evening']]);
  assert.ok(both.wellnessFactor > tolerance([monday]).wellnessFactor);
  assert.ok(both.wellnessFactor - 1 <= 2 * RESERVE_PARAMETERS.learningStep + 1e-12, 'two entries, at most two small steps');
});

test('one entry per day: a morning entry and a later after-midnight entry of the same day are not added together', () => {
  const morning = checkinAt(local(5, 8, 0), fresh), night = checkinAt(local(6, 2, 59), fresh);
  assert.deepEqual([morning.date, morning.slot, night.date, night.slot], ['2026-10-05', 'morning', '2026-10-05', 'evening']);
  const together = tolerance([morning, night]), morningOnly = tolerance([morning]);
  assert.deepEqual(together.evidence, morningOnly.evidence);
  assert.ok(together.evidence.length <= 1 && together.evidence.every(entry => entry.date === '2026-10-05'));
  // 03:00 is the next day's morning and a new piece of evidence at most.
  const nextMorning = checkinAt(local(6, 3, 0), fresh);
  assert.deepEqual([nextMorning.date, nextMorning.slot], ['2026-10-06', 'morning']);
  assert.ok(tolerance([night, nextMorning]).evidence.length <= 2);
  assert.deepEqual(tolerance([night, nextMorning]).evidence.map(entry => entry.date).filter((date, index, all) => all.indexOf(date) !== index), [], 'no day twice');
});

test('an entry recorded by 0.4.0 after midnight (next day, morning) stays where it was saved', () => {
  // 0.4.0 stored a 01:30 check-in on the new calendar day as "morning"; the model reads saved rows as they are.
  const legacy = { ...meta, id: 'legacy', date: '2026-10-06', slot: 'morning', answers: fresh, notes: '' };
  // A morning entry answers to the days before it, so Monday has to be demanding enough on its own.
  const evidence = buildReserveModel({ workouts: [done('2026-10-05', 240)], wellness: [legacy], trainingQuizzes: quiz }, WEDNESDAY).tolerance.evidence;
  assert.deepEqual(evidence.map(entry => [entry.date, entry.slot]), [['2026-10-06', 'morning']]);
});
