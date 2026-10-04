import { useId } from 'react';
import { useI18n } from '../i18n';

type Props = { label: string; question?: string; value: number | null; min?: number; max?: number; labels?: readonly string[]; onChange: (value: number | null) => void };
export function RangeField({ label, question, value, min = 0, max = 10, labels, onChange }: Props) {
  const { t } = useI18n();
  const id = useId();
  const displayed = value ?? Math.round((min + max) / 2);
  const description = value === null ? t('survey.rangeNoAnswer') : labels?.[value - min] ?? t('survey.rangeValue', { value, max });
  return <div className={`range-field ${value === null ? 'unanswered' : ''}`}>
    <div className="range-heading"><label htmlFor={id}>{label}</label><output htmlFor={id}>{value === null ? '—' : `${value}/${max}`}</output></div>
    {question && <p className="field-hint" id={`${id}-question`}>{question}</p>}
    <input id={id} type="range" min={min} max={max} step={1} value={displayed} aria-valuetext={description} aria-describedby={`${id}-description${question ? ` ${id}-question` : ''}`} onChange={event => onChange(Number(event.currentTarget.value))} onPointerUp={event => onChange(Number(event.currentTarget.value))} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onChange(displayed); } }} />
    <div className="range-ends" aria-hidden="true"><span>{min}</span><span>{max}</span></div>
    <p className="range-description" id={`${id}-description`} aria-live="polite">{description}</p>
    {value === null ? <span className="optional">{t('survey.rangeHint')}</span> : <button type="button" className="text-button" aria-label={t('survey.rangeClear', { label })} onClick={() => onChange(null)}>{t('survey.rangeSkip')}</button>}
  </div>;
}
