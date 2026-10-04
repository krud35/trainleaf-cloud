import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, type ThemePreference } from './useTheme';
import { useI18n } from '../../i18n';
const choices = [ { value: 'light', name: 'settings.themeLight', Icon: Sun }, { value: 'dark', name: 'settings.themeDark', Icon: Moon }, { value: 'system', name: 'settings.themeSystem', Icon: Monitor } ] as const;
export function ThemeControl() {
  const { preference, setPreference } = useTheme();
  const { t } = useI18n();
  return <fieldset className="theme-control"><legend>{t('settings.themeLegend')}</legend><div className="theme-options">{choices.map(({ value, name, Icon }) => <label className="theme-choice" key={value}><input type="radio" name="trainleaf-theme" value={value} checked={preference === value} onChange={() => setPreference(value as ThemePreference)}/><Icon size={18} aria-hidden="true"/><span>{t(name)}</span></label>)}</div><p>{t('settings.themeHint')}</p></fieldset>;
}
