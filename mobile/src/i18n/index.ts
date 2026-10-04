import { useSyncExternalStore } from 'react';
import { formatNumber, renderMessage, type Dictionary, type Message, type MessageParams, type ParamValue } from './core';
import { formatDateTime, formatDay, formatDecimal, formatMonth, weekdayNames, type DateStyle } from './format';
import { initializeLanguage } from './languageStore';
import { DEFAULT_LANGUAGE, LANGUAGES, LOCALE_TAGS, type Language } from './locale';
import { namespaces } from './messages';

export { LANGUAGES, LANGUAGE_NAMES, LOCALE_TAGS, DEFAULT_LANGUAGE, type Language } from './locale';
type Namespaces = typeof namespaces;
export type MessageKey = { [N in keyof Namespaces]: `${N & string}.${keyof Namespaces[N]['en'] & string}` }[keyof Namespaces];
type MessageOf<K> = K extends `${infer N}.${infer R}` ? N extends keyof Namespaces ? R extends keyof Namespaces[N]['en'] ? Namespaces[N]['en'][R] : never : never : never;
type TranslateArgs<K> = [MessageParams<MessageOf<K>>] extends [never] ? [] : [params: Record<MessageParams<MessageOf<K>>, ParamValue>];
/** A message that is stored first and rendered later, so it follows a language change. */
export type Msg = { key: MessageKey; params?: Record<string, ParamValue> };

function lookup(language: Language, key: string): Message | undefined {
  const dot = key.indexOf('.');
  const namespace = (namespaces as Record<string, Record<Language, Dictionary>>)[key.slice(0, dot)];
  // English is a runtime safety net only; the coverage test reads the dictionaries without it.
  return namespace?.[language]?.[key.slice(dot + 1)] ?? namespace?.[DEFAULT_LANGUAGE]?.[key.slice(dot + 1)];
}
export function translate<K extends MessageKey>(language: Language, key: K, ...args: TranslateArgs<K>): string {
  const message = lookup(language, key);
  return message === undefined ? key : renderMessage(language, message, args[0] as Record<string, ParamValue> | undefined);
}
export function hasMessage(key: string): key is MessageKey { return lookup(DEFAULT_LANGUAGE, key) !== undefined; }

export type Translator = {
  language: Language;
  locale: string;
  t: <K extends MessageKey>(key: K, ...args: TranslateArgs<K>) => string;
  /** Renders a stored message descriptor. */
  msg: (message: Msg | string) => string;
  n: (value: number, maximumFractionDigits?: number, minimumFractionDigits?: number) => string;
  date: (day: string, style?: DateStyle | Intl.DateTimeFormatOptions) => string;
  dateTime: (value: string | number | Date) => string;
  month: (month: string) => string;
  weekdays: (style?: 'short' | 'long' | 'narrow') => string[];
};
const translators = new Map<Language, Translator>();
export function translator(language: Language): Translator {
  let result = translators.get(language);
  if (!result) translators.set(language, result = {
    language, locale: LOCALE_TAGS[language],
    t: (key, ...args) => translate(language, key, ...args),
    msg: message => typeof message === 'string' ? message : renderMessage(language, lookup(language, message.key) ?? message.key, message.params),
    n: (value, maximumFractionDigits = 1, minimumFractionDigits = 0) => formatDecimal(language, value, maximumFractionDigits, minimumFractionDigits),
    date: (day, style) => formatDay(language, day, style),
    dateTime: value => formatDateTime(language, value),
    month: month => formatMonth(language, month),
    weekdays: style => weekdayNames(language, style),
  });
  return result;
}
function applyToDocument(language: Language) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = language;
  document.title = translate(language, 'app.documentTitle');
  document.querySelector('meta[name="description"]')?.setAttribute('content', translate(language, 'app.documentDescription'));
}
export const languageStore = () => initializeLanguage(applyToDocument);
/** For code outside React. Screens use `useI18n` so that they re-render on a language change. */
export const currentTranslator = () => translator(languageStore().getSnapshot());
export function useI18n() {
  const store = languageStore();
  const language = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  return { ...translator(language), languages: LANGUAGES, setLanguage: store.setLanguage };
}
export { formatNumber };
