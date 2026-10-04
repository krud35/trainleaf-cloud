// Localisation unit tests: dictionaries, plural rules, formatting, the language preference and error codes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadTs, root } from '../tools/load-ts.mjs';

const { coverageIssues, renderMessage, parameterNames, REQUIRED_PLURAL_FORMS, pluralCategory } = loadTs('mobile/src/i18n/core.ts');
const { namespaces } = loadTs('mobile/src/i18n/messages/index.ts');
const { LANGUAGES, DEFAULT_LANGUAGE, LOCALE_TAGS, LANGUAGE_STORAGE_KEY, languagePreference } = loadTs('mobile/src/i18n/locale.ts');
const { createLanguageStore } = loadTs('mobile/src/i18n/languageStore.ts');
const format = loadTs('mobile/src/i18n/format.ts');
const i18n = loadTs('mobile/src/i18n/index.ts');
const labels = loadTs('mobile/src/i18n/labels.ts');
const { ERROR_CODES, AppError, issue, issueCode } = loadTs('mobile/src/data/errors.ts');
const { RevisionConflictError, profileInputSchema } = loadTs('mobile/src/data/domain.ts');

test('the four dictionaries have identical keys, parameters and complete plural forms', () => {
  assert.deepEqual(LANGUAGES, ['en', 'pl', 'fr', 'es']);
  assert.deepEqual(coverageIssues(namespaces), []);
  const keys = Object.values(namespaces).reduce((sum, namespace) => sum + Object.keys(namespace.en).length, 0);
  assert.ok(keys > 1300, `expected the complete interface dictionary, found ${keys} keys`);
});

test('the coverage check reads dictionaries without fallback and reports every kind of gap', () => {
  const broken = { sample: {
    en: { title: 'Title', greeting: 'Hello {name}', items: { one: '{count} item', other: '{count} items' } },
    pl: { title: 'Tytuł', greeting: 'Cześć {imie}', items: { one: '{count} rzecz', other: '{count} rzeczy' } },
    fr: { title: '', greeting: 'Bonjour {name}', items: '{count} éléments', extra: 'x' },
    es: { greeting: 'Hola {name}', items: { one: '{count} elemento', other: '{count} elementos' } },
  } };
  const problems = coverageIssues(broken).map(entry => `${entry.language}:${entry.key}:${entry.problem}`);
  assert.ok(problems.some(p => p.startsWith('es:sample.title:missing')), 'a key present only in English is missing, not covered by fallback');
  assert.ok(problems.some(p => p.startsWith('pl:sample.greeting:parameters')));
  assert.ok(problems.some(p => p.startsWith('pl:sample.items:plural form "few" missing')));
  assert.ok(problems.some(p => p.startsWith('pl:sample.items:plural form "many" missing')));
  assert.ok(problems.some(p => p.startsWith('fr:sample.title:empty text')));
  assert.ok(problems.some(p => p.startsWith('fr:sample.items:plural shape')));
  assert.ok(problems.some(p => p.startsWith('fr:sample.extra:not defined in English')));
  // The runtime still renders English for such a gap, which is exactly why the report must not use it.
  assert.equal(i18n.translate('fr', 'app.opening').length > 0, true);
});

test('every plural message selects a non-empty complete sentence for 0, 1, 2, 5, 12, 22 and 1.5', () => {
  for (const [name, namespace] of Object.entries(namespaces)) for (const language of LANGUAGES) for (const [key, message] of Object.entries(namespace[language])) {
    if (typeof message === 'string') continue;
    for (const form of REQUIRED_PLURAL_FORMS[language]) assert.ok(message[form], `${language} ${name}.${key} ${form}`);
    const params = Object.fromEntries(parameterNames(message).map(param => [param, 'x']));
    for (const count of [0, 1, 2, 5, 12, 22, 1.5]) {
      const text = renderMessage(language, message, { ...params, count });
      assert.ok(text.trim(), `${language} ${name}.${key} for ${count}`);
      assert.ok(!/\{[A-Za-z]+\}/.test(text), `${language} ${name}.${key} leaves a placeholder: ${text}`);
    }
  }
});

test('Polish plural forms follow one, few, many and the fractional form', () => {
  const t = (key, params) => i18n.translate('pl', key, params);
  assert.equal(pluralCategory('pl', 1), 'one'); assert.equal(pluralCategory('pl', 3), 'few');
  assert.equal(pluralCategory('pl', 5), 'many'); assert.equal(pluralCategory('pl', 12), 'many');
  assert.equal(pluralCategory('pl', 22), 'few'); assert.equal(pluralCategory('pl', 1.5), 'other');
  assert.equal(t('dose.sets', { count: 1 }), '1 seria');
  assert.equal(t('dose.sets', { count: 3 }), '3 serie');
  assert.equal(t('dose.sets', { count: 5 }), '5 serii');
  assert.equal(t('dose.sets', { count: 22 }), '22 serie');
  assert.equal(t('planning.sessionCount', { count: 0 }), '0 sesji');
  assert.equal(t('planning.sessionCount', { count: 1 }), '1 sesja');
  assert.equal(t('planning.sessionCount', { count: 4 }), '4 sesje');
  assert.equal(t('planning.copyDone', { count: 2 }), 'Utworzono 2 nowe plany.');
  assert.equal(t('planning.copyDone', { count: 7 }), 'Utworzono 7 nowych planów.');
  assert.equal(t('library.exerciseCount', { count: 163 }), '163 ćwiczenia');
  assert.equal(i18n.translate('en', 'planning.sessionCount', { count: 1 }), '1 session');
  assert.equal(i18n.translate('en', 'planning.sessionCount', { count: 0 }), '0 sessions');
  assert.equal(i18n.translate('fr', 'planning.sessionCount', { count: 0 }), '0 séance');
  assert.equal(i18n.translate('fr', 'planning.sessionCount', { count: 2 }), '2 séances');
  assert.equal(i18n.translate('es', 'planning.sessionCount', { count: 1 }), '1 sesión');
  assert.equal(i18n.translate('es', 'planning.sessionCount', { count: 0 }), '0 sesiones');
});

test('the locales are en-GB, pl-PL, fr-FR and es-ES and dates keep the stored local day', () => {
  assert.deepEqual(LOCALE_TAGS, { en: 'en-GB', pl: 'pl-PL', fr: 'fr-FR', es: 'es-ES' });
  // Month and year boundaries: the stored day never shifts.
  assert.equal(format.formatDay('en', '2026-12-31'), '31 Dec 2026');
  assert.equal(format.formatDay('en', '2027-01-01'), '1 Jan 2027');
  assert.equal(format.formatDay('pl', '2026-12-31'), '31 gru 2026');
  assert.equal(format.formatDay('pl', '2027-01-01'), '1 sty 2027');
  assert.match(format.formatDay('fr', '2027-01-01'), /^1(er)? janv\. 2027$/);
  assert.match(format.formatDay('es', '2026-12-31'), /^31 dic 2026$/);
  assert.equal(format.formatDay('en', '2024-02-29', 'dayMonthLong'), '29 February');
  assert.match(format.formatDay('pl', '2026-03-01', 'heading'), /^niedziela, 1 marca$/);
  assert.equal(format.formatMonth('en', '2026-10'), 'October 2026');
  assert.equal(format.formatMonth('pl', '2026-10'), 'październik 2026');
  assert.equal(format.formatMonth('fr', '2026-10'), 'octobre 2026');
  assert.equal(format.formatMonth('es', '2026-10'), 'octubre de 2026');
});

test('the week runs Monday to Sunday in every language', () => {
  assert.deepEqual(format.weekdayNames('en', 'long'), ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
  assert.equal(format.weekdayNames('pl', 'long')[0], 'poniedziałek'); assert.equal(format.weekdayNames('pl', 'long')[6], 'niedziela');
  assert.equal(format.weekdayNames('fr', 'long')[0], 'lundi'); assert.equal(format.weekdayNames('es', 'long')[6], 'domingo');
  for (const language of LANGUAGES) {
    const headers = [0, 1, 2, 3, 4, 5, 6].map(index => i18n.translate(language, `calendar.weekday_${index}`));
    assert.equal(new Set(headers).size, 7);
    assert.ok(headers.every(header => header.length === 2), `${language} headers fit seven columns`);
  }
});

test('decimals use the language separator, sleep keeps quarter hours and a pace is never a decimal', () => {
  assert.equal(format.formatDecimal('en', 7.25, 2), '7.25');
  assert.equal(format.formatDecimal('pl', 7.25, 2), '7,25');
  assert.equal(format.formatDecimal('fr', 7.5, 2), '7,5');
  assert.equal(format.formatDecimal('es', 0.75, 2), '0,75');
  assert.equal(format.formatDecimal('pl', 0, 1), '0');
  for (const [text, value] of [['7,25', 7.25], ['7.25', 7.25], ['0', 0], ['0,5', 0.5], [' 8 ', 8], ['12,', 12]]) assert.equal(format.parseDecimal(text), value);
  for (const text of ['5:30', '5:30 min/km', '', 'abc', '1,2,3', ',5', '1e3', '0x10']) assert.equal(format.parseDecimal(text), null, text);
  for (const quarter of [0, 0.25, 0.5, 0.75, 7.25, 24]) assert.equal(format.parseDecimal(format.formatDecimal('pl', quarter, 2)), quarter);
  assert.equal(format.formatMinutesSeconds(330), '5:30');
  assert.equal(format.formatMinutesSeconds(65), '1:05');
  assert.equal(format.parseMinutesSeconds('5:30'), 330);
  assert.equal(format.parseMinutesSeconds('5,30'), null);
  assert.equal(format.parseMinutesSeconds('5:75'), null);
  // A free-text tempo is inserted unchanged into a translated sentence.
  for (const language of LANGUAGES) assert.ok(i18n.translate(language, 'dose.tempo', { value: '5:30 min/km' }).includes('5:30 min/km'));
});

test('a saved zero and a missing answer stay distinct in every language', () => {
  for (const language of LANGUAGES) {
    const translator = i18n.translator(language);
    const zero = translator.t('entry.scaleValue', { value: 0, max: 10 });
    assert.match(zero, /^0 \/ 10$/);
    assert.notEqual(translator.t('entry.noAnswer'), zero);
    assert.notEqual(translator.t('entry.noMeasurement'), translator.t('entry.minutes', { minutes: 0 }));
    assert.equal(labels.scaleLabels(translator, 'fatigue', 0, 10).length, 11);
    assert.equal(labels.scaleLabels(translator, 'sleepQuality', 1, 5).length, 5);
    assert.ok(labels.doseSummary(translator, null, 'kg').length > 0);
    assert.match(labels.doseSummary(translator, { sets: 3, quantity: 8, kg: 0, rir: 0 }, 'kg'), /0 kg.*RIR 0/);
    assert.match(labels.doseSummary(translator, { sets: null, quantity: null, kg: 0, rir: null }, 'reps'), /—.*×.*—/);
  }
});

function memoryEnvironment(initial) {
  const state = { value: initial, applied: [], writes: [] };
  return { state, environment: {
    readPreference: () => { if (state.failRead) throw new Error('storage unavailable'); return state.value; },
    writePreference: value => { if (state.failWrite) throw new Error('storage full'); state.value = value; state.writes.push(value); },
    apply: language => state.applied.push(language),
    onPreferenceChange: callback => { state.notify = callback; return () => { state.notify = null; }; },
  } };
}

test('without a saved choice the language is English, whatever the device uses', () => {
  assert.equal(DEFAULT_LANGUAGE, 'en');
  assert.equal(LANGUAGE_STORAGE_KEY, 'trainleaf-language');
  for (const value of [null, undefined, '', 'de', 'pl-PL', 'PL', 'english', 42, {}]) assert.equal(languagePreference(value), 'en', String(value));
  const sources = ['mobile/src/i18n/languageStore.ts', 'mobile/src/i18n/index.ts', 'mobile/src/i18n/locale.ts', 'mobile/src/i18n/boot.ts'].map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
  assert.ok(!/navigator\.languages?\b/.test(sources), 'the device language must not be read');
  const { state, environment } = memoryEnvironment(null);
  const store = createLanguageStore(environment);
  assert.equal(store.getSnapshot(), 'en');
  assert.deepEqual(state.applied, ['en']);
  assert.deepEqual(state.writes, [], 'starting must not write a preference');
});

test('a valid saved choice is kept across restarts and a change notifies listeners once', () => {
  for (const language of LANGUAGES) assert.equal(createLanguageStore(memoryEnvironment(language).environment).getSnapshot(), language);
  const { state, environment } = memoryEnvironment('pl');
  const store = createLanguageStore(environment);
  let calls = 0; const stop = store.subscribe(() => { calls++; });
  store.setLanguage('fr');
  assert.equal(store.getSnapshot(), 'fr'); assert.equal(state.value, 'fr'); assert.equal(calls, 1);
  store.setLanguage('fr'); assert.equal(calls, 1, 'no notification without a change');
  store.setLanguage('xx'); assert.equal(store.getSnapshot(), 'en', 'an invalid request falls back to English');
  state.notify('es'); assert.equal(store.getSnapshot(), 'es', 'a change from another tab is followed');
  state.notify(null); assert.equal(store.getSnapshot(), 'en', 'a cleared preference returns to English');
  assert.equal(createLanguageStore(memoryEnvironment(state.value).environment).getSnapshot(), 'en');
  stop(); store.dispose();
});

test('a failing preference storage never blocks start-up and falls back to English', () => {
  const read = memoryEnvironment('pl'); read.state.failRead = true;
  assert.equal(createLanguageStore(read.environment).getSnapshot(), 'en');
  const write = memoryEnvironment('en'); write.state.failWrite = true;
  const store = createLanguageStore(write.environment);
  assert.doesNotThrow(() => store.setLanguage('es'));
  assert.equal(store.getSnapshot(), 'es', 'the session keeps the chosen language');
  const broken = memoryEnvironment('fr'); broken.environment.apply = () => { throw new Error('no document'); };
  assert.equal(createLanguageStore(broken.environment).getSnapshot(), 'fr');
});

test('every error code has a message in four languages and errors are translated by code', () => {
  for (const language of LANGUAGES) for (const code of ERROR_CODES) assert.ok(namespaces.errors[language][code], `${language} ${code}`);
  assert.deepEqual(Object.keys(namespaces.errors.en).sort(), [...ERROR_CODES].sort(), 'no message without a code');
  const english = i18n.translator('en'), spanish = i18n.translator('es');
  // The diagnostic text is Polish here; the interface must not show or match it.
  const error = new AppError('copyWeekSameTarget', 'Wybierz inny tydzień docelowy.');
  assert.equal(labels.errorText(english, error), 'Choose another target week.');
  assert.equal(labels.errorText(spanish, error), 'Elige otra semana de destino.');
  assert.equal(labels.errorText(english, new AppError('fieldInteger', undefined, { label: 'Sets', min: 1, max: 100 })), 'Sets: enter a whole number from 1 to 100.');
  assert.equal(labels.errorText(english, new RevisionConflictError()), 'The data has changed. Refresh the view before saving again.');
  assert.equal(new RevisionConflictError().name, 'RevisionConflictError');
  assert.equal(issueCode(issue('sportRequired')), 'sportRequired');
  assert.equal(issueCode('Wybierz przynajmniej jeden sport.'), null);
  const invalid = profileInputSchema.safeParse({ displayName: '', roles: ['athlete'], sportIds: [], modules: ['journal'] });
  assert.equal(invalid.success, false);
  assert.equal(labels.errorText(i18n.translator('fr'), invalid.error), 'Indiquez le nom du profil.');
  assert.equal(labels.errorText(english, { issues: [{ message: 'Required' }] }), 'Check the data you entered.');
  assert.equal(labels.errorText(english, new Error('storage failure')), 'storage failure');
  assert.equal(labels.errorText(i18n.translator('pl'), 'not an error'), 'Nie udało się zapisać. Spróbuj ponownie.');
});

test('stored enum values keep their IDs and unknown IDs are shown unchanged', () => {
  const { SPORTS, TRAINING_TYPES, SHORTCUTS } = loadTs('mobile/src/data/domain.ts');
  const { muscles, sections, metrics, categories } = loadTs('lib/domain.ts');
  const { exerciseTypes } = loadTs('lib/exercise-types.ts');
  const { wellnessQuestions, wellnessSlots } = loadTs('lib/wellness.ts');
  for (const language of LANGUAGES) {
    const translator = i18n.translator(language);
    for (const sport of SPORTS) assert.ok(namespaces.sport[language][sport.id], `${language} sport ${sport.id}`);
    for (const type of TRAINING_TYPES) { assert.ok(namespaces.trainingType[language][type.id]); assert.ok(namespaces.trainingType[language][`short_${type.id}`]); }
    for (const id of SHORTCUTS) { assert.ok(namespaces.shortcut[language][id]); assert.ok(namespaces.more[language][`desc_${id}`]); }
    for (const id of Object.keys(muscles)) assert.ok(namespaces.muscle[language][id], `${language} muscle ${id}`);
    for (const id of Object.keys(sections)) assert.ok(namespaces.section[language][id]);
    for (const id of Object.keys(metrics)) { assert.ok(namespaces.metric[language][id]); assert.ok(namespaces.dose[language][`quantity_${id}`]); assert.ok(namespaces.training[language][`quantity_${id}`]); }
    for (const id of Object.keys(categories)) assert.ok(namespaces.exerciseCategory[language][id]);
    for (const id of Object.keys(exerciseTypes)) assert.ok(namespaces.exerciseType[language][id]);
    for (const slot of wellnessSlots) assert.ok(namespaces.wellnessSlot[language][slot]);
    for (const [metric, question] of Object.entries(wellnessQuestions)) {
      for (const part of ['label', 'question', 'ends']) assert.ok(namespaces.wellnessQuestion[language][`${part}_${metric}`], `${language} ${part}_${metric}`);
      if (metric !== 'sleepHours') for (let value = question.min; value <= question.max; value++) assert.ok(namespaces.scale[language][`${metric}_${value}`], `${language} scale ${metric}_${value}`);
    }
    assert.equal(labels.sportLabel(translator, 'future-sport'), 'future-sport');
    assert.equal(labels.trainingTypeLabel(translator, null), namespaces.trainingType[language].unknown);
  }
  assert.equal(SPORTS.find(sport => sport.id === 'running').id, 'running');
});

test('translations keep the meaning of RIR, RPE, the load index and the non-validation statements', () => {
  for (const language of LANGUAGES) {
    const t = key => namespaces[key.split('.')[0]][language][key.split('.')[1]];
    assert.match(t('training.rirHelp'), /RIR 2/); assert.match(t('training.rirHelp'), /RIR 0/);
    assert.match(t('editor.rpeHelp'), /0.{1,3}10/);
    const index = t('progress.indexHelp');
    for (const weight of ['1[.,]3', '1[.,]05', '0[.,]8', '0[.,]6', '0[.,]5']) assert.match(index, new RegExp(weight), `${language} keeps weight ${weight}`);
    assert.match(index, /v1/);
  }
  assert.match(namespaces.progress.en.indexHelp, /not scientifically validated/);
  assert.match(namespaces.progress.pl.indexHelp, /nie jest naukowo zwalidowany/);
  assert.match(namespaces.progress.fr.indexHelp, /n’est pas validé scientifiquement/);
  assert.match(namespaces.progress.es.indexHelp, /no está validado científicamente/);
  assert.match(namespaces.reserve.en.details5, /not been validated scientifically/);
  assert.match(namespaces.reserve.pl.details5, /nie zostały zwalidowane naukowo/);
  assert.match(namespaces.reserve.fr.details5, /n’ont pas été validés scientifiquement/);
  assert.match(namespaces.reserve.es.details5, /no han sido validados científicamente/);
  for (const language of LANGUAGES) assert.match(namespaces.reserve[language].legendColours, /(not a promise|nie jest obietnicą|ne promet pas|no promete)/);
});

test('shared catalog schemas carry stable codes without changing their Polish texts', () => {
  const { wellnessResponseSchema } = loadTs('lib/wellness.ts');
  const { exerciseSchema } = loadTs('lib/domain.ts');
  const french = i18n.translator('fr');
  const empty = wellnessResponseSchema.safeParse({ slot: 'morning', answers: {} });
  assert.equal(empty.error.issues[0].message, 'Uzupełnij przynajmniej jedną odpowiedź.', 'the web text is unchanged');
  assert.equal(labels.errorText(french, empty.error), 'Donnez au moins une réponse.');
  const wrongSlot = wellnessResponseSchema.safeParse({ slot: 'morning', answers: { energy: 3 } });
  assert.equal(labels.errorText(i18n.translator('en'), wrongSlot.error), 'The question does not match the chosen time of day.');
  const base = { id: 'x', name: 'X', category: 'strength', metric: 'kg', shares: [], video: '', notes: '' };
  assert.equal(labels.errorText(i18n.translator('es'), exerciseSchema.safeParse({ ...base, video: 'http://example.com' }).error), 'Pega un enlace https:// válido.');
  assert.equal(labels.errorText(i18n.translator('pl'), exerciseSchema.safeParse({ ...base, shares: [{ muscle: 'quads', weight: 0.4 }] }).error), 'Udziały mięśni muszą sumować się do 100%.');
});
