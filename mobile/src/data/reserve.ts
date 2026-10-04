import type { TrainingQuiz, TrainingType, Wellness, Workout } from './domain';
import { LOAD_WEIGHTS_V1 } from './load';
import { addDays, today } from './analytics';

/**
 * plan-reserve-v2: an adaptive estimate of the reserve left in the plan.
 * A separate layer on top of Trainleaf load v1: it reads saved loads and never recalculates them.
 * Deterministic and reproducible from workouts, wellbeing entries and the onboarding quiz.
 * See docs/mobile-forecast-v2.md for the formulas, sources and working assumptions.
 */
export const RESERVE_MODEL_VERSION = 'plan-reserve-v2';
export const RESERVE_PARAMETERS = Object.freeze({
  /** Short-term fatigue: the share of a session's load still counted after `d` days is 2^(-d/halfLifeDays). */
  halfLifeDays: 2, lookbackDays: 28,
  /** The bar is empty when the decayed load reaches this many tolerated weeks. */
  ceilingWeeks: 1.3,
  /** A past plan with neither a result nor a "skipped" mark counts with this share of its estimate. */
  unconfirmedPlanShare: 0.5,
  /** Fatigue ratings (0-10) standing for a perceived intensity, mapped with the load v1 multiplier. */
  intensityRating: { light: 3, moderate: 5, hard: 7 },
  untypedWeight: 1, defaultMinutes: 60,
  /** Typical minutes and intensity of a kind of session: saved sessions of the last days, shrunk to the quiz. */
  typicalWindowDays: 90, typicalPriorSessions: 3, typicalMinutesSessions: 3,
  /** Slow tolerance: weekly exposure over the last weeks blended with the quiz. */
  baselineWeeks: 6, baselinePriorWeeks: 2,
  skippedQuizWeeklyLoad: 150, minWeeklyLoad: 60, maxWeeklyLoad: 6000,
  experienceFactor: { under6m: 0.85, '6to24m': 0.95, '2to5y': 1, over5y: 1.05 },
  levelFactor: { beginner: 0.9, intermediate: 1, advanced: 1.05, competitive: 1.1 },
  rhythmFactor: { steady: 1, building: 0.9, lighter: 1.1, returning: 0.8 },
  profileFactorRange: [0.7, 1.2],
  /** A break longer than `graceDays` lowers the tolerance by `perWeek` for each further week, down to `floor`. */
  breakGraceDays: 14, breakPerWeek: 0.05, breakFloor: 0.7,
  /** Learning from wellbeing check-ins of the following days. */
  learningWindowDays: 56, learningRecencyHalfLifeDays: 21, learningStep: 0.02, learningRange: [0.8, 1.2],
  /** Strain (0-1) at or below `freshStrain` is "fresh", at or above `tiredStrain` is "tired". */
  freshStrain: 0.3, tiredStrain: 0.7,
  /** Share of the ceiling used by recent exposure: "demanding" from, "attributable" from, "calm" up to. */
  demandingShare: 0.3, attributableShare: 0.15, calmShare: 0.5,
  /** Bar colours. */
  highFrom: 0.5, mediumFrom: 0.25,
  /** Lower confidence: this share of the counted load has no saved result. */
  unverifiedShare: 0.25, coldStartWeeks: 2,
} as const);

type Kind = TrainingType | null;
export type ReserveSource = 'actual' | 'planned' | 'estimated' | 'unconfirmed';
export type ReserveContribution = { workoutId: string; date: string; source: ReserveSource; load: number };
export type ReserveLevel = 'high' | 'medium' | 'low';
export type ReserveDay = {
  date: string; reserve: number; level: ReserveLevel; confidence: 'normal' | 'lower';
  /** Decayed load on the day, split into the day's own sessions and what earlier days left. */
  fatigue: number; sameDayLoad: number; carriedLoad: number; contributions: ReserveContribution[];
};
export type ReserveEvidence = { date: string; slot: Wellness['slot']; strain: number; demand: number; direction: 1 | -1; weight: number };
export type ReserveTolerance = {
  /** Weekly load from the quiz (or the cautious default), before any history. */
  quizWeekly: number; quizSource: 'quiz' | 'default';
  /** Mean weekly exposure of the weeks with saved sessions, and the number of such weeks. */
  observedWeekly: number | null; evidenceWeeks: number; baselineWeekly: number;
  wellnessFactor: number; breakFactor: number; weekly: number; ceiling: number; evidence: ReserveEvidence[];
};
export type ReserveModel = {
  version: typeof RESERVE_MODEL_VERSION; asOf: string; parameters: typeof RESERVE_PARAMETERS;
  tolerance: ReserveTolerance; contributions: ReserveContribution[]; day(date: string): ReserveDay;
};
export type ReserveInput = { workouts: Workout[]; wellness: Wellness[]; trainingQuizzes?: TrainingQuiz[] };

const P = RESERVE_PARAMETERS;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const ratingMultiplier = (rating: number) => 0.5 + rating / 10;
const intensityMultiplier = (intensity: keyof typeof P.intensityRating) => ratingMultiplier(P.intensityRating[intensity]) ** 2;
const typeWeight = (type: Kind) => type ? LOAD_WEIGHTS_V1[type] : P.untypedWeight;
const dayDistance = (from: string, to: string) => Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86400000);
const decay = (days: number) => 2 ** (-days / P.halfLifeDays);
function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b), middle = sorted.length >> 1;
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/** Starting values derived only from the quiz. A skipped or missing quiz gives the cautious default. */
export function quizStartingPoint(quiz: TrainingQuiz | null | undefined) {
  const answers = quiz?.status === 'completed' ? quiz.answers : null;
  if (!answers) return { source: 'default' as const, weeklyLoad: P.skippedQuizWeeklyLoad, weeklyExposure: P.skippedQuizWeeklyLoad, minutes: P.defaultMinutes, overallIntensity: 1, intensity: new Map<Kind, number>() };
  const intensity = new Map<Kind, number>(answers.kinds.map(kind => [kind.type, intensityMultiplier(kind.intensity)]));
  const overallIntensity = answers.kinds.reduce((sum, kind) => sum + intensityMultiplier(kind.intensity), 0) / answers.kinds.length;
  const perMinute = answers.kinds.reduce((sum, kind) => sum + LOAD_WEIGHTS_V1[kind.type] * intensityMultiplier(kind.intensity), 0) / answers.kinds.length;
  const plainPerMinute = answers.kinds.reduce((sum, kind) => sum + LOAD_WEIGHTS_V1[kind.type], 0) / answers.kinds.length;
  const sessions = answers.sessionsPerWeek === 0 ? 0.5 : answers.sessionsPerWeek;
  const profileFactor = clamp(P.experienceFactor[answers.experience] * P.levelFactor[answers.level] * P.rhythmFactor[answers.rhythm], P.profileFactorRange[0], P.profileFactorRange[1]);
  return { source: 'quiz' as const, weeklyLoad: clamp(sessions * answers.typicalMinutes * perMinute * profileFactor, P.minWeeklyLoad, P.maxWeeklyLoad),
    weeklyExposure: clamp(sessions * answers.typicalMinutes * plainPerMinute * profileFactor, P.minWeeklyLoad, P.maxWeeklyLoad),
    minutes: answers.typicalMinutes, overallIntensity, intensity };
}

/** One check-in per day: morning and daytime describe the start of the day, an evening entry its end. */
function dailyStrain(wellness: Wellness[], asOf: string) {
  const order = { morning: 0, daytime: 1, evening: 2 } as const;
  const days = new Map<string, { slot: Wellness['slot']; strain: number }>();
  for (const entry of [...wellness].sort((a, b) => a.date.localeCompare(b.date) || order[a.slot] - order[b.slot] || a.id.localeCompare(b.id))) {
    if (entry.date > asOf || days.has(entry.date)) continue;
    const { fatigue, soreness, energy } = entry.answers;
    const parts = entry.slot === 'daytime' ? (energy === undefined ? [] : [(5 - energy) / 4]) : [fatigue, soreness].flatMap(value => value === undefined ? [] : [value / 10]);
    if (parts.length) days.set(entry.date, { slot: entry.slot, strain: parts.reduce((sum, value) => sum + value, 0) / parts.length });
  }
  return days;
}

export function buildReserveModel(input: ReserveInput, asOf = today()): ReserveModel {
  const quiz = quizStartingPoint(input.trainingQuizzes?.[0]);
  // Each session once: the newest revision of an identifier, without deleted and skipped entries.
  const latest = new Map<string, Workout>();
  for (const workout of input.workouts) {
    const known = latest.get(workout.id);
    if (!known || workout.revision > known.revision || workout.revision === known.revision && workout.updatedAt > known.updatedAt) latest.set(workout.id, workout);
  }
  const sessions = [...latest.values()].filter(workout => !workout.deletedAt && workout.status !== 'skipped')
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const performed = sessions.filter(workout => workout.status === 'completed' && workout.date <= asOf);

  // Typical intensity and minutes of each kind of session, from saved results only.
  const windowStart = addDays(asOf, -P.typicalWindowDays);
  const ratios = new Map<Kind, number[]>(), durations = new Map<Kind, number[]>();
  for (const workout of performed) {
    if (workout.date <= windowStart || workout.trainingType === 'mental') continue;
    const calculation = workout.loadCalculation, minutes = calculation?.inputs.durationMinutes ?? null;
    if (calculation && minutes && calculation.parameters.typeWeight > 0) ratios.set(workout.trainingType, [...ratios.get(workout.trainingType) ?? [], calculation.value / (minutes * calculation.parameters.typeWeight)]);
    if (workout.durationMinutes) durations.set(workout.trainingType, [...durations.get(workout.trainingType) ?? [], workout.durationMinutes]);
  }
  const typicalIntensity = (type: Kind) => {
    const prior = quiz.intensity.get(type) ?? quiz.overallIntensity, saved = ratios.get(type) ?? [];
    return saved.length ? (saved.length * median(saved) + P.typicalPriorSessions * prior) / (saved.length + P.typicalPriorSessions) : prior;
  };
  const typicalMinutes = (type: Kind) => { const saved = durations.get(type) ?? []; return saved.length >= P.typicalMinutesSessions ? median(saved) : quiz.minutes; };
  /** Expected load of a session from its kind, time and the ratings that were given. Never reads a saved result. */
  const expectedLoad = (workout: Workout, minutes: number | null, ratings: { aerobicFatigue: number | null; muscularFatigue: number | null }) => {
    if (workout.trainingType === 'mental') return 0;
    const usual = Math.sqrt(typicalIntensity(workout.trainingType));
    const aerobic = ratings.aerobicFatigue === null ? usual : ratingMultiplier(ratings.aerobicFatigue);
    const muscular = ratings.muscularFatigue === null ? usual : ratingMultiplier(ratings.muscularFatigue);
    return (minutes ?? typicalMinutes(workout.trainingType)) * typeWeight(workout.trainingType) * aerobic * muscular;
  };
  const noRatings = { aerobicFatigue: null, muscularFatigue: null };

  // Load of every session: the saved result replaces the plan, they are never added together.
  const contributions: ReserveContribution[] = sessions.map(workout => {
    const base = { workoutId: workout.id, date: workout.date };
    if (workout.status === 'completed' && workout.date <= asOf) {
      if (workout.trainingType === 'mental') return { ...base, source: 'actual', load: 0 };
      if (workout.loadCalculation) return { ...base, source: 'actual', load: workout.loadCalculation.value };
      return { ...base, source: 'estimated', load: expectedLoad(workout, workout.durationMinutes ?? workout.plannedMinutes, workout.postWorkout) };
    }
    const planned = workout.wasPlanned && workout.plannedLoadCalculation ? workout.plannedLoadCalculation.value : expectedLoad(workout, workout.plannedMinutes ?? workout.durationMinutes, workout.plannedFatigue);
    return workout.date < asOf ? { ...base, source: 'unconfirmed', load: planned * P.unconfirmedPlanShare } : { ...base, source: 'planned', load: planned };
  });
  const byDay = new Map<string, ReserveContribution[]>();
  for (const entry of contributions) byDay.set(entry.date, [...byDay.get(entry.date) ?? [], entry]);
  // Exposure of performed sessions in load units: minutes, kind and the typical intensity of that kind.
  // The plain exposure (minutes and kind only) contains no rating at all; learning uses nothing else.
  const exposureByDay = new Map<string, number>(), plainByDay = new Map<string, number>();
  for (const workout of performed) {
    const minutes = workout.durationMinutes ?? workout.plannedMinutes;
    exposureByDay.set(workout.date, (exposureByDay.get(workout.date) ?? 0) + expectedLoad(workout, minutes, noRatings));
    if (workout.trainingType !== 'mental') plainByDay.set(workout.date, (plainByDay.get(workout.date) ?? 0) + (minutes ?? typicalMinutes(workout.trainingType)) * typeWeight(workout.trainingType));
  }
  const decayed = (date: string, daily: (day: string) => number, from = 0) => {
    let sum = 0;
    for (let age = from; age <= P.lookbackDays; age++) sum += daily(addDays(date, -age)) * decay(age);
    return sum;
  };
  const dayLoad = (date: string, only?: (entry: ReserveContribution) => boolean) => (byDay.get(date) ?? []).reduce((sum, entry) => sum + (!only || only(entry) ? entry.load : 0), 0);

  // Slow tolerance, step 1: weekly exposure of the weeks with saved sessions, blended with the quiz.
  const firstPerformed = performed[0]?.date ?? null, lastPerformed = performed.at(-1)?.date ?? null;
  const weeks: number[] = [], plainWeeks: number[] = [];
  for (let index = 0; index < P.baselineWeeks; index++) {
    const end = addDays(asOf, -7 * index), start = addDays(end, -6);
    if (!firstPerformed || start < firstPerformed) break;
    let sum = 0, plain = 0;
    for (let offset = 0; offset < 7; offset++) { sum += exposureByDay.get(addDays(start, offset)) ?? 0; plain += plainByDay.get(addDays(start, offset)) ?? 0; }
    if (plain > 0) { weeks.push(sum); plainWeeks.push(plain); }
  }
  const observedWeekly = weeks.length ? weeks.reduce((sum, value) => sum + value, 0) / weeks.length : null;
  const baselineWeekly = (P.baselinePriorWeeks * quiz.weeklyLoad + weeks.length * (observedWeekly ?? 0)) / (P.baselinePriorWeeks + weeks.length);
  const gap = lastPerformed ? dayDistance(lastPerformed, asOf) : 0;
  const breakFactor = gap > P.breakGraceDays ? Math.max(P.breakFloor, 1 - P.breakPerWeek * (gap - P.breakGraceDays) / 7) : 1;

  // Step 2: wellbeing check-ins of the following days, compared with the exposure of performed sessions.
  // Both sides of the comparison are free of post-session ratings: plain exposure against its own weekly baseline.
  const plainWeekly = (P.baselinePriorWeeks * quiz.weeklyExposure + plainWeeks.reduce((sum, value) => sum + value, 0)) / (P.baselinePriorWeeks + plainWeeks.length);
  const plainCeiling = P.ceilingWeeks * clamp(plainWeekly, P.minWeeklyLoad, P.maxWeeklyLoad);
  const evidence: ReserveEvidence[] = [];
  for (const [date, { slot, strain }] of dailyStrain(input.wellness, asOf)) {
    const age = dayDistance(date, asOf);
    if (age > P.learningWindowDays) continue;
    const demand = decayed(date, day => plainByDay.get(day) ?? 0, slot === 'evening' ? 0 : 1) / plainCeiling;
    const direction = strain <= P.freshStrain && demand >= P.demandingShare ? 1
      : strain >= P.tiredStrain && demand >= P.attributableShare && demand <= P.calmShare ? -1 : 0;
    if (direction) evidence.push({ date, slot, strain, demand, direction, weight: 2 ** (-age / P.learningRecencyHalfLifeDays) });
  }
  const wellnessFactor = clamp(1 + P.learningStep * evidence.reduce((sum, entry) => sum + entry.direction * entry.weight, 0), P.learningRange[0], P.learningRange[1]);
  const weekly = clamp(baselineWeekly * wellnessFactor * breakFactor, P.minWeeklyLoad, P.maxWeeklyLoad);
  const ceiling = P.ceilingWeeks * weekly;
  const coldStart = quiz.source === 'default' && weeks.length < P.coldStartWeeks;

  const cache = new Map<string, ReserveDay>();
  function day(date: string): ReserveDay {
    const known = cache.get(date);
    if (known) return known;
    const fatigue = decayed(date, current => dayLoad(current)), sameDayLoad = dayLoad(date);
    const unverified = decayed(date, current => dayLoad(current, entry => entry.source === 'estimated' || entry.source === 'unconfirmed'));
    const reserve = clamp(1 - fatigue / ceiling, 0, 1);
    const result: ReserveDay = { date, reserve, level: reserve >= P.highFrom ? 'high' : reserve >= P.mediumFrom ? 'medium' : 'low',
      confidence: coldStart || fatigue > 0 && unverified / fatigue > P.unverifiedShare ? 'lower' : 'normal',
      fatigue, sameDayLoad, carriedLoad: fatigue - sameDayLoad, contributions: structuredClone(byDay.get(date) ?? []) };
    cache.set(date, result);
    return result;
  }
  return { version: RESERVE_MODEL_VERSION, asOf, parameters: RESERVE_PARAMETERS, contributions, day,
    tolerance: { quizWeekly: quiz.weeklyLoad, quizSource: quiz.source, observedWeekly, evidenceWeeks: weeks.length, baselineWeekly, wellnessFactor, breakFactor, weekly, ceiling, evidence } };
}

const models = new WeakMap<object, ReserveModel>();
/** One model per snapshot object and local day; the calendar asks for many days of the same snapshot. */
export function reserveModel(snapshot: ReserveInput, asOf = today()): ReserveModel {
  const known = models.get(snapshot);
  if (known?.asOf === asOf) return known;
  const model = buildReserveModel(snapshot, asOf);
  models.set(snapshot, model);
  return model;
}
