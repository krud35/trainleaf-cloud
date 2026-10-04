import { periodPresets } from '../../../../lib/period-presets';
import { getBuiltinExercises, getBuiltinTemplates } from '../../data/catalog';
import type { Exercise } from '../../data/domain';
import { LANGUAGES, type Language } from '../locale';
import { exercises1 } from './exercises-1';
import { exercises2 } from './exercises-2';
import { exercises3 } from './exercises-3';
import { exercises4 } from './exercises-4';
import { factoryNotes } from './notes';
import { presetTexts, templateNames } from './presets';
import type { FactoryExerciseTexts, FactoryField } from './types';

export type { FactoryField } from './types';
export const FACTORY_FIELDS: readonly FactoryField[] = ['name', 'notes', 'cues', 'variants'];
type Translations = Partial<Record<Language, string>>;
type FactoryEntry = Record<FactoryField, { source: string; translations: Translations }>;
const tables: FactoryExerciseTexts = { ...exercises1, ...exercises2, ...exercises3, ...exercises4 };
const englishField = { name: 'nameEn', notes: 'notesEn', cues: 'cuesEn', variants: 'variantsEn' } as const;

let index: Map<string, FactoryEntry> | undefined;
/**
 * Factory texts of every built-in exercise, keyed by exercise ID. The Polish catalog text is the
 * canonical stored form; a translation exists only for exactly that text.
 */
function factoryIndex() {
  if (index) return index;
  const builtins = getBuiltinExercises();
  // A cue or variant shared by several exercises is translated once, under the first exercise that uses it.
  const shared = { cues: new Map<string, Translations>(), variants: new Map<string, Translations>() };
  for (const exercise of builtins) for (const field of ['cues', 'variants'] as const) {
    const source = exercise[field], entry = tables[exercise.id];
    if (!source || shared[field].has(source) || !entry?.fr[field] && !entry?.es[field]) continue;
    shared[field].set(source, { fr: entry.fr[field], es: entry.es[field] });
  }
  index = new Map(builtins.map(exercise => {
    const entry = tables[exercise.id];
    const field = (name: FactoryField) => {
      const source = exercise[name] ?? '';
      const english = exercise[englishField[name]] || (name === 'notes' ? factoryNotes[source]?.en : undefined);
      const other: Translations = name === 'name' ? { fr: entry?.fr.name, es: entry?.es.name }
        : name === 'notes' ? { fr: factoryNotes[source]?.fr, es: factoryNotes[source]?.es }
        : shared[name].get(source) ?? {};
      return { source, translations: { pl: source, en: english, ...other } };
    };
    return [exercise.id, { name: field('name'), notes: field('notes'), cues: field('cues'), variants: field('variants') }];
  }));
  return index;
}
/**
 * Text of one exercise field for display. A translation replaces the stored text only when that
 * very field still equals the factory text of the same exercise ID. A field the user changed, an
 * older snapshot with different wording, an own exercise and any unknown ID keep the stored text.
 */
export function exerciseText(exercise: Pick<Exercise, 'id'> & Partial<Pick<Exercise, FactoryField>>, field: FactoryField, language: Language): string {
  const stored = exercise[field] ?? '';
  if (!stored) return stored;
  const factory = factoryIndex().get(exercise.id)?.[field];
  if (!factory || factory.source !== stored) return stored;
  return factory.translations[language] || stored;
}
export const exerciseName = (exercise: Pick<Exercise, 'id' | 'name'>, language: Language) => exerciseText(exercise, 'name', language);
/** True when the displayed field comes from the factory dictionary rather than from stored text. */
export function isFactoryText(exercise: Pick<Exercise, 'id'> & Partial<Pick<Exercise, FactoryField>>, field: FactoryField) {
  const stored = exercise[field] ?? '';
  return !!stored && factoryIndex().get(exercise.id)?.[field].source === stored;
}
/**
 * A copy that becomes the user's own exercise: its texts are written in the current language,
 * so that the new record reads the way the user saw it.
 */
export function localizedExerciseCopy<T extends Exercise>(exercise: T, language: Language): T {
  const copy = structuredClone(exercise);
  for (const field of FACTORY_FIELDS) {
    const text = exerciseText(exercise, field, language);
    if (text) (copy as Exercise)[field] = text;
  }
  return copy;
}
const provenancePatterns: { pattern: RegExp; text: Record<Language, string> }[] = [
  { pattern: /^Plan treningowy · (.+)$/, text: { pl: 'Plan treningowy · $1', en: 'Training plan · $1', fr: 'Plan d’entraînement · $1', es: 'Plan de entrenamiento · $1' } },
  { pattern: /^Biblioteka Trainleaf · źródło sprawdzone (\d{4}-\d{2}-\d{2})$/, text: { pl: 'Biblioteka Trainleaf · źródło sprawdzone $1', en: 'Trainleaf library · source checked $1', fr: 'Bibliothèque Trainleaf · source vérifiée le $1', es: 'Biblioteca Trainleaf · fuente comprobada el $1' } },
  { pattern: /^Biblioteka ogólna · wydolność · zweryfikowane źródła$/, text: { pl: 'Biblioteka ogólna · wydolność · zweryfikowane źródła', en: 'General library · conditioning · verified sources', fr: 'Bibliothèque générale · condition physique · sources vérifiées', es: 'Biblioteca general · acondicionamiento · fuentes verificadas' } },
];
/** The origin line of a built-in exercise; translated only while it equals the factory text. */
export function exerciseProvenance(exercise: Pick<Exercise, 'id' | 'provenance'>, language: Language): string {
  const stored = exercise.provenance ?? '';
  const factory = getBuiltinExercises().find(entry => entry.id === exercise.id);
  if (!stored || !factory || factory.provenance !== stored) return stored;
  const match = provenancePatterns.find(entry => entry.pattern.test(stored));
  return match ? stored.replace(match.pattern, match.text[language]) : stored;
}
/** Name of a built-in template. Never used for the user's own templates, even with an identical name. */
export function builtinTemplateName(name: string, language: Language): string {
  const entry = Object.values(templateNames).find(names => names.pl === name);
  return entry?.[language] ?? name;
}
export function presetText(id: string, language: Language): { name: string; description: string } | null {
  const preset = periodPresets.find(entry => entry.id === id);
  if (!preset) return null;
  if (language === 'pl') return { name: preset.namePl, description: preset.descriptionPl };
  if (language === 'en') return { name: preset.nameEn, description: preset.descriptionEn };
  return presetTexts[id]?.[language] ?? { name: preset.nameEn, description: preset.descriptionEn };
}
export type FactoryCoverage = { language: Language; total: number; translated: number; missing: string[] };
/** Coverage of the factory catalog without fallback: a text shown only in Polish counts as missing. */
export function factoryCoverage(): FactoryCoverage[] {
  return LANGUAGES.map(language => {
    const missing: string[] = [];
    let total = 0;
    for (const [id, entry] of factoryIndex()) for (const field of FACTORY_FIELDS) {
      if (!entry[field].source) continue;
      total++;
      if (!entry[field].translations[language]) missing.push(`exercise:${id}.${field}`);
    }
    for (const template of getBuiltinTemplates()) {
      total++;
      if (!Object.values(templateNames).some(names => names.pl === template.name && names[language])) missing.push(`template:${template.id}`);
    }
    for (const preset of periodPresets) {
      total += 2;
      const text = language === 'pl' ? { name: preset.namePl, description: preset.descriptionPl } : language === 'en' ? { name: preset.nameEn, description: preset.descriptionEn } : presetTexts[preset.id]?.[language];
      if (!text?.name) missing.push(`preset:${preset.id}.name`);
      if (!text?.description) missing.push(`preset:${preset.id}.description`);
    }
    return { language, total, translated: total - missing.length, missing };
  });
}
