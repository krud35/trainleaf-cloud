import type { Muscle, MuscleTarget } from '../../data/domain';
import { currentTranslator } from '../../i18n';
export const geometryMuscles: Record<string, Muscle> = { chest: 'chest', deltoids: 'shoulders', biceps: 'biceps', triceps: 'triceps', abs: 'abs', obliques: 'obliques', lats: 'lats', traps: 'upper_back', glutes: 'glutes', quads: 'quads', hamstrings: 'hamstrings', calves: 'calves' };
export const amount = (value: number | null) => value === null ? '—' : currentTranslator().n(value);
/** Dictionary key of the target status; the screen translates it. */
export type TargetText = 'muscleMap.target_none' | 'muscleMap.target_zero' | 'muscleMap.target_incomplete' | 'muscleMap.target_noData' | 'muscleMap.target_below' | 'muscleMap.target_met' | 'muscleMap.target_above';
function progressColor(ratio: number) {
  const stops = [[188, 107, 89], [198, 138, 78], [180, 170, 86], [65, 134, 91]];
  const position = Math.max(0, Math.min(1, ratio)) * 3, index = Math.min(2, Math.floor(position)), t = position - index;
  return '#' + stops[index].map((value, i) => Math.round(value + (stops[index + 1][i] - value) * t).toString(16).padStart(2, '0')).join('');
}
export function targetPresentation(value: number | null, target: MuscleTarget | null, hasData: boolean) {
  if (!target || target.target === null) return { color: '#AEB6A8', text: 'muscleMap.target_none' as TargetText, percent: null };
  if (target.target === 0) return { color: '#AEB6A8', text: 'muscleMap.target_zero' as TargetText, percent: null };
  if (value === null) return { color: '#AEB6A8', text: (hasData ? 'muscleMap.target_incomplete' : 'muscleMap.target_noData') as TargetText, percent: null };
  const ratio = value / target.target;
  return { color: progressColor(ratio), text: (value < target.target ? 'muscleMap.target_below' : value === target.target ? 'muscleMap.target_met' : 'muscleMap.target_above') as TargetText, percent: Math.round(ratio * 100) };
}
