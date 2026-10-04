export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';
export type ThemeSnapshot = Readonly<{ preference: ThemePreference; resolved: ResolvedTheme }>;
export const THEME_STORAGE_KEY = 'trainleaf-theme';
export function themePreference(value: unknown): ThemePreference { return value === 'light' || value === 'dark' ? value : 'system'; }
export type ThemeEnvironment = {
  readPreference: () => unknown;
  writePreference: (preference: ThemePreference) => void;
  isDark: () => boolean;
  apply: (theme: ResolvedTheme) => void;
  onSystemChange?: (callback: () => void) => () => void;
  onPreferenceChange?: (callback: (value: unknown) => void) => () => void;
};
/** Theme preference is available before the training database opens. */
export function createThemeStore(environment: ThemeEnvironment) {
  let preference: ThemePreference = 'system';
  try { preference = themePreference(environment.readPreference()); } catch { /* Private storage may be unavailable. */ }
  const resolve = (): ResolvedTheme => preference === 'system' ? environment.isDark() ? 'dark' : 'light' : preference;
  let snapshot: ThemeSnapshot = { preference, resolved: resolve() };
  const listeners = new Set<() => void>();
  const update = () => {
    const resolved = resolve();
    environment.apply(resolved);
    if (snapshot.preference === preference && snapshot.resolved === resolved) return;
    snapshot = { preference, resolved };
    listeners.forEach(listener => listener());
  };
  environment.apply(snapshot.resolved);
  const stopSystem = environment.onSystemChange?.(update);
  const stopStorage = environment.onPreferenceChange?.(value => { preference = themePreference(value); update(); });
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    setPreference: (next: ThemePreference) => {
      preference = themePreference(next);
      try { environment.writePreference(preference); } catch { /* The current session still keeps the selected theme. */ }
      update();
    },
    dispose: () => { stopSystem?.(); stopStorage?.(); listeners.clear(); },
  };
}
function browserEnvironment(): ThemeEnvironment {
  const media = window.matchMedia?.('(prefers-color-scheme: dark)');
  return {
    readPreference: () => window.localStorage.getItem(THEME_STORAGE_KEY),
    writePreference: value => window.localStorage.setItem(THEME_STORAGE_KEY, value),
    isDark: () => media?.matches ?? false,
    apply: theme => {
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#17251C' : '#F7F8F2');
    },
    onSystemChange: callback => {
      media?.addEventListener('change', callback);
      return () => media?.removeEventListener('change', callback);
    },
    onPreferenceChange: callback => {
      const changed = (event: StorageEvent) => { if (event.key === THEME_STORAGE_KEY || event.key === null) callback(event.newValue); };
      window.addEventListener('storage', changed);
      return () => window.removeEventListener('storage', changed);
    },
  };
}
let browserStore: ReturnType<typeof createThemeStore> | undefined;
export function initializeTheme() {
  browserStore ??= createThemeStore(typeof window === 'undefined' ? { readPreference: () => null, writePreference: () => {}, isDark: () => false, apply: () => {} } : browserEnvironment());
  return browserStore;
}
