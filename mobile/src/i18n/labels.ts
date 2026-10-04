import { ZodError } from 'zod';
import { AppError, issueCode, type ErrorCode } from '../data/errors';
import type { Dose, Exercise, Workout } from '../data/domain';
import { today } from '../data/analytics';
import { hasMessage, type MessageKey, type Translator } from './index';

type Namespace = 'sport' | 'sportGroup' | 'trainingType' | 'muscle' | 'section' | 'metric' | 'exerciseCategory' | 'exerciseType' | 'eventKind' | 'availability' | 'shortcut' | 'wellnessSlot' | 'workoutStatus';
/** Label of a stored enum value. An ID from a newer backup that has no label is shown as it is. */
export function enumLabel(i18n: Translator, namespace: Namespace, id: string | null | undefined, fallback = id ?? '') {
  const key = `${namespace}.${id}`;
  return hasMessage(key) ? (i18n.t as (key: MessageKey) => string)(key) : fallback;
}
export const sportLabel = (i18n: Translator, id: string) => enumLabel(i18n, 'sport', id);
export const muscleLabel = (i18n: Translator, id: string) => enumLabel(i18n, 'muscle', id);
export const sectionLabel = (i18n: Translator, id: string) => enumLabel(i18n, 'section', id);
export const slotLabel = (i18n: Translator, id: string) => enumLabel(i18n, 'wellnessSlot', id);
export const trainingTypeLabel = (i18n: Translator, id: string | null | undefined, short = false) =>
  enumLabel(i18n, 'trainingType', `${short ? 'short_' : ''}${id ?? 'unknown'}`, i18n.t(short ? 'trainingType.short_unknown' : 'trainingType.unknown'));
export function workoutStatusLabel(i18n: Translator, workout: Pick<Workout, 'status' | 'date'>) {
  if (workout.status === 'completed' && workout.date > today()) return i18n.t('workoutStatus.futureCompleted');
  return enumLabel(i18n, 'workoutStatus', workout.status);
}
export const wellnessLabel = (i18n: Translator, metric: string, part: 'label' | 'question' | 'ends' = 'label') => {
  const key = `wellnessQuestion.${part}_${metric}`;
  return hasMessage(key) ? (i18n.t as (key: MessageKey) => string)(key) : metric;
};
/** Spoken descriptions of every point of a scale, starting at `min`. */
export function scaleLabels(i18n: Translator, scale: string, min: number, max: number): string[] {
  return Array.from({ length: max - min + 1 }, (_, index) => {
    const key = `scale.${scale}_${min + index}`;
    return hasMessage(key) ? (i18n.t as (key: MessageKey) => string)(key) : String(min + index);
  });
}
function codeText(i18n: Translator, code: ErrorCode, params?: Record<string, string | number>) {
  return (i18n.t as (key: string, params?: Record<string, string | number>) => string)(`errors.${code}`, params);
}
/** Translates an error by its stable code. Texts of errors are never matched. */
export function errorText(i18n: Translator, error: unknown): string {
  if (error instanceof AppError) return codeText(i18n, error.code, error.params);
  if (error instanceof ZodError || typeof error === 'object' && error !== null && 'issues' in error && Array.isArray((error as { issues: unknown }).issues)) {
    const first = (error as ZodError).issues[0] as { message?: unknown; params?: { code?: unknown } } | undefined;
    const code = issueCode(first?.message) ?? issueCode(typeof first?.params?.code === 'string' ? `error:${first.params.code}` : null);
    return codeText(i18n, code ?? 'checkInput');
  }
  // Platform errors (storage, file system) carry a technical text and no code.
  return error instanceof Error && error.message ? error.message : codeText(i18n, 'saveFailed');
}
/** `3 sets × 10 reps`: two independently counted phrases joined by the multiplication sign. */
export function doseCount(i18n: Translator, dose: Pick<Dose, 'sets' | 'quantity'>, metric: Exercise['metric']) {
  const sets = dose.sets == null ? i18n.t('dose.setsUnknown') : i18n.t('dose.sets', { count: dose.sets });
  const quantity = dose.quantity == null ? i18n.t(`dose.quantityUnknown_${metric}`) : i18n.t(`dose.quantity_${metric}`, { count: dose.quantity });
  return `${sets} × ${quantity}`;
}
export function doseSummary(i18n: Translator, dose: Dose | null, metric: Exercise['metric']) {
  if (!dose) return i18n.t('dose.noActual');
  return [doseCount(i18n, dose, metric), metric === 'kg' ? i18n.t('dose.weight', { kg: dose.kg == null ? '—' : i18n.n(dose.kg, 2) }) : '',
    dose.rir == null ? '' : i18n.t('dose.rir', { rir: dose.rir }), dose.tempo && i18n.t('dose.tempo', { value: dose.tempo }),
    dose.rest && i18n.t('dose.rest', { value: dose.rest }), dose.effort && i18n.t('dose.effort', { value: dose.effort }), dose.prescription].filter(Boolean).join(' · ');
}
