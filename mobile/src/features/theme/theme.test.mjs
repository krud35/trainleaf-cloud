import test from 'node:test';
import assert from 'node:assert/strict';
import { createThemeStore, themePreference } from './themeStore.ts';
function environment(initial = null, dark = false) {
  let saved = initial, system = dark, systemListener, storageListener;
  const applied = [];
  const store = createThemeStore({
    readPreference: () => saved,
    writePreference: value => { saved = value; },
    isDark: () => system,
    apply: theme => applied.push(theme),
    onSystemChange: callback => { systemListener = callback; return () => { systemListener = undefined; }; },
    onPreferenceChange: callback => { storageListener = callback; return () => { storageListener = undefined; }; },
  });
  return { store, applied, saved: () => saved, changeSystem: dark => { system = dark; systemListener?.(); }, changeStorage: value => storageListener?.(value) };
}
test('unknown preferences default to system; saved explicit modes survive startup', () => {
  assert.equal(themePreference('unexpected'), 'system');
  assert.deepEqual(environment(null, true).store.getSnapshot(), { preference: 'system', resolved: 'dark' });
  assert.deepEqual(environment('light', true).store.getSnapshot(), { preference: 'light', resolved: 'light' });
  assert.deepEqual(environment('dark', false).store.getSnapshot(), { preference: 'dark', resolved: 'dark' });
});
test('system mode updates live, explicit choice stays fixed, returning to system uses current OS', () => {
  const env = environment();
  let notifications = 0;
  const unsubscribe = env.store.subscribe(() => notifications++);
  env.changeSystem(true);
  assert.equal(env.store.getSnapshot().resolved, 'dark');
  env.store.setPreference('light');
  assert.equal(env.saved(), 'light');
  env.changeSystem(false);
  env.changeSystem(true);
  assert.equal(env.store.getSnapshot().resolved, 'light');
  assert.equal(notifications, 2);
  env.store.setPreference('system');
  assert.equal(env.store.getSnapshot().resolved, 'dark');
  unsubscribe();
  env.changeSystem(false);
  assert.equal(notifications, 3);
});
test('storage updates synchronize other windows, removal restores system, dispose releases listeners', () => {
  const env = environment('light', true);
  env.changeStorage('dark');
  assert.deepEqual(env.store.getSnapshot(), { preference: 'dark', resolved: 'dark' });
  env.changeStorage(null);
  assert.deepEqual(env.store.getSnapshot(), { preference: 'system', resolved: 'dark' });
  env.store.dispose();
  env.changeSystem(false);
  assert.equal(env.store.getSnapshot().resolved, 'dark');
});
test('unavailable persistence never blocks startup or selecting another appearance', () => {
  const applied = [];
  const store = createThemeStore({ readPreference: () => { throw new Error('blocked'); }, writePreference: () => { throw new Error('blocked'); }, isDark: () => false, apply: theme => applied.push(theme) });
  assert.deepEqual(store.getSnapshot(), { preference: 'system', resolved: 'light' });
  store.setPreference('dark');
  assert.deepEqual(store.getSnapshot(), { preference: 'dark', resolved: 'dark' });
  assert.deepEqual(applied, ['light', 'dark']);
});
