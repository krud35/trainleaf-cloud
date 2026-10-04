import { useEffect, useRef, useState, type FormEvent } from 'react';
import { QUIZ_EXPERIENCE, QUIZ_INTENSITIES, QUIZ_KINDS, QUIZ_LEVELS, QUIZ_MINUTES, QUIZ_RHYTHMS, QUIZ_SESSIONS, trainingQuizAnswersSchema, type TrainingQuizAnswers } from '../../data/domain';
import { Feedback, useAction } from '../../ui/common';
import { useI18n } from '../../i18n';
import './onboarding.css';

/** `new`: right after the profile was created. `update`: an existing profile without an answer. `edit`: opened from Settings. */
export type QuizMode = 'new' | 'update' | 'edit';
type Kind = TrainingQuizAnswers['kinds'][number];
type Draft = Partial<Omit<TrainingQuizAnswers, 'kinds'>> & { kinds: Kind[] };
const STEPS = ['experience', 'level', 'sessions', 'minutes', 'kinds', 'rhythm'] as const;

/** Six closed questions, one per screen. Nothing is stored until the answers are saved or the quiz is skipped. */
export function TrainingQuiz({ mode, initial, onSubmit, onSkip, onCancel }: {
  mode: QuizMode; initial: TrainingQuizAnswers | null;
  onSubmit: (answers: TrainingQuizAnswers) => Promise<void>; onSkip: () => Promise<void>; onCancel: () => void;
}) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(() => initial ? structuredClone(initial) : { kinds: [] });
  const action = useAction();
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  useEffect(() => { if (moved.current) heading.current?.focus(); window.scrollTo({ top: 0 }); }, [step]);
  const name = STEPS[step], last = step === STEPS.length - 1;
  const answered = name === 'experience' ? !!draft.experience : name === 'level' ? !!draft.level : name === 'sessions' ? draft.sessionsPerWeek !== undefined
    : name === 'minutes' ? draft.typicalMinutes !== undefined : name === 'kinds' ? draft.kinds.length > 0 : !!draft.rhythm;
  const go = (next: number) => { moved.current = true; setStep(next); };
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!answered || action.busy) return;
    if (!last) { go(step + 1); return; }
    await action.run(() => onSubmit(trainingQuizAnswersSchema.parse(draft)));
  }
  function single<T extends string | number>(group: string, options: readonly T[], value: string | number | undefined, label: (option: T) => string, choose: (option: T) => void) {
    return <div className="quiz-options">{options.map(option => <label key={option} className="module-choice quiz-option"><input type="radio" name={group} checked={value === option} onChange={() => choose(option)}/><span>{label(option)}</span></label>)}</div>;
  }
  const toggleKind = (type: Kind['type']) => setDraft(d => ({ ...d, kinds: d.kinds.some(kind => kind.type === type) ? d.kinds.filter(kind => kind.type !== type) : QUIZ_KINDS.filter(id => id === type || d.kinds.some(kind => kind.type === id)).map(id => d.kinds.find(kind => kind.type === id) ?? { type: id, intensity: 'moderate' as const }) }));
  const question = t(`quiz.q_${name}`);
  return <section className="training-quiz stack" aria-labelledby="training-quiz-title">
    <div className="page-heading"><div><p className="eyebrow">{t('quiz.title')}</p><h1 id="training-quiz-title" ref={heading} tabIndex={-1}>{question}</h1>
      {step === 0 && <p className="intro">{t(mode === 'new' ? 'quiz.introNew' : mode === 'update' ? 'quiz.introUpdate' : 'quiz.introEdit')} {t('quiz.privacy')}</p>}</div></div>
    <div className="quiz-progress"><span role="progressbar" aria-label={t('quiz.progress', { current: step + 1, total: STEPS.length })} aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1}><i style={{ width: `${(step + 1) / STEPS.length * 100}%` }}/></span><small>{t('quiz.progress', { current: step + 1, total: STEPS.length })}</small></div>
    <Feedback error={action.error} notice={action.notice}/>
    <form className="stack" onSubmit={event => void submit(event)}>
      <fieldset className="quiz-question" disabled={action.busy}><legend className="sr-only">{question}</legend>
        {name === 'experience' && single('quiz-experience', QUIZ_EXPERIENCE, draft.experience, option => t(`quiz.experience_${option}`), experience => setDraft(d => ({ ...d, experience })))}
        {name === 'level' && single('quiz-level', QUIZ_LEVELS, draft.level, option => t(`quiz.level_${option}`), level => setDraft(d => ({ ...d, level })))}
        {name === 'sessions' && <div className="quiz-compact">{single('quiz-sessions', QUIZ_SESSIONS, draft.sessionsPerWeek, option => option === 0 ? t('quiz.sessions_0') : option === 8 ? t('quiz.sessions_8') : t('quiz.sessions_n', { count: option }), sessionsPerWeek => setDraft(d => ({ ...d, sessionsPerWeek })))}</div>}
        {name === 'minutes' && single('quiz-minutes', QUIZ_MINUTES, draft.typicalMinutes, option => t(`quiz.minutes_${option}`), typicalMinutes => setDraft(d => ({ ...d, typicalMinutes })))}
        {name === 'kinds' && <><p className="field-hint">{t('quiz.kindsHint')}</p><div className="quiz-options">{QUIZ_KINDS.map(type => {
          const chosen = draft.kinds.find(kind => kind.type === type), kindName = t(`trainingType.${type}`);
          return <div key={type} className="quiz-kind"><label className="module-choice quiz-option"><input type="checkbox" checked={!!chosen} onChange={() => toggleKind(type)}/><span>{kindName}</span></label>
            {chosen && <div className="quiz-intensity" role="radiogroup" aria-label={t('quiz.intensityFor', { kind: kindName })}>{QUIZ_INTENSITIES.map(intensity => <label key={intensity} className="module-choice quiz-option"><input type="radio" name={`quiz-intensity-${type}`} checked={chosen.intensity === intensity} onChange={() => setDraft(d => ({ ...d, kinds: d.kinds.map(kind => kind.type === type ? { ...kind, intensity } : kind) }))}/><span>{t(`quiz.intensity_${intensity}`)}</span></label>)}</div>}
          </div>;
        })}</div></>}
        {name === 'rhythm' && single('quiz-rhythm', QUIZ_RHYTHMS, draft.rhythm, option => t(`quiz.rhythm_${option}`), rhythm => setDraft(d => ({ ...d, rhythm })))}
      </fieldset>
      <div className="quiz-actions"><button type="button" className="secondary quiz-back" disabled={step === 0 || action.busy} onClick={() => go(step - 1)}>{t('quiz.back')}</button><button type="submit" className="primary" disabled={!answered || action.busy}>{t(last ? 'quiz.finish' : 'quiz.next')}</button></div>
    </form>
    {mode === 'edit' ? <button type="button" className="text-button quiz-skip" disabled={action.busy} onClick={onCancel}>{t('quiz.cancel')}</button>
      : <div className="quiz-skip-row"><button type="button" className="text-button quiz-skip" disabled={action.busy} onClick={() => void action.run(onSkip)}>{t('quiz.skip')}</button><p className="field-hint">{t('quiz.skipHint')}</p></div>}
  </section>;
}
