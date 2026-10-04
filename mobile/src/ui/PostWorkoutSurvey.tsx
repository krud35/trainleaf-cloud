import { useState, type FormEvent } from 'react';
import { workoutInputSchema, type PostWorkout, type Workout } from '../data/domain';
import type { LocalRepository } from '../data/repository';
import { RangeField } from './RangeField';
import { Feedback, useAction } from './common';
import { postFatigueLabels, satisfactionLabels } from './scale-labels';
import { useI18n } from '../i18n';

export function PostWorkoutSurvey({ workout, epoch, repository, onSaved, onClose }: { workout: Workout; epoch: number; repository: LocalRepository; onSaved: (workout: Workout) => void; onClose: () => void }) {
  const [answers, setAnswers] = useState<PostWorkout>(() => structuredClone(workout.postWorkout));
  const { t } = useI18n();
  const action = useAction();
  const update = <K extends keyof PostWorkout>(key: K, value: PostWorkout[K]) => setAnswers(old => ({ ...old, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault();
    await action.run(async () => {
      const input = workoutInputSchema.parse(Object.fromEntries(Object.keys(workoutInputSchema.shape).map(key => [key, workout[key as keyof Workout]])));
      const saved = await repository.updateWorkout(workout.id, workout.revision, { ...input, postWorkout: answers }, epoch);
      onSaved(saved);
    });
  }
  return <section className="stack"><div className="page-heading"><div><p className="eyebrow">{workout.title}</p><h1>{t('survey.title')}</h1><p className="intro">{t('survey.intro')}</p></div></div>
    <Feedback error={action.error} notice={action.notice}/><form className="stack" onSubmit={submit}><fieldset className="card stack" disabled={action.busy}><legend className="sr-only">{t('survey.legend')}</legend>
      <RangeField label={t('survey.aerobicLabel')} question={t('survey.aerobicQuestion')} value={answers.aerobicFatigue} labels={postFatigueLabels()} onChange={value => update('aerobicFatigue',value)}/>
      <RangeField label={t('survey.muscularLabel')} question={t('survey.muscularQuestion')} value={answers.muscularFatigue} labels={postFatigueLabels()} onChange={value => update('muscularFatigue',value)}/>
      <RangeField label={t('survey.satisfactionLabel')} value={answers.satisfaction} labels={satisfactionLabels()} onChange={value => update('satisfaction',value)}/>
      <label className="field">{t('survey.note')}<textarea maxLength={10000} value={answers.notes} onChange={event => update('notes',event.target.value)}/></label>
    </fieldset><button className="primary" disabled={action.busy}>{t('survey.save')}</button><button type="button" className="secondary" disabled={action.busy} onClick={onClose}>{t('survey.skip')}</button></form>
  </section>;
}
