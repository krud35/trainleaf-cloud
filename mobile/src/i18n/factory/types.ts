export type FactoryField = 'name' | 'notes' | 'cues' | 'variants';
export type FactoryExerciseText = { name: string; cues?: string; variants?: string };
/** Keyed by the factory exercise ID. */
export type FactoryExerciseTexts = Record<string, { fr: FactoryExerciseText; es: FactoryExerciseText }>;
