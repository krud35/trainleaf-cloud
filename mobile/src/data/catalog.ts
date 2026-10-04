import type { z } from 'zod';
import { initialState } from '../../../lib/seed';
import type { Exercise, Item, TemplateInput, WorkoutSections, sectionsSchema } from './domain';
import { emptySections, emptyDose, itemSchema } from './domain';
import { cloneTrainingPlan } from './supersets';
export type BuiltinTemplate = TemplateInput & { id: string };
let catalog: ReturnType<typeof initialState> | undefined;
const localCatalog = () => catalog ??= initialState();
/** Only factory catalog content is sanitized; saved plans and history remain unchanged. */
function withoutFactoryDose(exercise: Exercise): Exercise {
  const result = structuredClone(exercise);
  delete result.prescription;
  return result;
}
export function getBuiltinExercises(): Exercise[] { return localCatalog().exercises.map(withoutFactoryDose); }
/** Legacy section-only cloning deliberately dissolves groups whose metadata is unavailable. */
export function cloneItems(items: z.input<typeof itemSchema>[]): Item[] {
  return items.map(item => itemSchema.parse({ ...structuredClone(item), id: crypto.randomUUID(), supersetId: null, actual: null, athleteNotes: '' }));
}
export function cloneTemplateSections(template: { sections: z.input<typeof sectionsSchema> }): WorkoutSections {
  return cloneTrainingPlan({ sections: template.sections }).sections;
}
export function getBuiltinTemplates(): BuiltinTemplate[] {
  return localCatalog().templates.map(template => ({ id: template.id, profileId: 'local-profile',
    name: template.name, sportId: template.category === 'strength' ? 'strength' : template.category === 'running' ? 'running' : 'ultimate',
    trainingType: null, supersets: [], section: template.section,
    sections: { ...emptySections(), [template.section]: template.items.map(item => itemSchema.parse({
      ...structuredClone(item), id: crypto.randomUUID(), exercise: withoutFactoryDose(item.exercise),
      planned: emptyDose(), actual: null, supersetId: null, athleteNotes: '',
    })) }, notes: '' }));
}
