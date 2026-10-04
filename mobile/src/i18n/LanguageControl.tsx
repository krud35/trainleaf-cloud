import { LANGUAGE_NAMES, useI18n, type Language } from './index';

/** Available before a profile exists, in Settings and on the recovery screen. Changing it never remounts a form. */
export function LanguageControl() {
  const { language, languages, setLanguage, t } = useI18n();
  return <fieldset className="theme-control language-control"><legend>{t('settings.languageLegend')}</legend>
    <div className="theme-options">{languages.map(code => <label className="theme-choice" key={code} lang={code}>
      <input type="radio" name="trainleaf-language" value={code} checked={language === code} onChange={() => setLanguage(code as Language)}/><span>{LANGUAGE_NAMES[code]}</span>
    </label>)}</div><p>{t('settings.languageHint')}</p></fieldset>;
}
