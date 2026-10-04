import { useState, type ReactNode } from 'react';
import { eventsForDate, today } from '../../data/analytics';
import { dateLabel } from '../../ui/common';
import { DayDetails, type DayDetailsProps } from './DayDetails';
import { CalendarSession, CalendarEvent } from './CalendarTile';
import { monthDays, monthLabel, nextMonth } from './context';
import { LegendDialog } from './LegendDialog';
import { useI18n } from '../../i18n';

type Props = Omit<DayDetailsProps, 'readiness'> & { onDayChange: (day: string) => void; dayReadiness?: (day: string) => ReactNode };
export function MonthCalendar({ day, workouts, events = [], onDayChange, dayReadiness, ...callbacks }: Props) {
  const { t } = useI18n();
  const [legend, setLegend] = useState(false);
  const dates = monthDays(day);
  const ordered = workouts.slice().sort((a, b) => (a.time ?? '').localeCompare(b.time ?? '') || a.title.localeCompare(b.title));
  const monthEntries = dates.filter(date => date.slice(0, 7) === day.slice(0, 7) && (ordered.some(w => w.date === date) || eventsForDate(events, date).length));
  return <section className="stack planning-surface planning-month" aria-label={t('planning.month')}>
    <div className="planning-calendar-navigation"><button className="secondary" aria-label={t('planning.previousMonth')} onClick={() => onDayChange(nextMonth(day, -1))}>←</button><h2>{monthLabel(day)}</h2><button className="secondary" aria-label={t('planning.nextMonth')} onClick={() => onDayChange(nextMonth(day, 1))}>→</button><button className="planning-help" aria-label={t('calendar.legend')} onClick={() => setLegend(true)}>?</button></div>
    <div className="planning-calendar-scroll" role="region" aria-label={t('planning.monthCalendar')} tabIndex={0}><div className="planning-month-grid">
      {([0, 1, 2, 3, 4, 5, 6] as const).map(index => <span className="planning-month-weekday" key={index}>{t(`calendar.weekday_${index}`)}</span>)}
      {dates.map(date => { const sessions = ordered.filter(w => w.date === date), dayEvents = eventsForDate(events, date); return <div key={date} className={`planning-month-day ${date === day ? 'selected' : ''} ${date.slice(0, 7) !== day.slice(0, 7) ? 'outside-month' : ''}`}>
        <button className={`planning-month-day-select ${date === day ? 'selected' : ''}`} aria-pressed={date === day} aria-current={date === today() ? 'date' : undefined} aria-label={t('calendar.daySummary', { date: dateLabel(date), sessions: sessions.length, events: dayEvents.length })} onClick={() => onDayChange(date)}><span className="planning-month-date">{Number(date.slice(-2))}</span>{date === today() && <span className="sr-only">{t('calendar.today')}</span>}</button>
        <div className="week-mini-list">{sessions.map(workout => <CalendarSession key={workout.id} workout={workout} onOpen={entry => { onDayChange(date); callbacks.onOpen(entry); }}/>) }{dayEvents.map(event => <CalendarEvent key={event.id} event={event} onOpen={entry => { onDayChange(date); callbacks.onOpenEvent?.(entry); }}/>) }</div>
        {dayReadiness && <div className="planning-day-readiness">{dayReadiness(date)}</div>}
      </div>; })}
    </div></div>
    <details className="planning-calendar-list"><summary>{t('planning.monthList')}</summary><div className="stack detail-content">{monthEntries.length ? monthEntries.map(date => <DayDetails key={date} day={date} workouts={ordered} events={events} onOpen={callbacks.onOpen} onOpenEvent={callbacks.onOpenEvent}/>) : <p className="planning-empty">{t('planning.monthEmpty')}</p>}</div></details>
    <DayDetails day={day} workouts={ordered} events={events} readiness={dayReadiness?.(day)} {...callbacks}/>
    {legend && <LegendDialog onClose={() => setLegend(false)}/>}
  </section>;
}
