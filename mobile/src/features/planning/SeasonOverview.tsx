import type { CSSProperties } from 'react';
import type { LocalEvent, Period, Workout } from '../../data/domain';
import { addDays, eventsInRange, monday, today } from '../../data/analytics';
import { dateLabel } from '../../ui/common';
import { monthLabel, nextMonth } from './context';
import { EventCard } from './EventView';
import { useI18n } from '../../i18n';
export function SeasonOverview({ year, periods, workouts, events, selectedPeriodId, onYearChange, onMonth, onPeriod, onOpenEvent, onWeek, onSeason, onEditPeriod }: { year: number; periods: Period[]; workouts: Workout[]; events: LocalEvent[]; selectedPeriodId: string; onYearChange: (year: number) => void; onMonth: (day: string) => void; onPeriod: (period: Period) => void; onOpenEvent: (event: LocalEvent) => void; onWeek?: (day: string) => void; onSeason?: (period: Period) => void; onEditPeriod?: (period: Period) => void }) {
  const i18n = useI18n(), { t } = i18n;
  const start = `${year}-01-01`, end = `${year}-12-31`;
  const seasonPeriods = periods.filter(p => p.start <= end && p.end >= start), seasonEvents = eventsInRange(events, start, end);
  const roots = seasonPeriods.filter(p => !p.parentId || !periods.some(parent => parent.id === p.parentId));
  let selected = seasonPeriods.find(p => p.id === selectedPeriodId);
  const visited = new Set<string>();
  while (selected?.parentId && !visited.has(selected.id)) { visited.add(selected.id); const parent = seasonPeriods.find(p => p.id === selected!.parentId); if (!parent) break; selected = parent; }
  const root = selected ?? roots.find(p => p.start <= today() && p.end >= today()) ?? roots[0];
  const rangeStart = root?.start ?? start, rangeEnd = root?.end ?? end;
  const rangePeriods = seasonPeriods.filter(p => p.start <= rangeEnd && p.end >= rangeStart);
  const rangeEvents = eventsInRange(seasonEvents, rangeStart, rangeEnd);
  const time = (day: string) => Date.parse(`${day}T12:00:00Z`);
  const length = Math.max(86400000, time(rangeEnd) - time(rangeStart) + 86400000);
  const barStyle = (first: string, last: string): CSSProperties => {
    const left = Math.max(0, (time(first) - time(rangeStart)) / length * 100);
    const right = Math.min(100, (time(last) - time(rangeStart) + 86400000) / length * 100);
    return { '--period-left': `${left}%`, '--period-width': `${Math.max(0, right - left)}%` } as CSSProperties;
  };
  const months: string[] = [];
  for (let date = `${rangeStart.slice(0, 7)}-01`; date <= rangeEnd; date = nextMonth(date, 1)) months.push(date);
  const weeks: string[] = [];
  for (let date = monday(rangeStart); date <= rangeEnd; date = addDays(date, 7)) weeks.push(date);
  return <section className="stack planning-surface planning-season" aria-label={t('planning.season')}>
    <div className="planning-season-year"><button className="text-button" aria-label={t('planning.previousYear')} onClick={() => onYearChange(year - 1)}><span aria-hidden="true">←</span></button><h2 aria-live="polite">{year}</h2><button className="text-button" aria-label={t('planning.nextYear')} onClick={() => onYearChange(year + 1)}><span aria-hidden="true">→</span></button></div>
    {roots.length > 0 && <div className="planning-season-choices" role="region" aria-label={t('planning.chooseSeason')} tabIndex={0}>{roots.map(period => <button className="secondary" key={period.id} aria-pressed={period.id === root?.id} onClick={() => (onSeason ?? onPeriod)(period)}>{period.name}</button>)}</div>}
    {root && <div className="planning-season-title"><div><h3>{root.name}</h3><p>{dateLabel(rangeStart)} – {dateLabel(rangeEnd)}</p></div>{onEditPeriod && <button className="text-button" onClick={() => onEditPeriod(root)}>{t('planning.edit')}</button>}</div>}
    <div className="planning-timeline" role="region" aria-label={t('planning.timeline')} tabIndex={0}><div className="planning-timeline-canvas" style={{ '--timeline-columns': months.length } as CSSProperties}>
      <div className="planning-timeline-months">{months.map(day => <button key={day} onClick={() => onMonth(day)} aria-label={t('planning.openMonth', { month: monthLabel(day) })}>{i18n.date(day, 'monthShort')}</button>)}</div>
      {rangePeriods.map(period => <div className={`planning-timeline-row ${period.id === root?.id ? 'is-season' : ''}`} key={period.id}><button className="planning-timeline-bar" style={barStyle(period.start, period.end)} onClick={() => onPeriod(period)} aria-label={t('planning.periodBar', { name: period.name, start: dateLabel(period.start), end: dateLabel(period.end) })}><span>{period.name}</span><small>{dateLabel(period.start)} – {dateLabel(period.end)}</small></button></div>)}
      {rangeEvents.map(event => <div className="planning-timeline-row is-event" key={event.id}><button className={`planning-timeline-bar planning-timeline-event ${event.start !== event.end ? 'calendar-event-multi' : ''}`} style={barStyle(event.start, event.end)} onClick={() => onOpenEvent(event)} aria-label={t('planning.eventBar', { title: event.title, start: dateLabel(event.start), end: dateLabel(event.end) })}><span>◇ {event.title}</span></button></div>)}
      {!rangePeriods.length && !rangeEvents.length && <p className="planning-empty">{t('planning.seasonEmpty')}</p>}
    </div></div>
    <div className="planning-season-weeks" role="region" aria-label={t('planning.seasonWeeks')} tabIndex={0}>{weeks.map(day => <button className="secondary" key={day} onClick={() => (onWeek ?? onMonth)(day)}><strong>{i18n.date(day, 'dayMonth')}</strong><span>{t('planning.sessionCount', { count: workouts.filter(w => w.date >= day && w.date <= addDays(day, 6)).length })}</span></button>)}</div>
    <details className="planning-calendar-list"><summary>{t('planning.periodsAndEvents')}</summary><div className="stack detail-content">{rangePeriods.length ? <ul className="planning-season-periods">{rangePeriods.map(p => <li key={p.id}><button aria-pressed={p.id === selectedPeriodId} onClick={() => onPeriod(p)}><small>{p.level ? t(`planning.level_${p.level}`) : t('planning.trainingPeriod')}</small><strong>{p.name}</strong><span>{dateLabel(p.start)} – {dateLabel(p.end)}</span>{p.goal && <small>{p.goal}</small>}</button></li>)}</ul> : <p className="planning-empty">{t('planning.noPeriodsInSeason')}</p>}{rangeEvents.length ? <ul className="planning-day-events">{rangeEvents.map(event => <li key={event.id}><EventCard event={event} onOpen={onOpenEvent}/></li>)}</ul> : <p className="planning-empty">{t('planning.noEventsInSeason')}</p>}</div></details>
    <details className="planning-calendar-list"><summary>{t('planning.monthsOfYear', { year: String(year) })}</summary><div className="planning-season-months">{Array.from({ length: 12 }, (_, index) => { const day = `${year}-${String(index + 1).padStart(2, '0')}-01`; return <button className="planning-season-month" key={day} onClick={() => onMonth(day)} aria-label={t('planning.openMonth', { month: monthLabel(day) })}><strong>{monthLabel(day)}</strong><span>{t('planning.sessionCount', { count: workouts.filter(w => w.date >= day && w.date < nextMonth(day, 1)).length })}</span></button>; })}</div></details>
  </section>;
}
