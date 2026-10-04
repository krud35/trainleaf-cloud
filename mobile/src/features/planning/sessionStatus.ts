import type { Workout } from '../../data/domain';
import { currentTranslator } from '../../i18n';
import { workoutStatusLabel as statusLabel } from '../../i18n/labels';
export function workoutStatusLabel(workout: Workout) { return statusLabel(currentTranslator(), workout); }
