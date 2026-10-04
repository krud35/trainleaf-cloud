import type { WellnessSlot } from '../../../../lib/wellness';
import { today } from '../../data/analytics';

/** First local hour of each check-in window. The evening runs past midnight, until 02:59. */
export const WELLNESS_SLOT_START_HOUR = { morning: 3, daytime: 10, evening: 18 } as const satisfies Record<WellnessSlot, number>;

/**
 * The only rule for the current check-in window, by the device's local clock:
 * morning 03:00–09:59, daytime 10:00–17:59, evening 18:00–02:59.
 * Saved entries keep the `slot` they were recorded with.
 */
export function currentWellnessSlot(date = new Date()): WellnessSlot {
  const hour = date.getHours();
  if (hour < WELLNESS_SLOT_START_HOUR.morning || hour >= WELLNESS_SLOT_START_HOUR.evening) return 'evening';
  return hour < WELLNESS_SLOT_START_HOUR.daytime ? 'morning' : 'daytime';
}

/**
 * The day a check-in made now belongs to. The evening window is one evening: between 00:00 and 02:59
 * it still belongs to the previous calendar day. Only check-ins use this; the Today screen, sessions and
 * the plan keep the calendar day (`today()`).
 */
export function currentCheckinDay(date = new Date()): string {
  if (date.getHours() >= WELLNESS_SLOT_START_HOUR.morning) return today(date);
  // Noon of the previous calendar date avoids a shift on daylight-saving nights.
  return today(new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1, 12));
}
