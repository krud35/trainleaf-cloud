import type { LocalEvent, Workout } from '../../data/domain';
import { today } from '../../data/analytics';
import { dateLabel, sportName } from '../../ui/common';
import { currentTranslator } from '../../i18n';
import { TrainingTypeIcon, trainingTypePresentation, trainingTypeStyle } from '../shared/TrainingTypeBadge';
import { workoutStatusLabel } from './sessionStatus';
import { useI18n } from '../../i18n';

export function CalendarSession({ workout, onOpen }: { workout: Workout; onOpen: (workout: Workout) => void }) {
  const i18n = useI18n(), { t } = i18n;
  const presentation = trainingTypePresentation(workout.trainingType);
  const title = workout.title || sportName(workout.sportId);
  const status = workout.status === 'planned' ? '○' : workout.status === 'skipped' ? '–' : workout.date > today() ? '?' : '✓';
  return <button type="button" className={`week-mini-session training-type-surface calendar-session-${workout.status} ${workout.status === 'planned' && workout.date < today() ? 'calendar-session-past-plan' : ''}`} style={trainingTypeStyle(workout.trainingType)} onClick={() => onOpen(workout)} aria-label={workout.time ? t('calendar.sessionLabelTimed', { time: workout.time, title, type: presentation.name, status: workoutStatusLabel(workout) }) : t('calendar.sessionLabel', { title, type: presentation.name, status: workoutStatusLabel(workout) })}>
    <span className="week-mini-type" aria-hidden="true"><TrainingTypeIcon type={workout.trainingType} size={17}/><span>{presentation.shortName}</span></span>
    <span className="week-mini-title" aria-hidden="true">{title}</span>
    <span className="week-mini-foot" aria-hidden="true"><span className="week-mini-status">{status}</span>{workout.time && <time className="week-mini-time">{workout.time}</time>}</span>
  </button>;
}

export function CalendarEvent({ event, onOpen }: { event: LocalEvent; onOpen?: (event: LocalEvent) => void }) {
  const { t } = useI18n();
  return <button type="button" className={`week-mini-event ${event.start !== event.end ? 'calendar-event-multi' : ''}`} onClick={() => onOpen?.(event)} aria-label={t('calendar.eventLabel', { kind: t(`eventKind.${event.kind}`), title: event.title, start: dateLabel(event.start), end: dateLabel(event.end) })}>
    <span aria-hidden="true">◇</span><span>{event.title}</span>
  </button>;
}

export function calendarRange(start: string, end: string) {
  const i18n = currentTranslator();
  return i18n.t('calendar.range', { start: i18n.date(start, 'dayMonth'), end: i18n.date(end, 'full') });
}
