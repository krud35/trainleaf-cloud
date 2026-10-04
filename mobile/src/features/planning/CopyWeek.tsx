import { useState } from 'react';
import type { LocalSnapshot } from '../../data/domain';
import type { LocalRepository } from '../../data/repository';
import { addDays, monday } from '../../data/analytics';
import { dateLabel, Feedback, useAction } from '../../ui/common';
import { currentTranslator, useI18n } from '../../i18n';
export function CopyWeek({ week, snapshot, repository, onChanged }: { week: string; snapshot: LocalSnapshot; repository: LocalRepository; onChanged: () => Promise<void> }) {
  const [target, setTarget] = useState(addDays(week, 7));
  const [request, setRequest] = useState<{ source: string; target: string; epoch: number; count: number } | null>(null);
  const { t } = useI18n();
  const action = useAction();
  return <details><summary>{t('planning.copyWeek')}</summary><div className="stack detail-content"><Feedback {...action}/><p>{t('planning.copyWeekHint')}</p><label className="field">{t('planning.targetWeek')}<input type="date" value={target} onChange={e => { setTarget(e.target.value); setRequest(null); }}/></label>{!request ? <button className="secondary" disabled={!target || action.busy} onClick={() => setRequest({ source: week, target: monday(target), epoch: snapshot.epoch, count: snapshot.workouts.filter(w => w.date >= week && w.date <= addDays(week, 6)).length })}>{t('planning.reviewCopy')}</button> : <div className="confirm-box"><p>{t('planning.copyConfirm', { count: request.count, source: dateLabel(request.source), target: dateLabel(request.target) })}</p><button className="primary" disabled={action.busy} onClick={() => action.run(async () => { const copied = await repository.copyWeek(snapshot.profile!.id, request.source, request.target, request.epoch); setRequest(null); action.setNotice(currentTranslator().t('planning.copyDone', { count: copied.length })); await onChanged(); })}>{t('planning.confirmCopy')}</button><button className="text-button" disabled={action.busy} onClick={() => setRequest(null)}>{t('planning.cancel')}</button></div>}</div></details>;
}
