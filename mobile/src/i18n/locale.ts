export const LANGUAGES = ['en', 'pl', 'fr', 'es'] as const;
export type Language = typeof LANGUAGES[number];
/** Used whenever no valid choice is stored. The device language is deliberately ignored. */
export const DEFAULT_LANGUAGE: Language = 'en';
export const LOCALE_TAGS: Record<Language, string> = { en: 'en-GB', pl: 'pl-PL', fr: 'fr-FR', es: 'es-ES' };
/** Autonyms: each language is always listed under its own name. */
export const LANGUAGE_NAMES: Record<Language, string> = { en: 'English', pl: 'Polski', fr: 'Français', es: 'Español' };
export const LANGUAGE_STORAGE_KEY = 'trainleaf-language';
export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);
}
export function languagePreference(value: unknown): Language { return isLanguage(value) ? value : DEFAULT_LANGUAGE; }
