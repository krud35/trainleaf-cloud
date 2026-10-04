import type { Dose, Goal, LocalEvent, LocalSnapshot, Period, SportId, TrainingType, Wellness, Workout } from './domain';
import { daySchema } from './domain';
import { trainingLoad } from './load';
export { trainingLoad, fatigueMultiplier } from './load';
// The adaptive plan forecast lives in ./reserve (plan-reserve-v2).
export { muscleRolesForExercise, muscleTargetForWeek, muscleWorkSummary } from './muscles';
import { muscles, type Muscle, type Metric } from '../../../lib/domain';

export function today(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function addDays(day: string, count: number) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}
export function monday(day: string) {
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
  return addDays(day, -(weekday === 0 ? 6 : weekday - 1));
}
export const inRange = (date: string, start: string, end: string) => date >= start && date <= end;
export function isCompletedHistory(workout: Workout, asOf = today()) {
  return !workout.deletedAt && workout.status === 'completed' && workout.date <= asOf;
}
export function periodsForDate(periods: Period[], date: string): Period[] {
  const level = (period: Period) => period.level === 'macro' ? 0 : period.level === 'meso' ? 1 : period.level === 'micro' ? 2 : 3;
  return periods.filter(period => inRange(date, period.start, period.end)).sort((a, b) =>
    level(a) - level(b) || a.start.localeCompare(b.start) || b.end.localeCompare(a.end) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
}
export function trainingTotals(workouts: Workout[], start: string, end: string, sportId?: SportId | '', trainingType?: TrainingType | '') {
  const selected = workouts.filter(w => !w.deletedAt && inRange(w.date, start, end) && (!sportId || w.sportId === sportId) && (!trainingType || w.trainingType === trainingType));
  const completed = selected.filter(w => isCompletedHistory(w));
  const planned = selected.filter(w => w.wasPlanned);
  return {
    count: completed.length,
    customLoad: completed.reduce((sum, workout) => sum + (trainingLoad(workout) ?? 0), 0),
    measuredCustomLoadCount: completed.filter(workout => trainingLoad(workout) !== null).length,
    minutes: completed.reduce((sum, w) => sum + (w.durationMinutes ?? 0), 0),
    measuredMinutesCount: completed.filter(w => w.durationMinutes !== null).length,
    load: completed.reduce((sum, w) => sum + (w.durationMinutes !== null && w.rpe !== null ? w.durationMinutes * w.rpe : 0), 0),
    measuredLoadCount: completed.filter(w => w.durationMinutes !== null && w.rpe !== null).length,
    planned: planned.length,
    plannedCompleted: planned.filter(w => isCompletedHistory(w)).length,
    activeDays: new Set(completed.map(w => w.date)).size,
  };
}
export function weeklyTrend(workouts: Workout[], anchor: string, sportId?: SportId | '', trainingType?: TrainingType | '') {
  const first = addDays(monday(anchor), -49);
  return Array.from({ length: 8 }, (_, i) => {
    const start = addDays(first, i * 7);
    return { start, end: addDays(start, 6), ...trainingTotals(workouts, start, addDays(start, 6), sportId, trainingType) };
  });
}
export type GoalProgress = {
  start: string; end: string; actual: number | null; target: number; percent: number | null;
  met: boolean | null; hasData: boolean; observedDays: number; expectedDays: number;
};
/** Count only recorded observations. Coverage is elapsed calendar days, never an inferred health score. */
export function goalProgress(goal: Goal, workouts: Workout[], anchor = today(), wellness: Wellness[] = []): GoalProgress {
  const start = goal.cadence === 'weekly' ? monday(anchor) : goal.start!;
  const end = goal.cadence === 'weekly' ? addDays(start, 6) : goal.end!;
  const asOf = today(), elapsedEnd = end < asOf ? end : asOf;
  const expectedDays = elapsedEnd < start ? 0 : Math.round((Date.parse(`${elapsedEnd}T12:00:00Z`) - Date.parse(`${start}T12:00:00Z`)) / 86400000) + 1;
  let actual: number | null, observedDays: number, hasData: boolean;
  if (goal.metric === 'checkinDays' || goal.metric === 'sleepAverageHours') {
    const records = wellness.filter(entry => entry.profileId === goal.profileId && entry.date <= asOf && inRange(entry.date, start, end));
    if (goal.metric === 'checkinDays') {
      observedDays = new Set(records.map(entry => entry.date)).size;
      actual = observedDays;
    } else {
      // The repository enforces one morning entry per profile/day. A map also prevents
      // duplicate caller records from counting the same night more than once.
      const recordedSleep = new Map(records.filter(entry => entry.slot === 'morning' && typeof entry.answers.sleepHours === 'number')
        .map(entry => [entry.date, entry.answers.sleepHours!]));
      observedDays = recordedSleep.size;
      actual = observedDays ? [...recordedSleep.values()].reduce((sum, hours) => sum + hours, 0) / observedDays : null;
    }
    hasData = observedDays > 0;
  } else {
    const completed = workouts.filter(workout => workout.profileId === goal.profileId && isCompletedHistory(workout, asOf)
      && inRange(workout.date, start, end) && (!goal.sportId || workout.sportId === goal.sportId));
    const observed = goal.metric === 'minutes' ? completed.filter(workout => workout.durationMinutes !== null) : completed;
    observedDays = new Set(observed.map(workout => workout.date)).size;
    hasData = observed.length > 0;
    actual = goal.metric === 'count' ? completed.length : goal.metric === 'activeDays' ? observedDays
      : observed.reduce((sum, workout) => sum + (workout.durationMinutes ?? 0), 0);
  }
  const rawPercent = actual === null ? null : Math.round(actual / goal.target * 100);
  const percent = goal.metric === 'sleepAverageHours' && rawPercent !== null ? Math.min(actual !== null && actual >= goal.target ? 100 : 99, rawPercent) : rawPercent;
  return { start, end, actual, target: goal.target, percent, met: hasData && actual !== null ? actual >= goal.target : null,
    hasData, observedDays, expectedDays };
}

/** Calendar ranges and multi-day events use inclusive day boundaries. */
export function dateRangesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  return startA <= endA && startB <= endB && startA <= endB && startB <= endA;
}
export function eventsInRange(events: LocalEvent[], start: string, end: string): LocalEvent[] {
  return events.filter(event => dateRangesOverlap(event.start, event.end, start, end)).sort((a, b) =>
    a.start.localeCompare(b.start) || (a.time ?? '').localeCompare(b.time ?? '') || a.end.localeCompare(b.end)
    || a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
}
export function eventsForDate(events: LocalEvent[], date: string): LocalEvent[] { return eventsInRange(events, date, date); }
export function eventsForWeek(events: LocalEvent[], anchor: string): LocalEvent[] {
  const start = monday(anchor);
  return eventsInRange(events, start, addDays(start, 6));
}
export function monthRange(anchor: string): { start: string; end: string } {
  daySchema.parse(anchor);
  const start = `${anchor.slice(0, 7)}-01`;
  const last = new Date(`${start}T12:00:00Z`);
  last.setUTCMonth(last.getUTCMonth() + 1);
  last.setUTCDate(0);
  return { start, end: last.toISOString().slice(0, 10) };
}
export function eventsForMonth(events: LocalEvent[], anchor: string): LocalEvent[] {
  const range = monthRange(anchor);
  return eventsInRange(events, range.start, range.end);
}

export function exerciseVolumes(workouts: Workout[], start: string, end: string, sportId?: SportId | '', trainingType?: TrainingType | '') {
  const metrics = ['kg', 'reps', 'meters', 'throws', 'minutes'] as const;
  return metrics.map(metric => {
    let planned = 0, actual = 0, measurements = 0;
    for (const w of workouts) {
      if (w.deletedAt || !inRange(w.date, start, end) || sportId && w.sportId !== sportId || trainingType && w.trainingType !== trainingType || w.status === 'skipped') continue;
      for (const item of Object.values(w.sections).flat()) {
        if (item.exercise.metric !== metric) continue;
        planned += measuredVolume(item.planned, metric) ?? 0;
        const volume = item.actual === null ? null : measuredVolume(item.actual, metric);
        if (isCompletedHistory(w) && volume !== null) { actual += volume; measurements++; }
      }
    }
    return { metric, planned, actual, measurements };
  });
}

/** null is missing volume; zero is an explicitly measured value. RIR never substitutes for kg. */
export function measuredVolume(dose: Dose, metric: Metric): number | null {
  if (dose.sets === null || dose.quantity === null) return null;
  return dose.sets * dose.quantity * (metric === 'kg' ? dose.kg : 1);
}
type MuscleCount = { exerciseCount: number; sets: number | null; missingSetsCount: number };
/** Planned positions only; each position contributes once, with fractional sets weighted by muscle shares. */
export function weeklyPlannedMuscles(workouts: Workout[], start: string, end: string, sportId?: SportId | '', trainingType?: TrainingType | '') {
  const counts = Object.fromEntries(Object.keys(muscles).map(key => [key, { exerciseCount: 0, sets: null, missingSetsCount: 0 }])) as Record<Muscle, MuscleCount>;
  const unassigned: MuscleCount = { exerciseCount: 0, sets: null, missingSetsCount: 0 };
  let exerciseCount = 0, sets: number | null = null, measuredSetsCount = 0, missingSetsCount = 0;
  const add = (target: MuscleCount, plannedSets: number | null, weight: number) => {
    target.exerciseCount++;
    if (plannedSets === null) target.missingSetsCount++;
    else target.sets = (target.sets ?? 0) + plannedSets * weight;
  };
  for (const workout of workouts) {
    if (workout.deletedAt || !workout.wasPlanned || workout.status === 'skipped' || !inRange(workout.date, start, end)
      || sportId && workout.sportId !== sportId || trainingType && workout.trainingType !== trainingType) continue;
    for (const item of Object.values(workout.sections).flat()) {
      exerciseCount++;
      if (item.planned.sets === null) missingSetsCount++;
      else { sets = (sets ?? 0) + item.planned.sets; measuredSetsCount++; }
      const shares = item.exercise.shares.filter(share => share.weight > 0);
      if (!shares.length) add(unassigned, item.planned.sets, 1);
      for (const share of shares) add(counts[share.muscle], item.planned.sets, share.weight);
    }
  }
  return { exerciseCount, sets, measuredSetsCount, missingSetsCount,
    muscles: (Object.entries(counts) as [Muscle, MuscleCount][]).map(([muscle, count]) => ({ muscle, name: muscles[muscle], ...count })), unassigned };
}

/** Quote every field and prevent spreadsheet formula execution, including leading whitespace. */
function csvCell(value: unknown) {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[\s\u0000-\u001f]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function snapshotCsv(snapshot: LocalSnapshot) {
  const rows: unknown[][] = [['typ', 'id', 'data', 'nazwa', 'sport', 'status', 'czas_wykonany_min', 'RPE_0_10', 'notatki', 'typ_treningu', 'load_v1', 'wersja_load', 'pelny_rekord_JSON']];
  const append = (type: string, record: object, fields: unknown[]) => {
    const calculation = 'loadCalculation' in record ? (record as Workout).loadCalculation : null;
    rows.push([type, ...fields, 'trainingType' in record ? record.trainingType : '', calculation?.value, calculation?.version, JSON.stringify(record)]);
  };
  if (snapshot.profile) append('profil', snapshot.profile, [snapshot.profile.id, '', snapshot.profile.displayName, snapshot.profile.sportIds.join(';'), '', '', '', '']);
  for (const w of snapshot.workouts) append('trening', w, [w.id, w.date, w.title, w.sportId, w.status, w.durationMinutes, w.rpe, w.notes]);
  for (const e of snapshot.customExercises) append('cwiczenie', e, [e.id, '', e.name, '', e.archivedAt ? 'archiwum' : 'aktywne', '', '', e.notes]);
  for (const e of snapshot.exerciseNotes) append('notatka_cwiczenia', e, [e.id, '', e.exerciseId, '', '', '', '', e.notes]);
  for (const t of snapshot.templates) append('szablon', t, [t.id, '', t.name, t.sportId, t.section, '', '', t.notes]);
  for (const p of snapshot.periods) append('okres', p, [p.id, p.start, p.name, '', '', '', '', p.description]);
  for (const w of snapshot.wellness) append('samopoczucie', w, [w.id, w.date, w.slot, '', '', '', '', w.notes]);
  for (const g of snapshot.goals) append('cel', g, [g.id, g.start, g.name, g.sportId, g.cadence, '', '', '']);
  for (const event of snapshot.events ?? []) append('wydarzenie', event, [event.id, event.start, event.title, '', event.kind, '', '', event.notes]);
  for (const reference of snapshot.readinessReferences ?? []) append('odniesienie_prognozy', reference, [reference.id, reference.weekStart, reference.name, '', reference.source, '', '', '']);
  for (const roles of snapshot.exerciseRoles ?? []) append('role_miesni', roles, [roles.id, '', roles.exerciseId, '', '', '', '', '']);
  for (const target of snapshot.muscleTargets ?? []) append('cel_miesnia', target, [target.id, target.start, target.muscle, '', target.scope, '', '', target.provenance]);
  for (const quiz of snapshot.trainingQuizzes ?? []) append('quiz_startowy', quiz, [quiz.id, quiz.answeredAt.slice(0, 10), `wersja ${quiz.quizVersion}`, '', quiz.status, '', '', '']);
  for (const d of snapshot.drafts) append('szkic', d, [d.id, '', d.kind, '', '', '', '', '']);
  return '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n');
}

