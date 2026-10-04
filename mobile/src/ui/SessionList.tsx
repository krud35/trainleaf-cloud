import { ArrowRight } from 'lucide-react';
import type { Workout } from '../data/domain';
import { dateLabel, sportName } from './common';
import { workoutStatusLabel } from './WeekOverview';
import { isCompletedHistory } from '../data/analytics';
import { trainingLoad } from '../data/load';
import { TrainingTypeBadge, trainingTypeStyle } from '../features/shared/TrainingTypeBadge';
import '../features/today/session-list.css';
import { useI18n } from '../i18n';

export function SessionList({ workouts, onOpen, onSurvey, showDate = true, showLoad = true, compactDate = false }: { workouts: Workout[]; onOpen: (workout: Workout) => void; onSurvey?: (workout: Workout) => void; showDate?: boolean; showLoad?: boolean; compactDate?: boolean }) {
  const i18n = useI18n(), { t } = i18n;
  return <ol className="workout-list session-list">{workouts.map(workout => {
    const title = workout.title || sportName(workout.sportId);
    const minutes = workout.status === 'planned' ? workout.plannedMinutes : workout.durationMinutes;
    const load = showLoad ? trainingLoad(workout) : null;
    return <li key={workout.id}><button type="button" className="workout-card session-card training-type-surface" style={trainingTypeStyle(workout.trainingType)} aria-label={t('session.openNamed', { title })} onClick={() => onOpen(workout)}>
      <span className="session-card-top"><TrainingTypeBadge type={workout.trainingType}/><span className="session-status">{workoutStatusLabel(workout)}</span></span>
      <span className="session-card-title"><strong>{title}</strong></span>
      <span className="session-metadata">{showDate && <span>{compactDate ? i18n.date(workout.date, 'dayMonthLong') : dateLabel(workout.date)}</span>}{workout.time && <span>{workout.time}</span>}{minutes !== null && <span>{t(workout.status === 'planned' ? 'session.planMinutes' : 'session.minutes', { minutes })}</span>}{!compactDate && workout.status === 'completed' && workout.rpe !== null && <span>{t('session.rpe', { value: workout.rpe })}</span>}</span>
      <span className="session-sport">{sportName(workout.sportId)}</span>
      {load !== null && <span className="session-load">{t('session.trainleafIndex', { value: i18n.n(load, 1, 1) })}</span>}
      {workout.notes && <span className="session-note">{workout.notes}</span>}
      <span className="session-card-link">{t('session.open')} <ArrowRight size={17} aria-hidden="true"/></span>
    </button>{onSurvey && isCompletedHistory(workout) && <button type="button" className="text-button session-survey-link" onClick={() => onSurvey(workout)} aria-label={t('session.surveyNamed', { title })}>{t('session.survey')}</button>}</li>;
  })}</ol>;
}
