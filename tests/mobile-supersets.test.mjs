import { test, mock } from 'node:test';
// Existing historical fixtures stay deterministic as the calendar advances.
mock.timers.enable({ apis: ['Date'], now: new Date('2026-12-31T12:00:00Z') });
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

const root = path.resolve(import.meta.dirname, '..');
const require = createRequire(import.meta.url);
const modules = new Map();
function loadTs(file) {
  const absolute = path.resolve(root, file);
  if (modules.has(absolute)) return modules.get(absolute).exports;
  const compiledModule = { exports: {} };
  modules.set(absolute, compiledModule);
  const js = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const localRequire = name => name.startsWith('.')
    ? loadTs(path.relative(root, path.resolve(path.dirname(absolute), `${name}.ts`)))
    : require(name);
  new Function('require', 'module', 'exports', js)(localRequire, compiledModule, compiledModule.exports);
  return compiledModule.exports;
}

const { doseSchema, workoutInputSchema, templateInputSchema, profileInputSchema, SPORTS, SPORT_GROUPS } = loadTs('mobile/src/data/domain.ts');
const { normalizeSupersets, cloneTrainingPlan, supersetLabel, supersetRounds } = loadTs('mobile/src/data/supersets.ts');
const { getBuiltinExercises, getBuiltinTemplates } = loadTs('mobile/src/data/catalog.ts');
const exercise = getBuiltinExercises()[0];
const item = (id, sets, group = 'g') => ({ id, supersetId: group, exercise, planned: { sets, quantity: 5, kg: 25, rir: 2, tempo: '3-1-X-0' }, actual: { sets: 1, quantity: 4, kg: 30, rir: 0 }, athleteNotes: 'Wykonanie' });
const sections = main => ({ warmup: [], main, cooldown: [] });
const group = { id: 'g', section: 'main', transitionRest: '15s', roundRest: '2min' };

test('superset rounds support 3+ exercises with unequal sets and labels beyond z', () => {
  const items = [item('a', 3), item('b', 2), item('c', 1), item('unknown', null)];
  assert.deepEqual(supersetRounds(items).map(round => round.map(item => item.id)), [['a','b','c'], ['a','b'], ['a']]);
  assert.equal(supersetLabel(1, 0), '1a'); assert.equal(supersetLabel(1, 25), '1z'); assert.equal(supersetLabel(1, 26), '1aa'); assert.equal(supersetLabel(12, 99), '12cv');
  assert.deepEqual(supersetRounds([]), []);
  assert.deepEqual(items.map(item => item.planned.sets), [3, 2, 1, null]);
});

test('generic normalization handles raw drafts, deletes, moves, split reorder and ungroup without changing exercise order', () => {
  const raw = [{ id: 'a', supersetId: 'g', planned: { sets: '3,' } }, { id: 'b', supersetId: 'g', planned: { sets: '' } }, { id: 'c', supersetId: 'g', planned: { sets: '2' } }];
  const intact = normalizeSupersets({ sections: sections(raw), supersets: [group] });
  assert.deepEqual(intact.sections.main, raw); assert.deepEqual(intact.supersets, [group]);
  const deleted = normalizeSupersets({ sections: sections(raw.slice(1)), supersets: [group] });
  assert.equal(deleted.supersets.length, 1);
  const singleton = normalizeSupersets({ sections: sections(raw.slice(2)), supersets: [group] });
  assert.equal(singleton.supersets.length, 0); assert.equal(singleton.sections.main[0].supersetId, null);
  const split = normalizeSupersets({ sections: sections([raw[0], { id: 'plain', supersetId: null }, raw[1], raw[2]]), supersets: [group] });
  assert.deepEqual(split.sections.main.map(item => item.id), ['a','plain','b','c']);
  assert.ok(split.sections.main.every(item => item.supersetId === null)); assert.deepEqual(split.supersets, []);
  const moved = normalizeSupersets({ sections: { ...sections(raw.slice(0, 2)), cooldown: [raw[2]] }, supersets: [group] });
  assert.equal(moved.sections.cooldown[0].supersetId, null); assert.equal(moved.supersets.length, 1);
  const ungrouped = normalizeSupersets({ sections: sections(raw), supersets: [] });
  assert.ok(ungrouped.sections.main.every(item => item.supersetId === null));
});

test('cloning remaps all identities and preserves planned kg, RIR, tempo, order and group rests independently', () => {
  const source = { sections: sections([item('a', 3), item('b', 2), item('c', 1)]), supersets: [group] };
  const copy = cloneTrainingPlan(source);
  assert.notEqual(copy.supersets[0].id, group.id); assert.equal(copy.supersets[0].transitionRest, '15s');
  assert.equal(new Set(copy.sections.main.map(item => item.id)).size, 3);
  for (let index = 0; index < 3; index++) {
    assert.notEqual(copy.sections.main[index].id, source.sections.main[index].id);
    assert.deepEqual(copy.sections.main[index].planned, source.sections.main[index].planned);
    assert.equal(copy.sections.main[index].actual, null); assert.equal(copy.sections.main[index].athleteNotes, '');
    assert.equal(copy.sections.main[index].supersetId, copy.supersets[0].id);
  }
  copy.sections.main[0].planned.kg = 99; assert.equal(source.sections.main[0].planned.kg, 25);
});

test('local schemas distinguish RIR from kg, preserve old type null and support all sports and hidden shortcuts', () => {
  assert.deepEqual(doseSchema.parse({ sets: 2, quantity: 8, kg: 52.5 }), { sets: 2, quantity: 8, kg: 52.5, rir: null });
  for (const rir of [-1, 1.5, 101, Infinity]) assert.equal(doseSchema.safeParse({ sets: 2, quantity: 8, kg: 52.5, rir }).success, false);
  assert.equal(doseSchema.parse({ sets: null, quantity: null, kg: 0, rir: 0 }).rir, 0);
  assert.equal(workoutInputSchema.parse({ profileId: 'local-profile', sportId: 'strength', date: '2026-10-03' }).trainingType, null);
  assert.equal(templateInputSchema.parse({ profileId: 'local-profile', sportId: 'strength', name: 'Stary szablon', section: 'whole', sections: sections([]) }).trainingType, null);
  for (const id of ['ultimate','running','cycling','strength','swimming','other','football','basketball','volleyball','handball','rugby','tennis','badminton','squash','table-tennis','triathlon','rowing','martial-arts','climbing','winter-sports','calisthenics','yoga','pilates']) assert.ok(SPORTS.some(sport => sport.id === id), id);
  assert.ok(SPORTS.every(sport => SPORT_GROUPS.some(group => group.id === sport.group)));
  assert.deepEqual(profileInputSchema.parse({ displayName:'A', roles:['athlete'], sportIds:['rowing'], modules:['planning'], visibleShortcuts:[] }).visibleShortcuts, []);
});

test('mobile builtins omit factory prescriptions and invented doses while retaining catalog technique and source content', () => {
  const shared = loadTs('lib/seed.ts').initialState();
  const mobile = getBuiltinExercises(); assert.equal(mobile.length, shared.exercises.length);
  for (let index = 0; index < mobile.length; index++) {
    const original = structuredClone(shared.exercises[index]); delete original.prescription;
    assert.deepEqual(mobile[index], original); assert.equal(mobile[index].prescription, undefined);
  }
  for (const template of getBuiltinTemplates()) for (const item of Object.values(template.sections).flat()) {
    assert.deepEqual(item.planned, { sets: null, quantity: null, kg: 0, rir: null });
    assert.equal(item.actual, null); assert.equal(item.exercise.prescription, undefined);
  }
});
