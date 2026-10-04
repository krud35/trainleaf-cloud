import { useState, type ReactNode } from 'react';
import type { LocalEvent, Workout } from '../data/domain';
import { addDays, eventsForDate, monday, today } from '../data/analytics';
import { dateLabel } from './common';
import { DayDetails } from '../features/planning/DayDetails';
import { LegendDialog } from '../features/planning/LegendDialog';
import { CalendarSession, CalendarEvent, calendarRange } from '../features/planning/CalendarTile';
import './WeekOverview.css';
import { useI18n } from '../i18n';
import '../features/planning/planning.css';
export { workoutStatusLabel } from '../features/planning/sessionStatus';
export type WeekOverviewProps = {
  week: string; workouts: Workout[]; onWeekChange: (week: string) => void; onOpen: (workout: Workout) => void; onNew?: (day: string) => void;
  variant?: 'today' | 'planning'; selectedDay?: string; onDayChange?: (day: string) => void;
  events?: LocalEvent[]; onOpenEvent?: (event: LocalEvent) => void; onNewEvent?: (day: string) => void;
  dayReadiness?: (day: string) => ReactNode; onReschedule?: (workout: Workout, day: string) => void;
};
const dayNames = [0, 1, 2, 3, 4, 5, 6] as const;
export function WeekOverview({ week, workouts, onWeekChange, onOpen, onNew, variant = 'planning', selectedDay, onDayChange, events = [], onOpenEvent, onNewEvent, dayReadiness, onReschedule }: WeekOverviewProps) {
  const { t } = useI18n();
  const start = monday(week), end = addDays(start, 6);
  const [chosenDay, setDay] = useState(() => today() >= start && today() <= end ? today() : start);
  const [legend, setLegend] = useState(false);
  const requestedDay = selectedDay ?? chosenDay;
  const day = requestedDay >= start && requestedDay <= end ? requestedDay : start;
  const ordered = workouts.filter(w => w.date >= start && w.date <= end).slice().sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? '') || a.title.localeCompare(b.title));
  const choose = (date: string) => { setDay(date); onDayChange?.(date); };
  const showDetails = variant === 'planning';
  return <section className={`week-overview stack week-overview-${variant}`} aria-label={t('planning.week')}>
    <div className="week-navigation"><button type="button" className="secondary" onClick={() => onWeekChange(addDays(start, -7))} aria-label={t('planning.previousWeek')}>←</button><h2>{calendarRange(start, end)}</h2><button type="button" className="secondary" onClick={() => onWeekChange(addDays(start, 7))} aria-label={t('planning.nextWeek')}>→</button><button type="button" className="planning-help" aria-label={t('calendar.legend')} onClick={() => setLegend(true)}>?</button></div>
    <div className="planning-calendar-scroll" role="region" aria-label={t('planning.weekCalendar')} tabIndex={0}><div className="week-grid">{dayNames.map((name, index) => {
      const date = addDays(start, index), sessions = ordered.filter(w => w.date === date), dayEvents = eventsForDate(events, date);
      return <div className={`week-day ${day === date ? 'selected' : ''}`} key={date}><button type="button" className={`week-day-select ${day === date ? 'selected' : ''}`} aria-pressed={day === date} aria-label={t('calendar.daySummary', { date: dateLabel(date), sessions: sessions.length, events: dayEvents.length })} onClick={() => choose(date)}><span>{t(`calendar.weekday_${name}`)}</span><strong>{Number(date.slice(-2))}</strong>{date === today() && <i aria-hidden="true"/>}{date === today() && <span className="sr-only">{t('calendar.today')}</span>}</button><div className="week-mini-list">{sessions.map(w => <CalendarSession key={w.id} workout={w} onOpen={workout => { choose(date); onOpen(workout); }}/>) }{dayEvents.map(event => <CalendarEvent key={event.id} event={event} onOpen={entry => { choose(date); onOpenEvent?.(entry); }}/>) }{!sessions.length && !dayEvents.length && <span className="calendar-empty" aria-hidden="true">·</span>}</div>{dayReadiness && <div className="planning-day-readiness">{dayReadiness(date)}</div>}</div>;
    })}</div></div>
    <details className="planning-calendar-list"><summary>{t('planning.weekList')}</summary><div className="stack detail-content">{dayNames.map((_, index) => { const date = addDays(start, index); return <DayDetails key={date} day={date} workouts={ordered} events={events} onOpen={onOpen} onOpenEvent={onOpenEvent}/>; })}</div></details>
    {showDetails && <DayDetails day={day} workouts={ordered} events={events} onOpen={onOpen} onNew={onNew} onOpenEvent={onOpenEvent} onNewEvent={onNewEvent} readiness={dayReadiness?.(day)} onReschedule={onReschedule}/>}
    {legend && <LegendDialog onClose={() => setLegend(false)}/>}
  </section>;
}

