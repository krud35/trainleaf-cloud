import { useState, type FormEvent } from 'react';
import type { LocalSnapshot, Muscle, MuscleTarget, MuscleTargetInput } from '../../data/domain';
import type { LocalRepository } from '../../data/repository';
import { addDays, monday, today } from '../../data/analytics';
import { Feedback, useAction } from '../../ui/common';
import { PlanningDialog } from '../planning/PlanningDialog';
import { currentTranslator, useI18n } from '../../i18n';
import { dateLabel } from '../../ui/common';
export function MuscleTargetEditor({ snapshot, repository, week, muscle, target, onClose, onSaved }: { snapshot: LocalSnapshot; repository: LocalRepository; week: string; muscle: Muscle; target: MuscleTarget | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const { t } = useI18n();
  const [epoch] = useState(snapshot.epoch), [revision] = useState(target?.revision);
  const currentWeek = monday(today());
  const [scope, setScope] = useState<'period' | 'week-override'>(target?.scope === 'week-override' || week < currentWeek ? 'week-override' : 'period');
  const [unit, setUnit] = useState<MuscleTargetInput['unit']>(target?.unit ?? 'effectiveSets');
  const [start, setStart] = useState(target?.scope === 'period' ? target.start : week < currentWeek ? currentWeek : week);
  const [end, setEnd] = useState(target?.scope === 'period' ? target.end : addDays(week < currentWeek ? currentWeek : week, 27));
  const action = useAction(); const [committed, setCommitted] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget), raw = String(form.get('target'));
    const common = { profileId: snapshot.profile!.id, muscle, unit, target: raw === '' ? null : Number(raw), provenance: String(form.get('provenance')) };
    await action.run(async () => {
      if (scope === 'week-override') await repository.createMuscleWeekOverride({ ...common, weekStart: week }, epoch);
      else if (target?.scope === 'period') await repository.reviseMuscleTarget(target.id, revision!, { ...common, start, end }, epoch);
      else await repository.createMuscleTarget({ ...common, start, end }, epoch);
      setCommitted(true); action.setNotice(currentTranslator().t('muscleMap.saved')); await onSaved();
    });
  }
  return <PlanningDialog title={t('muscleMap.editorTitle', { muscle: t(`muscle.${muscle}`) })} onClose={onClose}><Feedback {...action}/><form className="stack" onSubmit={submit}><fieldset className="stack muscle-goal-fields" disabled={action.busy || committed}><legend className="sr-only">{t('muscleMap.legend')}</legend><label className="field">{t('muscleMap.scope')}<select value={scope} onChange={e => setScope(e.target.value as typeof scope)}><option value="period">{t('muscleMap.scopePeriod')}</option><option value="week-override">{t('muscleMap.scopeOverride')}</option></select></label>{scope === 'period' ? <><label className="field">{t('muscleMap.choosePeriod')}<select defaultValue="" onChange={e => { const period = snapshot.periods.find(p => p.id === e.target.value); if (period) { setStart(period.start); setEnd(period.end); } }}><option value="">{t('muscleMap.ownDates')}</option>{snapshot.periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label className="field">{t('muscleMap.validFrom')}<input type="date" required min={currentWeek} value={start} onChange={e => setStart(e.target.value)}/></label><label className="field">{t('muscleMap.validTo')}<input type="date" required min={start} value={end} onChange={e => setEnd(e.target.value)}/></label><p className="field-hint">{t('muscleMap.periodHint')}</p></> : <p>{t('muscleMap.overrideText', { start: dateLabel(week), end: dateLabel(addDays(week, 6)) })}</p>}<label className="field">{t('muscleMap.unit')}<select value={unit} onChange={e => setUnit(e.target.value as typeof unit)}><option value="effectiveSets">{t('muscleMap.unitEffective')}</option><option value="exposures">{t('muscleMap.unitExposures')}</option></select></label><label className="field">{t('muscleMap.value')}<input name="target" type="number" min="0" max="100000" step={unit === 'exposures' ? '1' : 'any'} defaultValue={target?.target ?? ''}/></label><p className="field-hint">{t('muscleMap.valueHint')}</p><label className="field">{t('muscleMap.provenanceLabel')}<textarea name="provenance" required maxLength={1000} defaultValue={target?.provenance ?? ''} placeholder={t('muscleMap.provenancePlaceholder')}/></label>{target && <p className="field-hint">{t('muscleMap.revisionHint')}</p>}</fieldset><button className="primary" disabled={action.busy || committed}>{t('muscleMap.saveGoal')}</button></form></PlanningDialog>;
}


