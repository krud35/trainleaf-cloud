import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { SPORTS, TRAINING_TYPES, type LocalSnapshot, type SportId, type TrainingType, type Workout } from '../data/domain';
import { isCompletedHistory } from '../data/analytics';
import { useLocalDay } from '../features/today/useLocalDay';
import { SessionList } from './SessionList';
import { useI18n } from '../i18n';

type Filters = { sport: SportId | ''; type: TrainingType | 'unknown' | ''; from: string; to: string; month: string };
const emptyFilters: Filters = { sport: '', type: '', from: '', to: '', month: '' };

export function HistoryView({ snapshot, onOpen, onSurvey }: { snapshot: LocalSnapshot; onOpen: (workout: Workout) => void; onSurvey: (workout: Workout) => void }) {
  const i18n = useI18n(), { t } = i18n;
  const monthLabel = i18n.month;
  const day = useLocalDay();
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [limit, setLimit] = useState(20);
  const months = [...new Set(snapshot.workouts.filter(workout => !workout.deletedAt).map(workout => workout.date.slice(0, 7)))].sort().reverse();
  function filter<K extends keyof Filters>(key: K, value: Filters[K]) { setFilters(current => ({ ...current, [key]: value })); setLimit(20); }
  const ordered = snapshot.workouts.filter(workout => !workout.deletedAt && (!filters.sport || workout.sportId === filters.sport) && (!filters.type || (filters.type === 'unknown' ? workout.trainingType === null : workout.trainingType === filters.type)) && (!filters.month || workout.date.startsWith(filters.month)) && (!filters.from || workout.date >= filters.from) && (!filters.to || workout.date <= filters.to)).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const completed = ordered.filter(workout => isCompletedHistory(workout, day));
  const overdue = ordered.filter(workout => workout.status === 'planned' && workout.date < day);
  const pending = ordered.filter(workout => workout.status === 'planned' && workout.date >= day);
  const unusual = ordered.filter(workout => workout.status === 'completed' && workout.date > day);
  const skipped = ordered.filter(workout => workout.status === 'skipped');
  const invalidRange = filters.from && filters.to && filters.from > filters.to;
  return <section className="stack history-view"><h1>{t('history.title')}</h1>
    <div className="history-filter-top"><label className="field">{t('history.month')}<select aria-label={t('history.month')} value={filters.month} onChange={event => filter('month', event.target.value)}><option value="">{t('history.allMonths')}</option>{months.map(month => <option key={month} value={month}>{monthLabel(month)}</option>)}</select></label></div>
    <details className="history-filters"><summary><SlidersHorizontal size={17} aria-hidden="true"/>{t('history.filter')}</summary><div className="history-filter-fields">
      <label className="field">{t('history.sport')}<select aria-label={t('history.sport')} value={filters.sport} onChange={event => filter('sport', event.target.value as SportId | '')}><option value="">{t('history.allSports')}</option>{SPORTS.map(sport => <option key={sport.id} value={sport.id}>{t(`sport.${sport.id}`)}</option>)}</select></label>
      <label className="field">{t('history.type')}<select aria-label={t('history.type')} value={filters.type} onChange={event => filter('type', event.target.value as Filters['type'])}><option value="">{t('history.allTypes')}</option>{TRAINING_TYPES.map(type => <option key={type.id} value={type.id}>{t(`trainingType.${type.id}`)}</option>)}<option value="unknown">{t('trainingType.unknown')}</option></select></label>
      <div className="form-row"><label className="field">{t('history.from')}<input type="date" value={filters.from} onChange={event => filter('from', event.target.value)}/></label><label className="field">{t('history.to')}<input type="date" value={filters.to} onChange={event => filter('to', event.target.value)}/></label></div>
      <button type="button" className="text-button" onClick={() => { setFilters(emptyFilters); setLimit(20); }}>{t('history.clear')}</button>
    </div></details>
    {invalidRange ? <p className="error" role="alert">{t('history.invalidRange')}</p> : <>
      <div className="section-heading"><h2>{t('history.completed')}</h2><span className="history-count">{completed.length}</span></div>
      {completed.length ? <SessionList workouts={completed.slice(0, limit)} onOpen={onOpen} onSurvey={onSurvey}/> : <p className="empty-state">{t('history.emptyCompleted')}</p>}
      {completed.length > limit && <button type="button" className="history-more" onClick={() => setLimit(current => current + 20)}>{t('history.showMore', { count: completed.length - limit })}</button>}
      {overdue.length > 0 && <details className="history-other"><summary>{t('history.overdue', { count: overdue.length })}</summary><SessionList workouts={overdue} onOpen={onOpen}/></details>}
      {pending.length > 0 && <details className="history-other"><summary>{t('history.pending', { count: pending.length })}</summary><SessionList workouts={pending} onOpen={onOpen}/></details>}
      {unusual.length > 0 && <details className="history-other"><summary>{t('history.unusual', { count: unusual.length })}</summary><p className="field-hint">{t('history.unusualHint')}</p><SessionList workouts={unusual} onOpen={onOpen}/></details>}
      {skipped.length > 0 && <details className="history-other"><summary>{t('history.skipped', { count: skipped.length })}</summary><SessionList workouts={skipped} onOpen={onOpen}/></details>}
    </>}
  </section>;
}
