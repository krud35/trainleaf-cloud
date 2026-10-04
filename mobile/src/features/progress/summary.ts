import type { SportId, TrainingType, Workout } from '../../data/domain';
import { addDays, isCompletedHistory, today } from '../../data/analytics';

export function dayCount(start: string, end: string) {
  return Math.max(0, Math.round((Date.parse(`${end}T12:00:00Z`) - Date.parse(`${start}T12:00:00Z`)) / 86400000) + 1);
}
/** Both periods contain exactly the same number of elapsed calendar days. */
export function comparablePeriods(anchor: string, days: number, asOf = today()) {
  const end = anchor < asOf ? anchor : asOf;
  const start = addDays(end, 1 - days);
  return { start, end, days, previousStart: addDays(start, -days), previousEnd: addDays(start, -1) };
}
export type InsightRange = 'week' | 'month' | 'six-months';
/** Labels are `wellbeing.range_<id>` in the dictionaries. */
export const insightRanges: { id: InsightRange }[] = [{ id: 'week' }, { id: 'month' }, { id: 'six-months' }];
/** Calendar week/month through the selected day; six months clamps the day in the target month. */
export function insightPeriod(anchor: string, range: InsightRange, asOf = today()) {
  const end = anchor < asOf ? anchor : asOf;
  const date = new Date(`${end}T12:00:00Z`);
  let start: string;
  if (range === 'week') start = addDays(end, -((date.getUTCDay() + 6) % 7));
  else if (range === 'month') start = `${end.slice(0, 7)}-01`;
  else {
    const day = date.getUTCDate();
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() - 6);
    const last = new Date(date.getTime());
    last.setUTCMonth(last.getUTCMonth() + 1, 0);
    date.setUTCDate(Math.min(day, last.getUTCDate()));
    start = date.toISOString().slice(0, 10);
  }
  const days = dayCount(start, end);
  return { start, end, days, previousStart: addDays(start, -days), previousEnd: addDays(start, -1) };
}
/** Only frozen load snapshots are read. No display-time recalculation. */
export function completedSummary(workouts: Workout[], start: string, end: string, sport: SportId | '' = '', type: TrainingType | '' = '', asOf = today()) {
  const completed = workouts.filter(w => isCompletedHistory(w, asOf) && w.date >= start && w.date <= end && (!sport || w.sportId === sport) && (!type || w.trainingType === type));
  const times = completed.filter(w => w.durationMinutes !== null);
  const loads = completed.filter(w => w.loadCalculation != null);
  const rpes = completed.filter(w => w.durationMinutes !== null && w.rpe !== null);
  return { count: completed.length, activeDays: new Set(completed.map(w => w.date)).size,
    minutes: times.length ? times.reduce((sum, w) => sum + w.durationMinutes!, 0) : null, measuredMinutes: times.length,
    customLoad: loads.length ? loads.reduce((sum, w) => sum + w.loadCalculation!.value, 0) : null, measuredLoad: loads.length,
    rpeLoad: rpes.length ? rpes.reduce((sum, w) => sum + w.durationMinutes! * w.rpe!, 0) : null, measuredRpe: rpes.length };
}
export function sessionBuckets(workouts: Workout[], start: string, end: string, sport: SportId | '' = '', type: TrainingType | '' = '', asOf = today()) {
  const days = dayCount(start, end);
  const size = 7;
  return Array.from({ length: Math.ceil(days / size) }, (_, i) => {
    const first = addDays(start, i * size), last = addDays(first, size - 1);
    const through = last < end ? last : end;
    return { start: first, end: through, ...completedSummary(workouts, first, through, sport, type, asOf) };
  });
}
