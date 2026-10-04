import { LANGUAGES, LOCALE_TAGS, type Language } from './locale';

/** Complete sentences only. `count` selects the form; every form may use the same parameters. */
export type PluralMessage = { one: string; few?: string; many?: string; other: string };
export type Message = string | PluralMessage;
export type Dictionary = Record<string, Message>;
type Shape<T> = { [K in keyof T]: T[K] extends string ? string : PluralMessage };
export type Namespace<T extends Dictionary = Dictionary> = { en: T; pl: Shape<T>; fr: Shape<T>; es: Shape<T> };
/** English defines the keys and parameters; the other languages must have exactly the same keys. */
export function defineMessages<const T extends Dictionary>(messages: { en: T; pl: Shape<T>; fr: Shape<T>; es: Shape<T> }): Namespace<T> {
  return messages;
}
type ParamNames<S> = S extends `${string}{${infer P}}${infer R}` ? P | ParamNames<R> : never;
export type MessageParams<M> = M extends string ? ParamNames<M> : M extends PluralMessage ? 'count' | ParamNames<M[keyof M]> : never;
export type ParamValue = string | number;

/** Plural categories that must be written out. French and Spanish use `other` for the rare `many` category. */
export const REQUIRED_PLURAL_FORMS: Record<Language, readonly (keyof PluralMessage)[]> = {
  en: ['one', 'other'], pl: ['one', 'few', 'many', 'other'], fr: ['one', 'other'], es: ['one', 'other'],
};
const pluralRules = new Map<Language, Intl.PluralRules>();
const numberFormats = new Map<string, Intl.NumberFormat>();
export function pluralCategory(language: Language, count: number) {
  let rules = pluralRules.get(language);
  if (!rules) pluralRules.set(language, rules = new Intl.PluralRules(LOCALE_TAGS[language]));
  return rules.select(count);
}
export function formatNumber(language: Language, value: number, options: Intl.NumberFormatOptions = {}) {
  const resolved = { maximumFractionDigits: 2, ...options };
  const key = `${language}:${JSON.stringify(resolved)}`;
  let format = numberFormats.get(key);
  if (!format) numberFormats.set(key, format = new Intl.NumberFormat(LOCALE_TAGS[language], resolved));
  return format.format(value);
}
export function parameterNames(message: Message): string[] {
  const texts = typeof message === 'string' ? [message] : Object.values(message);
  const names = new Set<string>();
  for (const text of texts) for (const match of text.matchAll(/\{([A-Za-z0-9_]+)\}/g)) names.add(match[1]);
  if (typeof message !== 'string') names.add('count');
  return [...names].sort();
}
/** Renders one message. Numbers are formatted for the language; strings are inserted unchanged. */
export function renderMessage(language: Language, message: Message, params: Record<string, ParamValue> = {}) {
  let text: string;
  if (typeof message === 'string') text = message;
  else {
    const count = Number(params.count);
    const category = Number.isFinite(count) ? pluralCategory(language, count) : 'other';
    text = (message as Record<string, string | undefined>)[category] ?? message.other;
  }
  return text.replace(/\{([A-Za-z0-9_]+)\}/g, (whole, name: string) => {
    const value = params[name];
    return value === undefined ? whole : typeof value === 'number' ? formatNumber(language, value) : value;
  });
}
export type CoverageIssue = { language: Language; key: string; problem: string };
/** Strict comparison without fallback: a key satisfied only by English is reported as missing. */
export function coverageIssues(namespaces: Record<string, Namespace>): CoverageIssue[] {
  const issues: CoverageIssue[] = [];
  for (const [name, namespace] of Object.entries(namespaces)) {
    for (const language of LANGUAGES) {
      const dictionary = namespace[language] as Dictionary | undefined;
      for (const [key, source] of Object.entries(namespace.en)) {
        const id = `${name}.${key}`, message = dictionary?.[key];
        if (message === undefined) { issues.push({ language, key: id, problem: 'missing' }); continue; }
        if (typeof message !== typeof source) { issues.push({ language, key: id, problem: 'plural shape differs from English' }); continue; }
        const texts = typeof message === 'string' ? [message] : Object.values(message);
        if (texts.some(text => !text.trim())) issues.push({ language, key: id, problem: 'empty text' });
        if (parameterNames(message).join() !== parameterNames(source).join()) issues.push({ language, key: id, problem: `parameters ${parameterNames(message).join() || '-'} differ from ${parameterNames(source).join() || '-'}` });
        if (typeof message !== 'string') {
          for (const form of REQUIRED_PLURAL_FORMS[language]) if (!message[form]) issues.push({ language, key: id, problem: `plural form "${form}" missing` });
          for (const form of Object.keys(message)) if (!['one', 'few', 'many', 'other'].includes(form)) issues.push({ language, key: id, problem: `unknown plural form "${form}"` });
        }
      }
      for (const key of Object.keys(dictionary ?? {})) if (!(key in namespace.en)) issues.push({ language, key: `${name}.${key}`, problem: 'not defined in English' });
    }
  }
  return issues;
}
