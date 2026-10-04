import { useState } from 'react';
import { ArrowRight, CalendarDays, Check, ChevronRight, History, Plus, Target } from 'lucide-react';
import { type Draft, type GoalMetric, type LocalEvent, type LocalSnapshot, type Workout, type WorkoutInput } from '../data/domain';
import { eventsForDate, goalProgress, monday, periodsForDate } from '../data/analytics';
import { LeafCard } from './LeafCard';
import { WeekOverview } from './WeekOverview';
import { SessionList } from './SessionList';
import { dateLabel } from './common';
import { TodayEvents } from '../features/today/TodayEvents';
import { useLocalMoment } from '../features/today/useLocalDay';
import { useI18n } from '../i18n';
import '../features/today/today.css';

export { useLocalDay } from '../features/today/useLocalDay';
const goalDigits = (metric: GoalMetric) => metric === 'sleepAverageHours' ? 1 : 0;

type TodayProps = {
  snapshot: LocalSnapshot;
  onNew: (input?: Partial<WorkoutInput>) => void;
  onEdit: (workout: Workout) => void;
  onSurvey: (workout: Workout) => void;
  onWellness: () => void;
  onHistory: () => void;
  onProgress: () => void;
  onPlan: () => void;
  onDraft: (draft: Draft) => void;
  onOpenEvent?: (event: LocalEvent) => void;
};
export function TodayView({ snapshot, onNew, onEdit, onSurvey, onWellness, onHistory, onProgress, onPlan, onDraft, onOpenEvent }: TodayProps) {
  const i18n = useI18n(), { t } = i18n;
  const goalNumber = (value: number, metric: GoalMetric) => i18n.n(value, goalDigits(metric));
  const { day, slot, checkinDay } = useLocalMoment();
  const [chosenWeek, setChosenWeek] = useState<{ day: string; week: string } | null>(null);
  const [expandedWeek, setExpandedWeek] = useState(false);
  const week = chosenWeek?.day === day ? chosenWeek.week : monday(day);
  const sessions = snapshot.workouts.filter(workout => !workout.deletedAt && workout.date === day).sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'));
  const checked = snapshot.wellness.some(entry => entry.date === checkinDay && entry.slot === slot);
  const periods = periodsForDate(snapshot.periods, day);
  const goals = snapshot.goals.filter(goal => goal.cadence === 'weekly' || goal.start! <= day && goal.end! >= day);
  const events = eventsForDate(snapshot.events, day);
  const date = new Date(`${day}T12:00:00`);
  const headingDate = i18n.date(day, 'heading');
  return <section className="stack today-view">
    <div className="page-heading journal-heading"><div><h1>{t('today.title')}</h1><p>{headingDate}</p></div><div className="month-stamp" aria-hidden="true"><strong>{day.slice(-2)}</strong><span>{i18n.date(day, 'monthShort').replace('.', '')}</span><span>{date.getFullYear()}</span></div></div>
    {checked ? <button type="button" className="checkin-done" onClick={onWellness}><span className="checkin-check" aria-hidden="true"><Check size={16}/></span><span>{t('today.checkinDone')}<small>{t('today.checkinDoneHint', { slot: t(`wellnessSlot.${slot}`) })}</small></span><ChevronRight size={16} aria-hidden="true"/></button> : <LeafCard variant="checkin" onClick={onWellness} ariaLabel={t('today.saveWellbeing')}><p className="eyebrow">{t('today.checkinEyebrow')}</p><small>{t('today.checkinOptional', { slot: t(`wellnessSlot.${slot}`) })}</small><h2>{t('today.checkinQuestion')}</h2><p>{t('today.checkinLine1')}<br/>{t('today.checkinLine2')}</p><span className="leaf-action checkin-action">{t('today.doCheckin')} <ArrowRight size={18} aria-hidden="true"/></span></LeafCard>}
    <div className="section-heading"><h2>{t('today.sessionsToday')}</h2><button type="button" className="text-button" aria-expanded={expandedWeek} aria-controls="today-sessions" onClick={() => setExpandedWeek(value => !value)}>{t(expandedWeek ? 'today.onlyToday' : 'today.wholeWeek')}</button></div>
    <div id="today-sessions">{expandedWeek ? <WeekOverview variant="today" week={week} workouts={snapshot.workouts} events={snapshot.events} onOpenEvent={onOpenEvent} onWeekChange={week => setChosenWeek({ day, week })} onOpen={onEdit} onNew={date => onNew({ date, status: 'planned', wasPlanned: true })}/> : <>{sessions.length ? <SessionList workouts={sessions} onOpen={onEdit} onSurvey={onSurvey} showDate compactDate showLoad={false}/> : <div className="empty-state"><h3>{t('today.emptyTitle')}</h3><p>{t('today.emptyText')}</p></div>}<TodayEvents events={events} onOpen={onOpenEvent}/></>}</div>
    <button type="button" className="secondary today-add" onClick={() => onNew({ date: day })}><Plus size={20} aria-hidden="true"/>{t('today.recordWorkout')}</button>
    {snapshot.drafts.length > 0 && <details className="card"><summary>{t('today.drafts', { count: snapshot.drafts.length })}</summary><div className="stack detail-content">{snapshot.drafts.map(draft => { const form = draft.raw.form; const name = form && typeof form === 'object' && !Array.isArray(form) && typeof form.title === 'string' ? form.title : ''; return <button key={draft.id} className="secondary" onClick={() => onDraft(draft)}>{name ? t('today.resumeDraftNamed', { name }) : t('today.resumeDraft')}</button>; })}</div></details>}
    {(goals.length > 0 || periods.length > 0) && <div className="today-leaves">{goals.map(goal => {
      const progress = goalProgress(goal, snapshot.workouts, day, snapshot.wellness);
      const wellnessGoal = goal.metric === 'checkinDays' || goal.metric === 'sleepAverageHours';
      return <LeafCard key={goal.id} variant="goal" onClick={onProgress}><span className="today-context-top"><Target size={23} aria-hidden="true"/><span className="eyebrow">{t('today.myGoal')}</span><ArrowRight size={16} aria-hidden="true"/></span><h2>{goal.name}</h2><strong className="leaf-number">{progress.actual === null || goal.metric === 'minutes' && !progress.hasData ? '—' : goalNumber(progress.actual, goal.metric)} / {goalNumber(goal.target, goal.metric)}</strong><p>{t(`today.unit_${goal.metric}`, { count: goal.target })}</p>{wellnessGoal && <small className="goal-data-note">{progress.hasData ? t('today.goalCoverage', { observed: progress.observedDays, expected: progress.expectedDays }) : t('today.goalNoData')}</small>}<span className="leaf-action">{t('today.seeProgress')}</span></LeafCard>;
    })}{periods.map(period => <LeafCard key={period.id} variant="period" onClick={onPlan}><span className="today-context-top"><CalendarDays size={23} aria-hidden="true"/><span className="eyebrow">{t('today.currentPeriod')}</span><ArrowRight size={16} aria-hidden="true"/></span><h2>{period.name}</h2>{period.goal && <p>{period.goal}</p>}<span>{dateLabel(period.start)} – {dateLabel(period.end)}</span><span className="leaf-action">{t('today.seePlan')}</span></LeafCard>)}</div>}
    <button type="button" className="text-button today-history" onClick={onHistory}><History size={17} aria-hidden="true"/>{t('today.history')}<ArrowRight size={17} aria-hidden="true"/></button>
  </section>;
}

