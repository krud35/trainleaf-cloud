import { useState } from 'react';
import { workoutInputSchema, type LocalSnapshot, type Workout } from '../../data/domain';
import type { LocalRepository } from '../../data/repository';
import { addDays } from '../../data/analytics';
import { dateLabel, Feedback, useAction } from '../../ui/common';
import { PlanningDialog } from '../planning/PlanningDialog';
import { ReserveBar } from './ReserveBar';

import { currentTranslator, useI18n } from '../../i18n';

export type MoveRequest = { workout: Workout; date: string; epoch: number; snapshot: LocalSnapshot };
export function MoveWorkoutDialog({ request, repository, onClose, onSaved }: { request: MoveRequest; repository: LocalRepository; onClose: () => void; onSaved: (workout: Workout) => Promise<void> }) {
  const [committed, setCommitted] = useState(false);
  const { t } = useI18n();

  const action = useAction();
  const before = request.snapshot;
  // One object for the dialog's lifetime, so the forecast of the moved plan is built once.
  const [after] = useState(() => ({ ...before, workouts: before.workouts.map(w => w.id === request.workout.id ? { ...w, date: request.date } : w) }));
  // A session changes the bar of its own day and of the next one most.
  const days = [...new Set([request.workout.date, addDays(request.workout.date, 1), request.date, addDays(request.date, 1)])].sort();
  async function save() {
    let saved: Workout | null = null;
    await action.run(async () => {
      const input = workoutInputSchema.parse(Object.fromEntries(Object.keys(workoutInputSchema.shape).map(key => [key, request.workout[key as keyof Workout]])));
      saved = await repository.updateWorkout(request.workout.id, request.workout.revision, { ...input, date: request.date }, request.epoch);
      setCommitted(true);
    });
    if (saved) { try { await onSaved(saved); } catch { action.setError(currentTranslator().t('forecast.moveRefreshFailed')); } }
  }
  return <PlanningDialog title={t('forecast.moveTitle')} onClose={onClose}><Feedback error={action.error} notice={action.notice}/><p><strong>{request.workout.title || t('forecast.untitled')}</strong>{t('forecast.moveLine', { from: dateLabel(request.workout.date), to: dateLabel(request.date) })}</p><h3>{t('forecast.moveHeading')}</h3><p className="field-hint">{t('forecast.moveHint')}</p>{days.map(day => <section className="stack reserve-compare" key={day}><strong>{dateLabel(day)}</strong><div className="form-row"><div><span>{t('forecast.before')}</span><ReserveBar snapshot={before} day={day}/></div><div><span>{t('forecast.after')}</span><ReserveBar snapshot={after} day={day}/></div></div></section>)}<button className="primary" disabled={action.busy || committed} onClick={() => void save()}>{t(committed ? 'forecast.moved' : 'forecast.confirmMove')}</button><button className="secondary" disabled={action.busy} onClick={onClose}>{t(committed ? 'forecast.close' : 'forecast.cancel')}</button></PlanningDialog>;
}
