import { RangeField } from '../../ui/RangeField';
import { postFatigueLabels } from '../../ui/scale-labels';
import './workout-planning.css';
import { useI18n } from '../../i18n';

export type RawPlannedFatigue = { aerobicFatigue: string; muscularFatigue: string };
function rating(value: string) {
  if (!value.trim()) return null;
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 && number <= 10 ? number : null;
}
export function PlannedFatigueFields({ value, readOnly, onChange }: { value: RawPlannedFatigue; readOnly?: boolean; onChange: (value: RawPlannedFatigue) => void }) {
  const { t } = useI18n();
  return <fieldset className="planned-fatigue-fields" disabled={readOnly}><legend>{t('training.plannedFatigue')}</legend><p className="field-hint">{t('training.plannedFatigueHint')}</p><RangeField label={t('training.plannedAerobic')} value={rating(value.aerobicFatigue)} labels={postFatigueLabels()} onChange={next => onChange({ ...value, aerobicFatigue: next === null ? '' : String(next) })}/><RangeField label={t('training.plannedMuscular')} value={rating(value.muscularFatigue)} labels={postFatigueLabels()} onChange={next => onChange({ ...value, muscularFatigue: next === null ? '' : String(next) })}/></fieldset>;
}
