import { itemSchema, supersetSchema, type Superset, type WorkoutSections, type sectionsSchema } from './domain';
import type { z } from 'zod';
import type { Section } from '../../../lib/domain';
import { AppError } from './errors';
const sectionKeys: Section[] = ['warmup', 'main', 'cooldown'];
type GroupedItem = { id: string; supersetId?: string | null };
type SupersetInput = z.input<typeof supersetSchema>;
type Plan<T> = { sections: Record<Section, T[]>; supersets: SupersetInput[] };
/** Preserve order. A split group or a group reduced to one exercise is dissolved. */
export function normalizeSupersets<T extends GroupedItem>(plan: Plan<T>): { sections: Record<Section, T[]>; supersets: Superset[] } {
  const valid = plan.supersets.filter((group, groupIndex) => {
    if (plan.supersets.findIndex(candidate => candidate.id === group.id) !== groupIndex) return false;
    const indexes = plan.sections[group.section].flatMap((item, index) => item.supersetId === group.id ? [index] : []);
    return indexes.length >= 2 && indexes.at(-1)! - indexes[0] + 1 === indexes.length;
  });
  return { supersets: valid.map(group => supersetSchema.parse(group)), sections: Object.fromEntries(sectionKeys.map(section => [section,
    plan.sections[section].map(item => ({ ...item, supersetId: valid.some(group => group.id === item.supersetId && group.section === section) ? item.supersetId : null }))])) as Record<Section, T[]> };
}
export function cloneTrainingPlan(plan: { sections: z.input<typeof sectionsSchema>; supersets?: SupersetInput[] }): { sections: WorkoutSections; supersets: Superset[] } {
  const mapping = new Map((plan.supersets ?? []).map(group => [group.id, crypto.randomUUID()]));
  return normalizeSupersets({
    supersets: (plan.supersets ?? []).map(group => ({ ...structuredClone(group), id: mapping.get(group.id)! })),
    sections: Object.fromEntries(sectionKeys.map(section => [section, plan.sections[section].map(item => itemSchema.parse({
      ...structuredClone(item), id: crypto.randomUUID(), supersetId: item.supersetId ? mapping.get(item.supersetId) ?? null : null,
      planned: { ...structuredClone(item.planned), rir: item.planned.rir ?? null }, actual: null, athleteNotes: '',
    }))])) as WorkoutSections,
  });
}
export function supersetLabel(groupNumber: number, index: number): string {
  if (!Number.isInteger(groupNumber) || groupNumber < 1 || !Number.isInteger(index) || index < 0) throw new AppError('supersetNumberInvalid', 'Nieprawidłowy numer superserii.');
  let suffix = ''; let value = index + 1;
  while (value > 0) { value--; suffix = String.fromCharCode(97 + value % 26) + suffix; value = Math.floor(value / 26); }
  return `${groupNumber}${suffix}`;
}
/** Rounds reference each exercise once, without generated doses or duplicate rests. */
export function supersetRounds<T extends { planned: { sets: number | null } }>(items: T[]): T[][] {
  const rounds = Math.max(0, ...items.map(item => item.planned.sets ?? 0));
  return Array.from({ length: rounds }, (_, round) => items.filter(item => (item.planned.sets ?? 0) > round));
}
