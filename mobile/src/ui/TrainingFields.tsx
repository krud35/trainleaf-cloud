import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { inferExerciseTypes } from '../../../lib/exercise-types';
import { TRAINING_TYPES, type Exercise, type TrainingType } from '../data/domain';
import './training-fields.css';
import { useI18n } from '../i18n';

export function Help({ label, children }: { label: string; children: ReactNode }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  return <span className="training-help" ref={ref} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); setOpen(false); ref.current?.querySelector('button')?.focus(); } }}>
    <button type="button" className="training-help-button" aria-label={t('training.explain', { label })} aria-expanded={open} aria-controls={id} onClick={event => { event.preventDefault(); setOpen(value => !value); }}>?</button>
    {open && <span id={id} role="note" className="training-help-popup">{children}<button type="button" aria-label={t('training.closeExplain', { label })} onClick={event => { event.preventDefault(); setOpen(false); }}>{t('training.close')}</button></span>}
  </span>;
}

export function TrainingTypeField({ value, onChange, required = false }: { value: TrainingType | null | undefined; onChange: (value: TrainingType | null) => void; required?: boolean }) {
  const { t } = useI18n();
  return <label className="field">{t('training.kind')}<select aria-label={t('training.kind')} required={required} value={value ?? ''} onChange={event => onChange(event.target.value ? event.target.value as TrainingType : null)}><option value="">{t('training.kindUnset')}</option>{TRAINING_TYPES.map(type => <option key={type.id} value={type.id}>{t(`trainingType.${type.id}`)}</option>)}</select></label>;
}

export type RawDose = { sets: string; quantity: string; kg: string; rir: string; tempo: string; rest: string; effort: string; prescription: string };
type TempoKind = 'strength' | 'rowing' | 'cycling' | 'running' | 'other';
/** Chooses the wording of the tempo field; the recognition itself looks at stored exercise data. */
function tempoContext(exercise: Exercise, trainingType?: TrainingType | null): TempoKind {
  const name = `${exercise.name} ${exercise.nameEn ?? ''}`.toLowerCase();
  const types = inferExerciseTypes(exercise);
  if (exercise.category === 'strength' || exercise.metric === 'kg' || types.includes('strength')) return 'strength';
  if (/row|wiosł|wiosl/.test(name)) return 'rowing';
  if (/cycl|bike|rower|kolar/.test(name)) return 'cycling';
  if (exercise.category === 'running' || /run|bieg|jog/.test(name) || exercise.metric === 'meters' && (types.includes('speed') || trainingType === 'running')) return 'running';
  if (!exercise.types?.length && exercise.category === 'conditioning' && exercise.metric === 'reps' && trainingType === 'strength') return 'strength';
  return 'other';
}
export function DoseFields({ label, value, exercise, trainingType, actual = false, readOnly = false, grouped = false, onChange }: { label: string; value: RawDose; exercise: Exercise; trainingType?: TrainingType | null; actual?: boolean; readOnly?: boolean; grouped?: boolean; onChange: (dose: RawDose) => void }) {
  const set = (key: keyof RawDose, next: string) => onChange({ ...value, [key]: next });
  const { t } = useI18n();
  const kind = tempoContext(exercise, trainingType);
  const tempo = { label: t(`training.tempo_${kind}`), help: t(`training.tempoHelp_${kind}`), placeholder: t(`training.tempoPlaceholder_${kind}`) };
  return <div className={`we-dose ${readOnly ? 'we-dose-readonly' : ''}`}><h3>{label}</h3><div className="we-dose-grid">
    <label className="field">{t('training.sets')}<input inputMode="numeric" readOnly={readOnly} value={value.sets} onChange={event => set('sets', event.target.value)} /></label>
    <label className="field">{t(`training.quantity_${exercise.metric}`)}<input inputMode="decimal" readOnly={readOnly} value={value.quantity} onChange={event => set('quantity', event.target.value)} /></label>
    {actual ? exercise.metric === 'kg' && <label className="field">{t('training.weight')}<input inputMode="decimal" readOnly={readOnly} value={value.kg} onChange={event => set('kg', event.target.value)} /></label> : <div className="field"><span>RIR <Help label="RIR">{t('training.rirHelp')} <a href="https://pubmed.ncbi.nlm.nih.gov/26049792/" target="_blank" rel="noopener noreferrer">{t('training.rirSource')}</a>.</Help></span><input aria-label="RIR" inputMode="numeric" readOnly={readOnly} value={value.rir} onChange={event => set('rir', event.target.value)} /></div>}
  </div><details className="we-details"><summary>{t('training.details')}</summary><div className="we-fields">
    <div className="field"><span>{tempo.label} <Help label={t('training.tempoHelpLabel')}>{tempo.help}{kind === 'strength' && <> <a href="https://www.nasm.org/resource-center/blog/training/tempo-training-using-lifting-tempo-to-drive-adaption" target="_blank" rel="noopener noreferrer">{t('training.tempoSource')}</a>.</>}</Help></span><input aria-label={tempo.label} placeholder={tempo.placeholder} maxLength={100} readOnly={readOnly} value={value.tempo} onChange={event => set('tempo', event.target.value)} /></div>
    {!grouped && <div className="field"><span>{t('training.restBetweenSets')} <Help label={t('training.restBetweenSets')}>{t('training.restBetweenSetsHelp')}</Help></span><input aria-label={t('training.restBetweenSets')} maxLength={100} readOnly={readOnly} value={value.rest} onChange={event => set('rest', event.target.value)} /></div>}
    {grouped && value.rest && <p className="field-hint">{t('training.previousRest', { rest: value.rest })}</p>}
    <label className="field">{t('training.effort')}<input maxLength={100} readOnly={readOnly} value={value.effort} onChange={event => set('effort', event.target.value)} /></label>
    <label className="field">{t('training.prescription')}<input maxLength={500} readOnly={readOnly} value={value.prescription} onChange={event => set('prescription', event.target.value)} /></label>
    {!actual && value.kg !== '' && value.kg !== '0' && <p className="field-hint">{t('training.previousWeight', { kg: value.kg })}</p>}
  </div></details></div>;
}
