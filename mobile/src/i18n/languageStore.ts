import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, languagePreference, type Language } from './locale';

export type LanguageEnvironment = {
  readPreference: () => unknown;
  writePreference: (language: Language) => void;
  apply: (language: Language) => void;
  onPreferenceChange?: (callback: (value: unknown) => void) => () => void;
};
/** Language preference is available before the training database opens and never depends on it. */
export function createLanguageStore(environment: LanguageEnvironment) {
  let language: Language = DEFAULT_LANGUAGE;
  try { language = languagePreference(environment.readPreference()); } catch { /* Private storage may be unavailable; English is the safe fallback. */ }
  const listeners = new Set<() => void>();
  const apply = () => { try { environment.apply(language); } catch { /* Document metadata is cosmetic. */ } };
  const update = (next: Language) => {
    if (next === language) return;
    language = next;
    apply();
    listeners.forEach(listener => listener());
  };
  apply();
  const stopStorage = environment.onPreferenceChange?.(value => update(languagePreference(value)));
  return {
    getSnapshot: () => language,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    setLanguage: (next: Language) => {
      const valid = languagePreference(next);
      try { environment.writePreference(valid); } catch { /* The current session still keeps the selected language. */ }
      update(valid);
    },
    dispose: () => { stopStorage?.(); listeners.clear(); },
  };
}
export type LanguageStore = ReturnType<typeof createLanguageStore>;
function browserEnvironment(apply: (language: Language) => void): LanguageEnvironment {
  return {
    readPreference: () => window.localStorage.getItem(LANGUAGE_STORAGE_KEY),
    writePreference: value => window.localStorage.setItem(LANGUAGE_STORAGE_KEY, value),
    apply,
    onPreferenceChange: callback => {
      const changed = (event: StorageEvent) => { if (event.key === LANGUAGE_STORAGE_KEY || event.key === null) callback(event.key === null ? null : event.newValue); };
      window.addEventListener('storage', changed);
      return () => window.removeEventListener('storage', changed);
    },
  };
}
let browserStore: LanguageStore | undefined;
/** `apply` receives the language on start and after each change (document language, title). */
export function initializeLanguage(apply: (language: Language) => void = () => {}) {
  browserStore ??= createLanguageStore(typeof window === 'undefined'
    ? { readPreference: () => null, writePreference: () => {}, apply }
    : browserEnvironment(apply));
  return browserStore;
}
