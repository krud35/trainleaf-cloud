// plan-reserve-v2: the adaptive forecast shown as calendar bars. These tests check the program against
// docs/mobile-forecast-v2.md; they are not a physiological validation.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from '../tools/load-ts.mjs';

const { buildReserveModel, reserveModel, quizStartingPoint, RESERVE_PARAMETERS, RESERVE_MODEL_VERSION } = loadTs('mobile/src/data/reserve.ts');
const { addDays } = loadTs('mobile/src/data/analytics.ts');
const { trainingQuizAnswersSchema } = loadTs('mobile/src/data/domain.ts');

const TODAY = '2026-10-07'; // Wednesday
const stamp = '2026-10-01T10:00:00.000Z';
const meta = { profileId: 'local-profile', revision: 1, createdAt: stamp, updatedAt: stamp, syncState: 'local-only' };
const weights = { mental: 0, technical: 0.6, endurance: 0.8, running: 1.05, strength: 1.3, team: 1 };
let sequence = 0;
/** A workout as the repository stores it; only fields the model reads matter here. */
function workout(date, override = {}) {
  return { ...meta, id: `w${++sequence}`, sportId: 'ultimate', trainingType: 'team', date, title: '', status: 'planned', wasPlanned: true, deletedAt: null,
    durationMinutes: null, plannedMinutes: 60, plannedFatigue: { aerobicFatigue: null, muscularFatigue: null }, plannedLoadCalculation: null,
    postWorkout: { aerobicFatigue: null, muscularFatigue: null, satisfaction: null, notes: '' }, loadCalculation: null, ...override };
}
function calculation(trainingType, durationMinutes, aerobicFatigue, muscularFatigue) {
  return { version: 'trainleaf-v1', inputs: { trainingType, durationMinutes, aerobicFatigue, muscularFatigue },
    parameters: { weights, typeWeight: weights[trainingType], fatigueMapping: { base: 0.5, perPoint: 0.1 } },
    value: durationMinutes * weights[trainingType] * (0.5 + aerobicFatigue / 10) * (0.5 + muscularFatigue / 10) };
}
function done(date, minutes = 60, aerobic = 5, muscular = 5, override = {}) {
  const trainingType = override.trainingType ?? 'team';
  return workout(date, { status: 'completed', wasPlanned: false, plannedMinutes: null, durationMinutes: minutes,
    postWorkout: { aerobicFatigue: aerobic, muscularFatigue: muscular, satisfaction: null, notes: '' }, loadCalculation: calculation(trainingType, minutes, aerobic, muscular), ...override });
}
function checkin(date, slot, answers) { return { ...meta, id: `c-${date}-${slot}`, date, slot, answers, notes: '' }; }
const answers = { experience: '2to5y', level: 'intermediate', sessionsPerWeek: 4, typicalMinutes: 60, kinds: [{ type: 'team', intensity: 'moderate' }], rhythm: 'steady' };
const quiz = (override = {}) => [{ ...meta, id: 'quiz', quizVersion: 1, status: 'completed', answers: { ...answers, ...override }, answeredAt: stamp }];
const skipped = [{ ...meta, id: 'quiz', quizVersion: 1, status: 'skipped', answers: null, answeredAt: stamp }];
const model = (workouts, wellness = [], trainingQuizzes = quiz(), asOf = TODAY) => buildReserveModel({ workouts, wellness, trainingQuizzes }, asOf);
const reserve = (workouts, date, ...rest) => model(workouts, ...rest).day(date).reserve;

test('the quiz gives the starting tolerance; an empty calendar shows full bars and a version', () => {
  assert.equal(RESERVE_MODEL_VERSION, 'plan-reserve-v2');
  assert.doesNotThrow(() => trainingQuizAnswersSchema.parse(answers));
  const empty = model([]);
  assert.equal(empty.version, 'plan-reserve-v2');
  assert.equal(empty.tolerance.quizWeekly, 4 * 60 * 1 * 1);
  assert.equal(empty.tolerance.weekly, 240); assert.equal(empty.tolerance.ceiling, 240 * 1.3);
  for (const date of ['2026-09-01', TODAY, '2026-12-31']) {
    const day = empty.day(date);
    assert.equal(day.reserve, 1); assert.equal(day.level, 'high'); assert.equal(day.confidence, 'normal'); assert.deepEqual(day.contributions, []);
  }
});

test('quiz answers map to bounded starting values and never use unknown options', () => {
  const start = override => quizStartingPoint(quiz(override)[0]);
  assert.equal(start().weeklyLoad, 240);
  assert.ok(start({ kinds: [{ type: 'team', intensity: 'hard' }] }).weeklyLoad > 240);
  assert.ok(start({ kinds: [{ type: 'team', intensity: 'light' }] }).weeklyLoad < 240);
  assert.ok(start({ rhythm: 'returning' }).weeklyLoad < start({ rhythm: 'building' }).weeklyLoad);
  assert.ok(start({ rhythm: 'building' }).weeklyLoad < 240 && start({ rhythm: 'lighter' }).weeklyLoad > 240);
  assert.ok(start({ experience: 'under6m', level: 'beginner' }).weeklyLoad < 240);
  assert.ok(start({ experience: 'over5y', level: 'competitive' }).weeklyLoad > 240);
  // The combined profile factor is bounded, whatever the combination.
  assert.equal(start({ experience: 'under6m', level: 'beginner', rhythm: 'returning' }).weeklyLoad, 240 * 0.7);
  assert.equal(start({ experience: 'over5y', level: 'competitive', rhythm: 'lighter' }).weeklyLoad, 240 * 1.2);
  assert.equal(start({ sessionsPerWeek: 0, typicalMinutes: 30 }).weeklyLoad, RESERVE_PARAMETERS.minWeeklyLoad);
  assert.equal(quizStartingPoint(skipped[0]).weeklyLoad, RESERVE_PARAMETERS.skippedQuizWeeklyLoad);
  assert.equal(quizStartingPoint(null).source, 'default');
  assert.throws(() => trainingQuizAnswersSchema.parse({ ...answers, kinds: [] }));
  assert.throws(() => trainingQuizAnswersSchema.parse({ ...answers, kinds: [answers.kinds[0], answers.kinds[0]] }));
  assert.throws(() => trainingQuizAnswersSchema.parse({ ...answers, future: 1 }));
});

test('adding a session changes the bar of the same day and of the following days, never of earlier days', () => {
  const day = '2026-10-09', session = workout(day);
  const before = model([]), after = model([session]);
  assert.equal(after.day(addDays(day, -1)).reserve, 1);
  assert.ok(after.day(day).reserve < before.day(day).reserve, 'the day of the session itself');
  assert.ok(after.day(addDays(day, 1)).reserve < 1, 'the next day');
  assert.ok(after.day(addDays(day, 1)).reserve > after.day(day).reserve);
  assert.equal(after.day(day).sameDayLoad, 60); assert.equal(after.day(day).carriedLoad, 0);
  assert.equal(after.day(addDays(day, 1)).sameDayLoad, 0); assert.ok(Math.abs(after.day(addDays(day, 1)).carriedLoad - 60 * 2 ** -0.5) < 1e-9);
  assert.deepEqual(after.day(day).contributions, [{ workoutId: session.id, date: day, source: 'planned', load: 60 }]);
});

test('two heavy sessions lower the bar more than one, on the same day and afterwards', () => {
  const day = '2026-10-09', heavy = () => workout(day, { plannedMinutes: 90, trainingType: 'strength' });
  const one = model([heavy()]), two = model([heavy(), heavy()]);
  for (const date of [day, addDays(day, 1), addDays(day, 2)]) assert.ok(two.day(date).reserve < one.day(date).reserve, date);
  assert.equal(two.day(day).fatigue, 2 * one.day(day).fatigue);
});

test('moving, shortening and deleting a session change the forecast at once', () => {
  const session = workout('2026-10-09', { plannedMinutes: 90 });
  const base = model([session]);
  const moved = model([{ ...session, date: '2026-10-11', revision: 2 }]);
  assert.equal(moved.day('2026-10-09').reserve, 1); assert.equal(moved.day('2026-10-10').reserve, 1);
  assert.equal(moved.day('2026-10-11').reserve, base.day('2026-10-09').reserve);
  const shorter = model([{ ...session, plannedMinutes: 30, revision: 2 }]);
  assert.ok(shorter.day('2026-10-09').reserve > base.day('2026-10-09').reserve);
  assert.ok(shorter.day('2026-10-10').reserve > base.day('2026-10-10').reserve);
  for (const removed of [[], [{ ...session, deletedAt: stamp }], [{ ...session, status: 'skipped' }]]) assert.equal(reserve(removed, '2026-10-09'), 1);
  // The model for a new snapshot object is rebuilt; the cache never returns the bars of an older snapshot.
  const first = { workouts: [session], wellness: [], trainingQuizzes: quiz() }, second = { ...first, workouts: [] };
  assert.equal(reserveModel(first, TODAY), reserveModel(first, TODAY));
  assert.ok(reserveModel(first, TODAY).day('2026-10-09').reserve < reserveModel(second, TODAY).day('2026-10-09').reserve);
});

test('a performed session uses its saved result instead of the plan and the two are never added', () => {
  const day = '2026-10-05';
  const performed = done(day, 50, 7, 7, { wasPlanned: true, plannedMinutes: 90, plannedFatigue: { aerobicFatigue: 9, muscularFatigue: 9 }, plannedLoadCalculation: calculation('team', 90, 9, 9) });
  const result = model([performed]).day(day);
  assert.deepEqual(result.contributions.map(entry => [entry.source, entry.load]), [['actual', performed.loadCalculation.value]]);
  assert.equal(result.fatigue, performed.loadCalculation.value);
  // Two stored revisions of one identifier are one session.
  const plan = { ...performed, status: 'planned', revision: 1, loadCalculation: null, durationMinutes: null };
  assert.equal(model([plan, { ...performed, revision: 2 }]).day(day).fatigue, performed.loadCalculation.value);
  assert.equal(model([{ ...performed, revision: 2 }, plan]).day(day).fatigue, performed.loadCalculation.value);
  // A result saved with a future date is still only a plan.
  const future = model([{ ...performed, date: '2026-10-09' }]).day('2026-10-09');
  assert.deepEqual(future.contributions.map(entry => entry.source), ['planned']);
  assert.equal(future.fatigue, performed.plannedLoadCalculation.value);
  // A mental session keeps its physical zero.
  assert.equal(model([done(day, 60, 5, 5, { trainingType: 'mental', loadCalculation: { ...calculation('mental', 60, 5, 5), value: 0 } })]).day(day).reserve, 1);
});

test('the effect passes from Sunday into the next week and fades with a two-day half-life', () => {
  const sunday = '2026-10-11', monday = '2026-10-12';
  assert.equal(new Date(`${sunday}T12:00:00Z`).getUTCDay(), 0);
  const result = model([workout(sunday, { plannedMinutes: 120 })]);
  assert.ok(result.day(monday).reserve < 1, 'Monday of the next week still carries Sunday');
  assert.equal(result.day(monday).sameDayLoad, 0);
  const left = age => result.day(addDays(sunday, age)).fatigue;
  assert.equal(left(0), 120); assert.ok(Math.abs(left(2) - 60) < 1e-9); assert.ok(Math.abs(left(4) - 30) < 1e-9);
  for (let age = 1; age <= RESERVE_PARAMETERS.lookbackDays; age++) assert.ok(left(age) < left(age - 1), `day ${age}`);
  assert.equal(left(RESERVE_PARAMETERS.lookbackDays + 1), 0);
  // The same holds across a month and a year.
  assert.ok(model([workout('2026-12-31', { plannedMinutes: 120 })]).day('2027-01-01').reserve < 1);
});

test('an empty day after heavy sessions is not a full bar, and the bar recovers gradually', () => {
  const sessions = ['2026-10-08', '2026-10-09', '2026-10-10'].map(date => workout(date, { plannedMinutes: 100, trainingType: 'strength' }));
  const result = model(sessions), rest = result.day('2026-10-11');
  assert.deepEqual(rest.contributions, []);
  assert.ok(rest.reserve < 0.5, `rest day after three heavy days: ${rest.reserve}`);
  assert.notEqual(rest.level, 'high');
  const following = [1, 2, 3, 4, 5, 6].map(offset => result.day(addDays('2026-10-11', offset)).reserve);
  for (let index = 1; index < following.length; index++) assert.ok(following[index] > following[index - 1]);
  assert.ok(following.at(-1) < 1);
  assert.equal(result.day('2026-10-10').level, 'low');
});

/** Five weeks of a steady habit that ends two days before TODAY; mornings are answered with `fatigue`. */
function habit(mornings, fatigue, soreness = fatigue) {
  const workouts = [], wellness = [];
  for (let age = 37; age >= 2; age--) {
    const date = addDays(TODAY, -age);
    if (age % 7 === 2 || age % 7 === 3 || age % 7 === 5) workouts.push(done(date, 75, 5, 5));
  }
  // Mornings after two consecutive training days, newest first.
  for (const age of [1, 8, 15, 22, 29].slice(0, mornings)) wellness.push(checkin(addDays(TODAY, -age), 'morning', { fatigue, soreness }));
  return { workouts, wellness };
}

test('repeated freshness after demanding days raises the tolerance step by step and within a bound', () => {
  const factors = [0, 1, 2, 3, 4, 5].map(count => { const data = habit(count, 1); return model(data.workouts, data.wellness).tolerance.wellnessFactor; });
  assert.equal(factors[0], 1);
  for (let index = 1; index < factors.length; index++) {
    assert.ok(factors[index] > factors[index - 1], `entry ${index} adds a little`);
    assert.ok(factors[index] - factors[index - 1] <= RESERVE_PARAMETERS.learningStep + 1e-12, 'never more than one step for one entry');
  }
  assert.ok(factors.at(-1) <= RESERVE_PARAMETERS.learningRange[1]);
  const fresh = habit(5, 1), neutral = habit(0, 1);
  const withEntries = model(fresh.workouts, fresh.wellness), without = model(neutral.workouts, neutral.wellness);
  assert.ok(withEntries.tolerance.ceiling > without.tolerance.ceiling);
  assert.ok(withEntries.day(TODAY).reserve > without.day(TODAY).reserve, 'the same history leaves more reserve');
  assert.ok(withEntries.tolerance.evidence.every(entry => entry.direction === 1 && entry.slot === 'morning'));
  // Many more entries cannot exceed the bound.
  const many = habit(0, 1);
  for (let age = 1; age <= 30; age++) many.wellness.push(checkin(addDays(TODAY, -age), 'evening', { fatigue: 0, soreness: 0 }));
  const bounded = model(many.workouts, many.wellness).tolerance;
  assert.ok(bounded.wellnessFactor <= RESERVE_PARAMETERS.learningRange[1] && bounded.wellnessFactor > 1.1);
});

test('repeated fatigue at a similar load lowers the tolerance step by step and within a bound', () => {
  // Mornings after a single ordinary session: the bar still showed a clear reserve.
  const data = count => {
    const result = habit(0, 0);
    for (const age of [3, 10, 17, 24].slice(0, count)) result.wellness.push(checkin(addDays(TODAY, -age), 'morning', { fatigue: 8, soreness: 8 }));
    return result;
  };
  const factors = [0, 1, 2, 3, 4].map(count => { const entry = data(count); return model(entry.workouts, entry.wellness).tolerance.wellnessFactor; });
  assert.equal(factors[0], 1);
  for (let index = 1; index < factors.length; index++) {
    assert.ok(factors[index] < factors[index - 1]);
    assert.ok(factors[index - 1] - factors[index] <= RESERVE_PARAMETERS.learningStep + 1e-12);
  }
  assert.ok(factors.at(-1) >= RESERVE_PARAMETERS.learningRange[0]);
  const tired = data(4), plain = data(0);
  assert.ok(model(tired.workouts, tired.wellness).day(TODAY).reserve < model(plain.workouts, plain.wellness).day(TODAY).reserve);
});

test('a single good or bad entry moves the tolerance by at most one small step', () => {
  for (const fatigue of [0, 10]) {
    const base = habit(0, fatigue), one = habit(1, fatigue);
    if (fatigue === 10) { one.wellness.length = 0; one.wellness.push(checkin(addDays(TODAY, -3), 'morning', { fatigue, soreness: fatigue })); }
    const before = model(base.workouts, base.wellness), after = model(one.workouts, one.wellness);
    assert.equal(after.tolerance.evidence.length, 1);
    assert.ok(Math.abs(after.tolerance.weekly / before.tolerance.weekly - 1) <= RESERVE_PARAMETERS.learningStep + 1e-12, `one entry: ${after.tolerance.weekly / before.tolerance.weekly}`);
    assert.ok(Math.abs(after.day(TODAY).reserve - before.day(TODAY).reserve) < 0.02);
  }
});

test('entries that the recent training cannot explain, and old entries, do not teach the model', () => {
  const { workouts } = habit(0, 0);
  const factor = wellness => model(workouts, wellness).tolerance.wellnessFactor;
  // Tired after a long rest: nothing to attribute to training.
  assert.equal(model([], [checkin(addDays(TODAY, -1), 'morning', { fatigue: 9, soreness: 9 })]).tolerance.wellnessFactor, 1);
  // Fresh on a light day and tired after the hardest block agree with the model.
  assert.equal(model([done(addDays(TODAY, -9), 20)], [checkin(addDays(TODAY, -8), 'morning', { fatigue: 0, soreness: 0 })]).tolerance.wellnessFactor, 1);
  const hard = [3, 4, 5, 6].map(age => done(addDays(TODAY, -age), 120));
  assert.equal(model(hard, [checkin(addDays(TODAY, -2), 'morning', { fatigue: 9, soreness: 9 })]).tolerance.wellnessFactor, 1);
  // A middle answer is not evidence either way; sleep and stress alone are not used.
  assert.equal(factor([checkin(addDays(TODAY, -1), 'morning', { fatigue: 5, soreness: 5 })]), 1);
  assert.equal(factor([checkin(addDays(TODAY, -1), 'morning', { sleepHours: 4, sleepQuality: 1 })]), 1);
  // Daytime energy is used when there is no morning entry; the first entry of a day wins.
  assert.ok(factor([checkin(addDays(TODAY, -1), 'daytime', { energy: 5 })]) > 1);
  assert.equal(model(workouts, [checkin(addDays(TODAY, -1), 'morning', { fatigue: 5, soreness: 5 }), checkin(addDays(TODAY, -1), 'evening', { fatigue: 0, soreness: 0 })]).tolerance.evidence.length, 0);
  // Recency: the same entry counts less as it ages and not at all beyond the window.
  const aged = [1, 8, 15, 22].map(age => model(workouts, [checkin(addDays(TODAY, -age), 'morning', { fatigue: 1, soreness: 1 })]).tolerance.evidence[0].weight);
  for (let index = 1; index < aged.length; index++) assert.ok(aged[index] < aged[index - 1]);
  const old = [...workouts, ...[58, 59, 61, 62].map(age => done(addDays(TODAY, -age), 75))];
  assert.equal(model(old, [checkin(addDays(TODAY, -57), 'morning', { fatigue: 0, soreness: 0 })]).tolerance.evidence.length, 0);
  // Entries dated after today are ignored.
  assert.equal(factor([checkin(addDays(TODAY, 1), 'morning', { fatigue: 0, soreness: 0 })]), 1);
});

test('future and unconfirmed plans never change the tolerance', () => {
  const { workouts, wellness } = habit(3, 1);
  const base = model(workouts, wellness).tolerance;
  const plans = [1, 2, 3, 4, 5, 6, 7, 8].map(offset => workout(addDays(TODAY, offset), { plannedMinutes: 180, trainingType: 'strength', plannedFatigue: { aerobicFatigue: 10, muscularFatigue: 10 }, plannedLoadCalculation: calculation('strength', 180, 10, 10) }));
  const pastPlans = [1, 4, 9].map(age => workout(addDays(TODAY, -age), { plannedMinutes: 180 }));
  const planned = model([...workouts, ...plans, ...pastPlans, workout(TODAY, { plannedMinutes: 200 })], wellness);
  assert.deepEqual(planned.tolerance, base);
  assert.ok(planned.day(addDays(TODAY, 2)).reserve < model(workouts, wellness).day(addDays(TODAY, 2)).reserve, 'plans change the bars only');
  // Plans alone, with wellbeing answers, are no evidence at all.
  const onlyPlans = model([...plans, ...pastPlans], [checkin(TODAY, 'morning', { fatigue: 0, soreness: 0 }), checkin(addDays(TODAY, -1), 'evening', { fatigue: 9, soreness: 9 })]);
  assert.equal(onlyPlans.tolerance.evidence.length, 0); assert.equal(onlyPlans.tolerance.weekly, 240); assert.equal(onlyPlans.tolerance.observedWeekly, null);
});

test('learning never reads post-session ratings: changing every rating leaves the evidence unchanged', () => {
  const { workouts, wellness } = habit(4, 1);
  wellness.push(checkin(addDays(TODAY, -3), 'evening', { fatigue: 8, soreness: 8 }));
  const rerated = (aerobic, muscular) => workouts.map(entry => ({ ...entry, postWorkout: { ...entry.postWorkout, aerobicFatigue: aerobic, muscularFatigue: muscular }, loadCalculation: calculation('team', entry.durationMinutes, aerobic, muscular) }));
  const base = model(workouts, wellness), easy = model(rerated(0, 0), wellness), hard = model(rerated(10, 10), wellness);
  assert.ok(base.tolerance.evidence.length >= 4);
  assert.deepEqual(easy.tolerance.evidence, base.tolerance.evidence); assert.deepEqual(hard.tolerance.evidence, base.tolerance.evidence);
  assert.equal(easy.tolerance.wellnessFactor, base.tolerance.wellnessFactor); assert.equal(hard.tolerance.wellnessFactor, base.tolerance.wellnessFactor);
  // The ratings still describe the sessions themselves: a harder rated day leaves less reserve.
  const day = workouts.at(-1).date, one = workouts.map((entry, index) => index === workouts.length - 1 ? { ...entry, loadCalculation: calculation('team', 75, 10, 10), postWorkout: { ...entry.postWorkout, aerobicFatigue: 10, muscularFatigue: 10 } } : entry);
  const single = model(one, wellness);
  assert.ok(single.day(day).reserve < base.day(day).reserve);
  assert.ok(single.tolerance.weekly / base.tolerance.weekly < 1.05, 'one hard rated session does not raise the tolerance noticeably');
});

test('what was really trained gradually replaces the quiz, and a long break lowers the tolerance', () => {
  // Twice the load the quiz described, kept for six weeks.
  const workouts = [];
  for (let age = 41; age >= 0; age--) if (age % 7 !== 3) workouts.push(done(addDays(TODAY, -age), 80));
  const weekly = [7, 14, 21, 28, 42].map(days => model(workouts.filter(entry => entry.date > addDays(TODAY, -days)), []).tolerance.weekly);
  for (let index = 1; index < weekly.length; index++) assert.ok(weekly[index] > weekly[index - 1]);
  assert.ok(weekly[0] > 240 && weekly.at(-1) < 480, 'between the quiz and the observed weeks');
  assert.equal(model(workouts.slice(-3), []).tolerance.evidenceWeeks, 0, 'less than a full week of history is not a week');
  // Weeks without entries are unknown, not rest: they do not pull the baseline down.
  const gap = workouts.filter(entry => entry.date > addDays(TODAY, -7) || entry.date <= addDays(TODAY, -21));
  assert.equal(model(gap, []).tolerance.observedWeekly, model(workouts, []).tolerance.observedWeekly);
  // A break: nothing saved for five weeks.
  const paused = model(workouts, [], quiz(), addDays(TODAY, 35));
  assert.ok(paused.tolerance.breakFactor < 1 && paused.tolerance.breakFactor >= RESERVE_PARAMETERS.breakFloor);
  assert.equal(model(workouts, [], quiz(), addDays(TODAY, 14)).tolerance.breakFactor, 1);
  assert.equal(model(workouts, [], quiz(), addDays(TODAY, 400)).tolerance.breakFactor, RESERVE_PARAMETERS.breakFloor);
  assert.equal(model(workouts, [], quiz(), addDays(TODAY, 400)).tolerance.observedWeekly, null);
});

test('missing answers, a skipped quiz and an empty history give an estimate of lower confidence, never a blocked forecast', () => {
  for (const quizzes of [skipped, [], undefined]) {
    const empty = buildReserveModel({ workouts: [], wellness: [], trainingQuizzes: quizzes }, TODAY);
    assert.equal(empty.tolerance.quizSource, 'default'); assert.equal(empty.tolerance.weekly, RESERVE_PARAMETERS.skippedQuizWeeklyLoad);
    assert.equal(empty.day(TODAY).reserve, 1); assert.equal(empty.day(TODAY).confidence, 'lower');
  }
  assert.ok(RESERVE_PARAMETERS.skippedQuizWeeklyLoad < 240, 'skipping is more cautious than an ordinary answer');
  // The audit case: an empty today and an empty history must not block the bars of planned days.
  const planned = model([workout(addDays(TODAY, 1))], [], skipped).day(addDays(TODAY, 1));
  assert.ok(planned.reserve > 0 && planned.reserve < 1);
  // A performed session without a survey is not a reported zero fatigue: it is estimated from kind and time.
  const noSurvey = workout(addDays(TODAY, -1), { status: 'completed', wasPlanned: false, plannedMinutes: null, durationMinutes: 60 });
  const estimated = model([noSurvey]).day(addDays(TODAY, -1));
  assert.deepEqual(estimated.contributions.map(entry => [entry.source, entry.load]), [['estimated', 60]]);
  assert.equal(estimated.confidence, 'lower'); assert.ok(estimated.reserve < 1);
  // One of two answers is used, the other one is the usual value of that kind of session.
  const partial = model([{ ...noSurvey, postWorkout: { ...noSurvey.postWorkout, aerobicFatigue: 9 } }]).day(addDays(TODAY, -1));
  assert.ok(Math.abs(partial.fatigue - 60 * 1.4) < 1e-9);
  // No duration at all: the usual duration from the quiz.
  assert.equal(model([{ ...noSurvey, durationMinutes: null }], [], quiz({ typicalMinutes: 45 })).day(addDays(TODAY, -1)).fatigue, 45);
  // A past plan with neither a result nor a "skipped" mark counts with half of its estimate.
  const pastPlan = model([workout(addDays(TODAY, -1))]).day(addDays(TODAY, -1));
  assert.deepEqual(pastPlan.contributions.map(entry => [entry.source, entry.load]), [['unconfirmed', 30]]);
  assert.equal(pastPlan.confidence, 'lower');
  // A saved history outweighs an uncertain entry: confidence returns to normal.
  const mostlyKnown = model([done(addDays(TODAY, -1), 90), workout(addDays(TODAY, -1), { plannedMinutes: 20 })]).day(addDays(TODAY, -1));
  assert.equal(mostlyKnown.confidence, 'normal');
  // A planned session without a kind, time or ratings still has an estimate.
  const bare = model([workout(addDays(TODAY, 2), { trainingType: null, plannedMinutes: null })]).day(addDays(TODAY, 2));
  assert.equal(bare.fatigue, 60); assert.equal(bare.confidence, 'normal');
});

test('a planned session is estimated from its kind, time, given ratings and similar earlier sessions', () => {
  const day = addDays(TODAY, 3);
  const load = (session, history = [], quizzes = quiz()) => model([...history, session], [], quizzes).day(day).sameDayLoad;
  assert.equal(load(workout(day, { plannedMinutes: 30 })), 30);
  assert.equal(load(workout(day, { trainingType: 'strength' })), 60 * 1.3);
  assert.equal(load(workout(day), [], quiz({ kinds: [{ type: 'team', intensity: 'hard' }] })), 60 * 1.2 * 1.2);
  // A kind the quiz did not name uses the mean intensity of the named kinds.
  assert.ok(Math.abs(load(workout(day, { trainingType: 'running' }), [], quiz({ kinds: [{ type: 'team', intensity: 'hard' }, { type: 'strength', intensity: 'light' }] })) - 60 * 1.05 * (1.44 + 0.64) / 2) < 1e-9);
  // Explicit planned ratings are used as given; a single rating is combined with the usual value.
  const rated = workout(day, { plannedFatigue: { aerobicFatigue: 8, muscularFatigue: 2 }, plannedLoadCalculation: calculation('team', 60, 8, 2) });
  assert.equal(load(rated), rated.plannedLoadCalculation.value);
  assert.ok(Math.abs(load(workout(day, { plannedFatigue: { aerobicFatigue: 8, muscularFatigue: null } })) - 60 * 1.3) < 1e-9);
  // Similar earlier sessions: saved hard team sessions pull the estimate up, other kinds do not.
  const hardTeam = [2, 4, 6, 9, 11, 13].map(age => done(addDays(TODAY, -age), 100, 8, 8));
  const strength = [2, 4, 6, 9, 11, 13].map(age => done(addDays(TODAY, -age), 100, 8, 8, { trainingType: 'strength', loadCalculation: calculation('strength', 100, 8, 8) }));
  const learned = load(workout(day, { plannedMinutes: null }), hardTeam);
  assert.ok(Math.abs(learned - 100 * (6 * 1.69 + 3 * 1) / 9) < 1e-9, 'median of six saved sessions shrunk towards the quiz, with their usual duration');
  assert.equal(load(workout(day), strength), 60);
  // One unusual session barely moves the estimate.
  assert.ok(load(workout(day), [done(addDays(TODAY, -2), 60, 10, 10)]) < 60 * 1.35);
  // Sessions older than the window are not "similar earlier sessions".
  assert.equal(load(workout(day), hardTeam.map(entry => ({ ...entry, date: addDays(entry.date, -120) }))), 60);
});

test('the model is deterministic, does not mutate its input and keeps saved load v1 results untouched', () => {
  const { workouts, wellness } = habit(4, 1);
  const input = { workouts: [...workouts, workout(addDays(TODAY, 1))], wellness, trainingQuizzes: quiz() };
  const copy = structuredClone(input);
  const first = buildReserveModel(input, TODAY), second = buildReserveModel(structuredClone(input), TODAY);
  const shuffled = buildReserveModel({ ...input, workouts: [...input.workouts].reverse(), wellness: [...wellness].reverse() }, TODAY);
  assert.deepEqual(input, copy);
  for (const other of [second, shuffled]) {
    assert.deepEqual(other.tolerance, first.tolerance);
    for (let offset = -30; offset <= 14; offset++) assert.deepEqual(other.day(addDays(TODAY, offset)), first.day(addDays(TODAY, offset)));
  }
  assert.ok(Object.isFrozen(RESERVE_PARAMETERS));
  for (let offset = -40; offset <= 40; offset++) { const day = first.day(addDays(TODAY, offset)); assert.ok(day.reserve >= 0 && day.reserve <= 1 && Number.isFinite(day.fatigue)); }
});
