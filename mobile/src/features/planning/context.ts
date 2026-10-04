import type { SportId, TrainingType } from '../../data/domain';
import { addDays, monday, today } from '../../data/analytics';
import { currentTranslator } from '../../i18n';

export type PlanningContext = {
  view: 'week' | 'month' | 'season';
  day: string;
  seasonYear: number;
  periodId: string;
  sportId: SportId | '';
  trainingType: TrainingType | '';
};
export function initialPlanningContext(day = today()): PlanningContext {
  return { view: 'week', day, seasonYear: Number(day.slice(0, 4)), periodId: '', sportId: '', trainingType: '' };
}
export const monthStart = (day: string) => `${day.slice(0, 7)}-01`;
export function nextMonth(day: string, offset: number) {
  const date = new Date(`${monthStart(day)}T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  const next = date.toISOString().slice(0, 10);
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  return `${next.slice(0, 7)}-${String(Math.min(Number(day.slice(-2)), last)).padStart(2, '0')}`;
}
export function monthDays(day: string) {
  const start = monday(monthStart(day));
  const end = addDays(monthStart(nextMonth(day, 1)), -1);
  const last = addDays(monday(end), 6);
  const count = Math.round((new Date(`${last}T12:00:00Z`).getTime() - new Date(`${start}T12:00:00Z`).getTime()) / 86400000) + 1;
  return Array.from({ length: count }, (_, index) => addDays(start, index));
}
export function monthLabel(day: string) {
  return currentTranslator().date(day, 'monthYear');
}
export function dayInWeek(week: string, selected: string) {
  const offset = new Date(`${selected}T12:00:00Z`).getUTCDay();
  return addDays(monday(week), offset === 0 ? 6 : offset - 1);
}
