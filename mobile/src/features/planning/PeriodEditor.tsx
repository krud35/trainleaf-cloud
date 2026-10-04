import { useState, type FormEvent } from 'react';
import type { LocalSnapshot, Period, PeriodInput } from '../../data/domain';
import type { LocalRepository } from '../../data/repository';
import { addDays, today } from '../../data/analytics';
import { periodPresets } from '../../../../lib/period-presets';
import { Feedback, useAction } from '../../ui/common';
import { currentTranslator, useI18n } from '../../i18n';
import { presetText } from '../../i18n/factory';
export function PeriodEditor({ repository, snapshot, period, onClose, onSaved }: { repository: LocalRepository; snapshot: LocalSnapshot; period: Period | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const [revision] = useState(period?.revision);
  const [epoch] = useState(snapshot.epoch);
  const [level, setLevel] = useState(period?.level ?? '');
  const [preset, setPreset] = useState(period?.preset ?? '');
  const [deleting, setDeleting] = useState(false), [committed, setCommitted] = useState(false);
  const { t, language } = useI18n();
  const action = useAction();
  const parents = snapshot.periods.filter(p => p.id !== period?.id && ((level === 'micro' && p.level === 'meso') || (level === 'meso' && p.level === 'macro')));
  const presetInfo = presetText(preset, language);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const input: PeriodInput = { profileId: snapshot.profile!.id, name: String(data.get('name')), start: String(data.get('start')), end: String(data.get('end')), level: (level || null) as PeriodInput['level'], parentId: String(data.get('parentId') ?? '') || null, goal: String(data.get('goal')), description: String(data.get('description')), preset: preset || null };
    await action.run(async () => { if (period) await repository.updatePeriod(period.id, revision!, input, epoch); else await repository.createPeriod(input, epoch); setCommitted(true); action.setNotice(currentTranslator().t('planning.savedOnDevice')); await onSaved(); });
  }
  return <div className="stack"><button className="back" disabled={action.busy} onClick={onClose}>{t('planning.backToPlan')}</button><h1>{t(period ? 'planning.editPeriodTitle' : 'planning.newPeriod')}</h1><Feedback {...action} /><form className="form-layout" onSubmit={submit}><fieldset className="card stack" disabled={action.busy || committed}><legend className="sr-only">{t('planning.periodData')}</legend><label className="field">{t('planning.periodName')}<input name="name" required maxLength={160} defaultValue={period?.name ?? ''} /></label><div className="form-row"><label className="field">{t('planning.periodStart')}<input name="start" type="date" required defaultValue={period?.start ?? today()} /></label><label className="field">{t('planning.periodEnd')}<input name="end" type="date" required defaultValue={period?.end ?? addDays(today(), 27)} /></label></div><label className="field">{t('planning.periodGoal')}<textarea name="goal" defaultValue={period?.goal ?? ''} maxLength={10000} /></label><label className="field">{t('planning.periodDescription')}<textarea name="description" defaultValue={period?.description ?? ''} maxLength={10000} /></label>
      <details><summary>{t('planning.hierarchy')}</summary><div className="stack detail-content"><label className="field">{t('planning.levelLabel')}<select value={level} onChange={e => setLevel(e.target.value as typeof level)}><option value="">{t('planning.levelSimple')}</option><option value="macro">{t('planning.levelMacro')}</option><option value="meso">{t('planning.levelMeso')}</option><option value="micro">{t('planning.levelMicro')}</option></select></label><label className="field">{t('planning.parent')}<select name="parentId" key={level} defaultValue={period?.parentId ?? ''}><option value="">{t('planning.noParent')}</option>{parents.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label className="field">{t('planning.character')}<select value={preset} onChange={e => setPreset(e.target.value)}><option value="">{t('planning.noPreset')}</option>{periodPresets.filter(p => !level || p.levels.includes(level)).map(p => <option key={p.id} value={p.id}>{presetText(p.id, language)?.name ?? p.namePl}</option>)}</select></label>{presetInfo && <p className="field-hint">{presetInfo.description}</p>}</div></details>
    </fieldset><button className="primary" disabled={action.busy || committed}>{t('planning.savePeriod')}</button></form>
    {period && <div>{!deleting ? <button className="text-button danger" disabled={committed || action.busy} onClick={() => setDeleting(true)}>{t('planning.deletePeriod')}</button> : <div className="confirm-box"><p>{t('planning.deletePeriodText')}</p><button className="secondary danger" disabled={action.busy || committed} onClick={() => action.run(async () => { await repository.deletePeriod(period.id, revision!, epoch); setCommitted(true); action.setNotice(currentTranslator().t('planning.savedOnDevice')); await onSaved(); })}>{t('planning.confirmDeletePeriod')}</button><button className="text-button" onClick={() => setDeleting(false)}>{t('planning.cancel')}</button></div>}</div>}
  </div>;
}







