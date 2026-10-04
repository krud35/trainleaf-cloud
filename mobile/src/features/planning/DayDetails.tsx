import { useState, type ReactNode } from 'react';
import type { LocalEvent, Workout } from '../../data/domain';
import { eventsForDate } from '../../data/analytics';
import { dateLabel, sportName } from '../../ui/common';
import { workoutStatusLabel } from './sessionStatus';
import { TrainingTypeBadge, trainingTypeStyle } from '../shared/TrainingTypeBadge';
import { EventCard } from './EventView';
import { useI18n } from '../../i18n';

export type DayDetailsProps = { day: string; workouts: Workout[]; events?: LocalEvent[]; onOpen: (workout: Workout) => void; onNew?: (day: string) => void; onOpenEvent?: (event: LocalEvent) => void; onNewEvent?: (day: string) => void; readiness?: ReactNode; onReschedule?: (workout: Workout, day: string) => void };
export function DayDetails({ day, workouts, events = [], onOpen, onNew, onOpenEvent, onNewEvent, readiness, onReschedule }: DayDetailsProps) {
  const { t } = useI18n();
  const sessions = workouts.filter(w => w.date === day).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? '') || a.title.localeCompare(b.title));
  const dayEvents = eventsForDate(events, day);
  return <section className="planning-day-details stack" aria-label={t('planning.dayDetails', { date: dateLabel(day) })}><div className="planning-section-heading"><h3>{dateLabel(day)}</h3><div className="planning-day-actions">{onNew && <button className="secondary" onClick={() => onNew(day)}>{t('planning.planSession')}</button>}{onNewEvent && <button className="secondary" onClick={() => onNewEvent(day)}>{t('planning.addEvent')}</button>}</div></div>
    {readiness && <div className="planning-readiness-slot">{readiness}</div>}
    {sessions.length > 0 ? <ol className="planning-section-list">{sessions.map(workout => <li key={workout.id}><button className="planning-day-session training-type-surface" style={trainingTypeStyle(workout.trainingType)} onClick={() => onOpen(workout)}><span className="planning-session-heading"><strong>{workout.title || sportName(workout.sportId)}</strong><span>{workout.time || t('planning.timeNotSet')}</span></span><TrainingTypeBadge type={workout.trainingType}/><span>{t('planning.sportAndStatus', { sport: sportName(workout.sportId), status: workoutStatusLabel(workout) })}</span>{workout.plannedMinutes !== null && <small>{t('planning.planMinutes', { minutes: workout.plannedMinutes })}</small>}{workout.status === 'completed' && workout.durationMinutes !== null && <small>{t('planning.actualMinutes', { minutes: workout.durationMinutes })}</small>}</button>{onReschedule && workout.status === 'planned' && <Reschedule key={`${workout.id}:${workout.revision}`} workout={workout} onMove={onReschedule}/>}</li>)}</ol> : <p className="planning-empty">{t('planning.dayEmpty')}</p>}
    {dayEvents.length > 0 && <ul className="planning-day-events">{dayEvents.map(event => <li key={event.id}><EventCard event={event} onOpen={onOpenEvent}/></li>)}</ul>}
  </section>;
}
function Reschedule({ workout, onMove }: { workout: Workout; onMove: (workout: Workout, day: string) => void }) {
  const { t } = useI18n();
  const [date, setDate] = useState(workout.date);
  return <details><summary>{t('planning.moveSession')}</summary><div className="stack detail-content"><label className="field">{t('planning.newDate')}<input type="date" value={date} onChange={e => setDate(e.target.value)}/></label><button className="secondary" disabled={!date || date === workout.date} onClick={() => onMove(workout, date)}>{t('planning.moveTo', { date: dateLabel(date || workout.date) })}</button></div></details>;
}
