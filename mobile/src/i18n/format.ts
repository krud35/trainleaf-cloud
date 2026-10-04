import { formatNumber } from './core';
import { LOCALE_TAGS, type Language } from './locale';

const dateFormats = new Map<string, Intl.DateTimeFormat>();
function dateFormat(language: Language, options: Intl.DateTimeFormatOptions) {
  const key = `${language}:${JSON.stringify(options)}`;
  let format = dateFormats.get(key);
  if (!format) dateFormats.set(key, format = new Intl.DateTimeFormat(LOCALE_TAGS[language], options));
  return format;
}
/** Stored days stay `YYYY-MM-DD`; noon avoids a date shift at daylight-saving boundaries. */
const localNoon = (day: string) => new Date(`${day}T12:00:00`);
export const DATE_STYLES = {
  full: { day: 'numeric', month: 'short', year: 'numeric' },
  dayMonth: { day: 'numeric', month: 'short' },
  dayMonthLong: { day: 'numeric', month: 'long' },
  monthYear: { month: 'long', year: 'numeric' },
  monthShort: { month: 'short' },
  heading: { weekday: 'long', day: 'numeric', month: 'long' },
  weekdayShort: { weekday: 'short' },
  weekdayLong: { weekday: 'long' },
  weekdayDay: { weekday: 'short', day: 'numeric', month: 'short' },
} as const satisfies Record<string, Intl.DateTimeFormatOptions>;
export type DateStyle = keyof typeof DATE_STYLES;
export function formatDay(language: Language, day: string, style: DateStyle | Intl.DateTimeFormatOptions = 'full') {
  return dateFormat(language, typeof style === 'string' ? DATE_STYLES[style] : style).format(localNoon(day));
}
export function formatDateTime(language: Language, value: string | number | Date) {
  return dateFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
/** `2026-10` → month name with year. */
export function formatMonth(language: Language, month: string) { return formatDay(language, `${month.slice(0, 7)}-01`, 'monthYear'); }
/** Monday-first short weekday names for calendar headers in every language. */
export function weekdayNames(language: Language, style: 'short' | 'long' | 'narrow' = 'short') {
  // 2024-01-01 is a Monday.
  return Array.from({ length: 7 }, (_, index) => dateFormat(language, { weekday: style }).format(new Date(2024, 0, 1 + index, 12)));
}
export function formatDecimal(language: Language, value: number, maximumFractionDigits = 1, minimumFractionDigits = 0) {
  return formatNumber(language, value, { maximumFractionDigits, minimumFractionDigits });
}
/**
 * Reads a decimal typed with a comma or a dot. Text that is not a plain decimal, such as a
 * `5:30` pace, is never interpreted as a number.
 */
export function parseDecimal(text: string): number | null {
  const normalized = text.trim().replace(',', '.');
  // A separator typed without decimals yet (`12,`) is still the whole number, as it always was.
  if (!/^-?\d+(\.\d*)?$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}
/** Minutes and seconds for a pace or a time: 330 → `5:30`. Never a decimal number. */
export function formatMinutesSeconds(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
export function parseMinutesSeconds(text: string): number | null {
  const match = /^(\d{1,3}):([0-5]\d)$/.exec(text.trim());
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}
/** Locale-aware, accent-insensitive search key; `ł` has no canonical decomposition. */
export function searchKey(text: string) {
  return text.toLocaleLowerCase('pl').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l');
}
