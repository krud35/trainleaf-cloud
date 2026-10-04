// Factory catalog localisation: coverage in four languages and the rules that protect stored content.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from '../tools/load-ts.mjs';

const factory = loadTs('mobile/src/i18n/factory/index.ts');
const { getBuiltinExercises, getBuiltinTemplates } = loadTs('mobile/src/data/catalog.ts');
const { LANGUAGES } = loadTs('mobile/src/i18n/locale.ts');
const { periodPresets } = loadTs('lib/period-presets.ts');
const builtins = getBuiltinExercises();
const byId = id => structuredClone(builtins.find(exercise => exercise.id === id));

test('the factory catalog is the expected one and is fully translated without fallback', () => {
  assert.equal(builtins.length, 163);
  assert.equal(builtins.filter(exercise => exercise.nameEn).length, 163);
  assert.equal(builtins.filter(exercise => exercise.notes && !exercise.notesEn).length, 90, 'notes that had no English text in the catalog');
  for (const entry of factory.factoryCoverage()) {
    assert.deepEqual(entry.missing, [], `${entry.language} has untranslated factory texts`);
    assert.equal(entry.translated, entry.total);
    assert.equal(entry.total, 667);
  }
  for (const exercise of builtins) assert.equal(exercise.prescription, undefined, 'removed dosing recommendations are not restored');
});

test('an unchanged factory record is shown in the chosen language and stays Polish in storage', () => {
  const squat = byId('catalog-back-squat');
  const stored = JSON.stringify(squat);
  assert.equal(factory.exerciseName(squat, 'pl'), 'Przysiad ze sztangą na plecach');
  assert.equal(factory.exerciseName(squat, 'en'), 'Back squat');
  assert.equal(factory.exerciseName(squat, 'fr'), 'Squat barre sur le dos');
  assert.equal(factory.exerciseName(squat, 'es'), 'Sentadilla trasera con barra');
  assert.equal(factory.exerciseText(squat, 'cues', 'en'), squat.cuesEn);
  assert.match(factory.exerciseText(squat, 'cues', 'fr'), /^Gainez le tronc/);
  assert.match(factory.exerciseText(squat, 'notes', 'en'), /^The sources contain different videos/);
  assert.match(factory.exerciseText(squat, 'variants', 'es'), /equilibrio/);
  assert.equal(JSON.stringify(squat), stored, 'display never rewrites the record');
  for (const exercise of builtins) for (const field of factory.FACTORY_FIELDS) for (const language of LANGUAGES) {
    if (!exercise[field]) { assert.equal(factory.exerciseText(exercise, field, language), ''); continue; }
    const text = factory.exerciseText(exercise, field, language);
    assert.ok(text.trim(), `${exercise.id}.${field} ${language}`);
    if (language === 'pl') assert.equal(text, exercise[field]);
  }
});

test('a modified record with a factory ID keeps every field the user changed', () => {
  const edited = byId('catalog-back-squat');
  edited.name = 'Mój przysiad z pauzą';
  edited.notes = 'Pauza 3 s na dole. Bez pasa.';
  for (const language of LANGUAGES) {
    assert.equal(factory.exerciseName(edited, language), 'Mój przysiad z pauzą', `${language} must not replace a changed name`);
    assert.equal(factory.exerciseText(edited, 'notes', language), 'Pauza 3 s na dole. Bez pasa.');
  }
  // Untouched fields of the same record are still factory texts.
  assert.equal(factory.exerciseText(edited, 'cues', 'en'), edited.cuesEn);
  assert.equal(factory.isFactoryText(edited, 'name'), false);
  assert.equal(factory.isFactoryText(edited, 'cues'), true);
  // A changed English name alone does not make the Polish name foreign, and it is never used as the translation source.
  const renamedEn = byId('catalog-back-squat'); renamedEn.nameEn = 'My own English name';
  assert.equal(factory.exerciseName(renamedEn, 'fr'), 'Squat barre sur le dos');
  // One changed character is enough to keep the stored text.
  const almost = byId('squat'); almost.cues = `${almost.cues} `;
  assert.equal(factory.exerciseText(almost, 'cues', 'es'), almost.cues);
});

test('an own exercise is never translated, even when it reuses a factory name', () => {
  const own = { ...byId('catalog-back-squat'), id: '0b0f6f0e-1111-4222-8333-444455556666' };
  for (const language of LANGUAGES) for (const field of factory.FACTORY_FIELDS) assert.equal(factory.exerciseText(own, field, language), own[field] ?? '');
  const custom = { id: 'own-1', name: 'Przysiad ze sztangą na plecach', notes: 'Własny opis', cues: '', variants: '' };
  assert.equal(factory.exerciseName(custom, 'en'), 'Przysiad ze sztangą na plecach');
  assert.equal(factory.exerciseText(custom, 'notes', 'fr'), 'Własny opis');
  assert.equal(factory.exerciseProvenance({ id: 'own-1', provenance: 'Plan treningowy · mój zeszyt' }, 'en'), 'Plan treningowy · mój zeszyt');
});

test('an old snapshot with earlier catalog wording keeps its stored text', () => {
  // A workout saved by an earlier release: same ID, but the description differs from the current catalog.
  const snapshot = byId('catalog-hip-thrust');
  snapshot.cues = 'Wypchnij biodra w górę i zatrzymaj na sekundę.';
  snapshot.variants = 'Wersja z gumą nad kolanami.';
  snapshot.prescription = 'Przykład zapisu z planu: serie: 3; powt.: 8.';
  for (const language of LANGUAGES) {
    assert.equal(factory.exerciseText(snapshot, 'cues', language), 'Wypchnij biodra w górę i zatrzymaj na sekundę.');
    assert.equal(factory.exerciseText(snapshot, 'variants', language), 'Wersja z gumą nad kolanami.');
  }
  assert.equal(factory.exerciseName(snapshot, 'fr'), 'Hip thrust', 'the name still equals the factory name, so it is translated');
  assert.equal(snapshot.prescription, 'Przykład zapisu z planu: serie: 3; powt.: 8.', 'historical dosing text is left as stored');
  // The latest catalog description is not substituted for the historical one.
  assert.notEqual(factory.exerciseText(snapshot, 'cues', 'pl'), byId('catalog-hip-thrust').cues);
  const unknown = { id: 'catalog-removed-in-a-later-release', name: 'Stare ćwiczenie', notes: 'Opis', cues: 'Wskazówka', variants: '' };
  assert.equal(factory.exerciseName(unknown, 'en'), 'Stare ćwiczenie');
});

test('a copy made by the user is written in the current language and becomes ordinary user content', () => {
  const source = byId('catalog-chin-up');
  const copy = { ...factory.localizedExerciseCopy(source, 'es'), id: 'own-copy' };
  assert.equal(copy.name, 'Dominada supina');
  assert.match(copy.cues, /^Empieza desde un colgado controlado/);
  assert.equal(source.name, 'Podciąganie podchwytem', 'the source is not changed');
  for (const language of LANGUAGES) assert.equal(factory.exerciseName(copy, language), 'Dominada supina', 'the copy is no longer translated');
  assert.deepEqual(factory.localizedExerciseCopy(source, 'pl'), source);
});

test('built-in templates, period presets and provenance lines are translated only as factory content', () => {
  const templates = getBuiltinTemplates();
  assert.deepEqual(templates.map(template => template.name), ['Rozgrzewka ogólna', 'Siła · całe ciało', 'Spokojne zakończenie']);
  assert.equal(factory.builtinTemplateName('Rozgrzewka ogólna', 'en'), 'General warm-up');
  assert.equal(factory.builtinTemplateName('Siła · całe ciało', 'fr'), 'Force · corps entier');
  assert.equal(factory.builtinTemplateName('Spokojne zakończenie', 'es'), 'Final suave');
  assert.equal(factory.builtinTemplateName('Mój szablon', 'en'), 'Mój szablon');
  assert.equal(periodPresets.length, 16);
  for (const preset of periodPresets) for (const language of LANGUAGES) {
    const text = factory.presetText(preset.id, language);
    assert.ok(text.name && text.description, `${preset.id} ${language}`);
  }
  assert.equal(factory.presetText('taper', 'pl').name, 'Taper przed startem');
  assert.equal(factory.presetText('taper', 'fr').name, 'Affûtage avant la compétition');
  assert.equal(factory.presetText('unknown-preset', 'en'), null);
  const planned = builtins.find(exercise => exercise.provenance?.startsWith('Plan treningowy · WEEK'));
  assert.match(factory.exerciseProvenance(planned, 'en'), /^Training plan · WEEK \d+/);
  assert.match(factory.exerciseProvenance(planned, 'es'), /^Plan de entrenamiento · WEEK \d+/);
  const library = builtins.find(exercise => exercise.provenance?.startsWith('Biblioteka Trainleaf'));
  assert.match(factory.exerciseProvenance(library, 'fr'), /^Bibliothèque Trainleaf · source vérifiée le \d{4}-\d{2}-\d{2}$/);
  assert.equal(factory.exerciseProvenance({ ...library, provenance: 'Zmienione przez użytkownika' }, 'en'), 'Zmienione przez użytkownika');
  for (const exercise of builtins) if (exercise.provenance) for (const language of ['en', 'fr', 'es']) assert.ok(!/Plan treningowy|Biblioteka|źródł/.test(factory.exerciseProvenance(exercise, language)), `${exercise.id} ${language}`);
});
