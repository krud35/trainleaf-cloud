import type { Wellness } from '../../data/domain';
import { addDays, today } from '../../data/analytics';
import { dayCount } from '../progress/summary';
import { slotQuestions, wellnessQuestions, type WellnessMetric, type WellnessSlot } from '../../../../lib/wellness';

/** Separate slot + metric series. null/undefined are missing; finite zero is measured. */
export function wellbeingTrend(records: Wellness[], slot: WellnessSlot, metric: WellnessMetric, start: string, end: string, asOf = today()) {
  const through = end < asOf ? end : asOf;
  const days = dayCount(start, through);
  const selected = records.filter(w => w.slot === slot && w.date >= start && w.date <= through);
  const entries = slotQuestions[slot].includes(metric) ? selected.filter(w => {
    const value = w.answers[metric];
    return typeof value === 'number' && Number.isFinite(value) && value >= wellnessQuestions[metric].min && value <= wellnessQuestions[metric].max;
  }).sort((a, b) => a.date.localeCompare(b.date)) : [];
  const points = entries.map(w => ({ id: w.id, date: w.date, value: w.answers[metric]! }));
  return { points, days, entryDays: new Set(selected.map(w => w.date)).size, answeredDays: new Set(points.map(w => w.date)).size,
    average: points.length ? points.reduce((sum, p) => sum + p.value, 0) / points.length : null };
}
export function previousWellbeingTrend(records: Wellness[], slot: WellnessSlot, metric: WellnessMetric, start: string, end: string, asOf = today()) {
  const through = end < asOf ? end : asOf;
  const days = dayCount(start, through);
  return wellbeingTrend(records, slot, metric, addDays(start, -days), addDays(start, -1), asOf);
}
