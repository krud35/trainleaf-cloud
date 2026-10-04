import { useState, type ReactNode } from 'react';
import type { LocalEvent, LocalSnapshot, Period, Workout, WorkoutInput, SportId, TrainingType } from '../data/domain';
import { SPORTS, TRAINING_TYPES } from '../data/domain';
import type { LocalRepository } from '../data/repository';
import { monday, periodsForDate } from '../data/analytics';
import { dateLabel } from './common';
import { WeekOverview } from './WeekOverview';
import { LeafCard } from './LeafCard';
import { initialPlanningContext, dayInWeek, nextMonth, type PlanningContext } from '../features/planning/context';
import { MonthCalendar } from '../features/planning/MonthCalendar';
import { SeasonOverview } from '../features/planning/SeasonOverview';
import { useI18n } from '../i18n';
import { PeriodEditor } from '../features/planning/PeriodEditor';
import { EventEditor } from '../features/planning/EventEditor';
import { EventView } from '../features/planning/EventView';
import { CopyWeek } from '../features/planning/CopyWeek';
import '../features/planning/planning.css';
export { initialPlanningContext, type PlanningContext } from '../features/planning/context';
export type PlanningViewProps = {
  repository: LocalRepository; snapshot: LocalSnapshot; onChanged: () => Promise<void>;
  onEdit?: (workout: Workout) => void; onOpen?: (workout: Workout) => void; onNew: (initial: Partial<WorkoutInput>) => void;
  context?: PlanningContext; onContextChange?: (context: PlanningContext) => void;
  onOpenEvent?: (event: LocalEvent) => void; eventId?: string | null; onEventClose?: () => void;
  dayReadiness?: (day: string) => ReactNode; weeklyAnatomy?: ReactNode;
  onReschedule?: (workout: Workout, newDate: string) => void;
};
export function PlanningView({ repository, snapshot, onChanged, onEdit, onOpen, onNew, context, onContextChange, onOpenEvent, eventId, onEventClose, dayReadiness, weeklyAnatomy, onReschedule }: PlanningViewProps) {
  const i18n = useI18n(), { t } = i18n;
  const [localContext, setLocalContext] = useState(initialPlanningContext);
  const selected = context ?? localContext;
  const update = (patch: Partial<PlanningContext>) => { const next = { ...selected, ...(patch.day ? { seasonYear: Number(patch.day.slice(0, 4)) } : {}), ...patch }; setLocalContext(next); onContextChange?.(next); };
  const [editingPeriod, setEditingPeriod] = useState<Period | null | undefined>(undefined);
  const [editingEvent, setEditingEvent] = useState<LocalEvent | null | undefined>(undefined);
  const [eventDetail, setEventDetail] = useState<LocalEvent | null>(null);
  const [newEventDay, setNewEventDay] = useState(selected.day);
  const visibleEvent = (eventId ? snapshot.events.find(event => event.id === eventId) : null) ?? eventDetail;
  const week = monday(selected.day);
  const periods = snapshot.periods.slice().sort((a, b) => a.start.localeCompare(b.start) || b.end.localeCompare(a.end));
  const workouts = snapshot.workouts.filter(w => (!selected.sportId || w.sportId === selected.sportId) && (!selected.trainingType || w.trainingType === selected.trainingType) && (!selected.periodId || periodsForDate(snapshot.periods, w.date).some(p => p.id === selected.periodId)));
  const period = periods.find(p => p.id === selected.periodId);
  const openSession = (workout: Workout) => (onOpen ?? onEdit)?.(workout);
  const openEvent = (event: LocalEvent) => { if (onOpenEvent) onOpenEvent(event); else setEventDetail(event); };
  const newEvent = (day: string) => { setNewEventDay(day); setEditingEvent(null); };
  const newSession = (date: string) => onNew({ status: 'planned', wasPlanned: true, date, ...(selected.sportId ? { sportId: selected.sportId } : {}), ...(selected.trainingType ? { trainingType: selected.trainingType } : {}) });
  const changed = async () => { await onChanged(); setEditingPeriod(undefined); setEditingEvent(undefined); setEventDetail(null); if (eventId) onEventClose?.(); };
  if (editingPeriod !== undefined) return <PeriodEditor key={editingPeriod?.id ?? 'new'} repository={repository} snapshot={snapshot} period={editingPeriod} onClose={() => setEditingPeriod(undefined)} onSaved={changed}/>;
  if (editingEvent !== undefined) return <EventEditor key={editingEvent?.id ?? 'new'} repository={repository} snapshot={snapshot} event={editingEvent} day={newEventDay} onClose={() => setEditingEvent(undefined)} onSaved={changed}/>;
  if (visibleEvent) return <EventView event={visibleEvent} onClose={() => { setEventDetail(null); onEventClose?.(); }} onEdit={() => setEditingEvent(visibleEvent)}/>;
  const callbacks = { workouts, events: snapshot.events, onOpen: openSession, onOpenEvent: openEvent, dayReadiness, onReschedule };
  const currentPeriods = periodsForDate(periods, selected.day);
  const season = currentPeriods.find(p => p.level === 'macro' || !p.parentId);
  return <div className="stack planning-page">
    <div className="page-heading planning-heading"><div><p className="eyebrow">{t('planning.eyebrow')}</p><h1>{t('planning.title')}</h1></div><svg className="planning-heading-leaf" width="55" height="58" viewBox="0 0 55 58" fill="none" aria-hidden="true"><path d="M8 52C-1 26 12 4 46 2c4 31-10 48-38 50Z" fill="#DCE8CC"/><path d="m9 51 30-33M22 37l-4-14m12 6 12-1" stroke="#78945B" strokeWidth="1.3"/></svg></div>
    <div className="planning-view-switch" role="group" aria-label={t('planning.viewSwitch')}>{(['week', 'month', 'season'] as const).map(view => <button key={view} className="secondary" aria-pressed={selected.view === view} onClick={() => update({ view })}>{t({ week: 'planning.viewWeek', month: 'planning.viewMonth', season: 'planning.viewSeason' }[view] as 'planning.viewWeek')}</button>)}</div>
    {selected.view !== 'season' && <nav className="planning-breadcrumb" aria-label={t('planning.level')}><button className="text-button" onClick={() => update({ view: 'season', seasonYear: Number(selected.day.slice(0, 4)) })}>{season?.name ?? t('planning.seasonYear', { year: String(selected.seasonYear) })}</button><span aria-hidden="true">›</span><button className="text-button" onClick={() => update({ view: 'week' })}>{selected.view === 'month' ? t('planning.viewWeek') : i18n.date(week, 'dayMonth')}</button></nav>}
    <section className="stack planning-surface">
      {selected.view === 'week' && <WeekOverview {...callbacks} week={week} selectedDay={selected.day} onDayChange={day => update({ day })} onWeekChange={next => update({ day: dayInWeek(next, selected.day) })}/>}
      {selected.view === 'month' && <MonthCalendar {...callbacks} day={selected.day} onDayChange={day => update({ day })}/>}
      {selected.view === 'season' && <SeasonOverview year={selected.seasonYear} workouts={workouts} events={snapshot.events} periods={periods} selectedPeriodId={selected.periodId} onYearChange={seasonYear => update({ seasonYear, day: nextMonth(selected.day, (seasonYear - Number(selected.day.slice(0, 4))) * 12), periodId: period && period.start <= `${seasonYear}-12-31` && period.end >= `${seasonYear}-01-01` ? period.id : '' })} onMonth={day => update({ day, view: 'month' })} onWeek={day => update({ day, view: 'week' })} onSeason={p => update({ periodId: p.id, day: selected.day >= p.start && selected.day <= p.end ? selected.day : p.start })} onPeriod={p => update({ periodId: p.id, day: p.start, view: 'week' })} onEditPeriod={p => setEditingPeriod(p)} onOpenEvent={openEvent}/>}
    </section>
    <div className="planning-create"><button className="primary" onClick={() => newSession(selected.day)}>{t('planning.addWorkout')}</button><button className="secondary" onClick={() => newEvent(selected.day)}>{t('planning.addEvent')}</button><button className="secondary" onClick={() => setEditingPeriod(null)}>{t('planning.addPeriod')}</button></div>
    <details className="planning-filters"><summary>{t(selected.sportId || selected.trainingType || selected.periodId ? 'planning.filtersActive' : 'planning.filters')}</summary><div className="stack detail-content"><label className="field">{t('planning.goToDate')}<input type="date" value={selected.day} onChange={e => { if (e.target.value) update({ day: e.target.value }); }}/></label><div className="form-row"><label className="field">{t('planning.sport')}<select value={selected.sportId} onChange={e => update({ sportId: e.target.value as SportId | '' })}><option value="">{t('planning.allSports')}</option>{SPORTS.map(s => <option key={s.id} value={s.id}>{t(`sport.${s.id}`)}</option>)}</select></label><label className="field">{t('planning.trainingType')}<select value={selected.trainingType} onChange={e => update({ trainingType: e.target.value as TrainingType | '' })}><option value="">{t('planning.allTypes')}</option>{TRAINING_TYPES.map(type => <option key={type.id} value={type.id}>{i18n.t(`trainingType.${type.id}`)}</option>)}</select></label></div><label className="field">{t('planning.period')}<select value={selected.periodId} onChange={e => update({ periodId: e.target.value })}><option value="">{t('planning.allPeriods')}</option>{periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><button className="text-button" onClick={() => update({ sportId: '', trainingType: '', periodId: '' })}>{t('planning.clearFilters')}</button><p className="field-hint">{t('planning.filtersHint')}</p></div></details>
    {period && <div className="planning-period-strip"><strong>{period.name}</strong><span>{dateLabel(period.start)} – {dateLabel(period.end)}</span><button className="text-button" onClick={() => update({ day: period.start, view: 'month' })}>{t('planning.seeInCalendar')}</button><button className="text-button" onClick={() => update({ periodId: '' })}>{t('planning.allPeriods')}</button></div>}
    {selected.view === 'week' && <CopyWeek key={week} week={week} snapshot={snapshot} repository={repository} onChanged={onChanged}/>}
    {selected.view === 'week' && <section className="stack planning-projection" aria-label={t('planning.muscleMap')}>{weeklyAnatomy ?? <><h2>{t('planning.strengthVolume')}</h2><p className="planning-empty">{t('planning.noData')}</p></>}</section>}
    <section className="stack planning-periods" aria-label={t('planning.periods')}><div className="section-heading"><h2 id="periods-heading">{t('planning.periods')}</h2></div>
      <details><summary>{periods.length ? t('planning.periodsOverview', { count: periods.length }) : t('planning.firstPeriod')}</summary><div className="stack detail-content">{!periods.length && <p className="empty-state">{t('planning.periodsEmpty')}</p>}{periods.map(p => <LeafCard variant="period" key={p.id}><p className="eyebrow">{p.level ? t(`planning.level_${p.level}`) : t('planning.trainingPeriod')}</p><h3>{p.name}</h3><p>{dateLabel(p.start)} – {dateLabel(p.end)}</p>{p.goal && <p>{t('planning.goal', { goal: p.goal })}</p>}{p.description && <p className="preserve-lines">{p.description}</p>}{p.parentId && <small>{t('planning.partOf', { name: periods.find(parent => parent.id === p.parentId)?.name ?? t('planning.parentPeriod') })}</small>}<div className="actions"><button className="secondary" onClick={() => setEditingPeriod(p)}>{t('planning.editPeriod')}</button><button className="secondary" onClick={() => update({ periodId: p.id, view: 'season', seasonYear: Number(p.start.slice(0, 4)) })}>{t('planning.choosePeriod')}</button><button className="secondary" onClick={() => newSession(p.start)}>{t('planning.addWorkoutInPeriod')}</button></div></LeafCard>)}</div></details>
    </section>
  </div>;
}
