import { useEffect, useRef, type ReactNode } from 'react';
import type { Dose, Item, Period, Workout } from '../../data/domain';
import { dateLabel, sportName } from '../../ui/common';
import { Help } from '../../ui/TrainingFields';
import { TrainingTypeIcon, trainingTypePresentation, trainingTypeStyle } from '../shared/TrainingTypeBadge';
import { workoutStatusLabel } from '../planning/sessionStatus';
import { sections } from '../../../../lib/domain';
import { useI18n } from '../../i18n';
import { doseSummary } from '../../i18n/labels';
import { exerciseText } from '../../i18n/factory';
import '../../ui/wellness.css';

export type WorkoutEntryDetailProps = { workout: Workout; onEdit: () => void; onClose: () => void; periods?: readonly Pick<Period, 'id' | 'name' | 'level'>[]; actions?: ReactNode };
/** Read-only; period membership is supplied by the navigation owner. */
export function WorkoutEntryDetail({ workout: w, periods, onEdit, onClose, actions }: WorkoutEntryDetailProps) {
  const i18n = useI18n(), { t, language } = i18n;
  const doseText = (dose: Dose | null, item: Item) => doseSummary(i18n, dose, item.exercise.metric);
  const type = trainingTypePresentation(w.trainingType);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, [w.id]);
  return <section className="ed-detail ed-workout" aria-label={t('entry.workoutDetails')}><button type="button" className="back" onClick={onClose}>{t('entry.back')}</button><header className="ed-session" style={trainingTypeStyle(w.trainingType)}><p className="ed-session-type"><TrainingTypeIcon type={w.trainingType}/><span>{t('entry.typeAndSport', { type: type.name, sport: sportName(w.sportId) })}</span></p><h1 tabIndex={-1} ref={heading}>{w.title || t('entry.untitled')}</h1><p>{dateLabel(w.date)}{w.time ? ` · ${w.time}` : ''} · {workoutStatusLabel(w)}</p></header>
    <dl className="ed-facts ed-session-facts"><div><dt>{t('entry.plannedTime')}</dt><dd>{w.plannedMinutes === null ? t('entry.noMeasurement') : t('entry.minutes', { minutes: w.plannedMinutes })}</dd></div><div><dt>{t('entry.actualTime')}</dt><dd>{w.status !== 'completed' || w.durationMinutes === null ? t('entry.noMeasurement') : t('entry.minutes', { minutes: w.durationMinutes })}</dd></div></dl>
    <div className="ed-actions"><button type="button" className="primary" onClick={onEdit}>{t('entry.editWorkout')}</button>{actions}</div>
    {w.planNotes && <section className="ed-notebook"><h2>{t('entry.planDescription')}</h2><p className="ed-notes">{w.planNotes}</p></section>}{w.notes && <section className="ed-notebook"><h2>{t('entry.sessionNote')}</h2><p className="ed-notes">{w.notes}</p></section>}
    {(w.plannedFatigue.aerobicFatigue !== null || w.plannedFatigue.muscularFatigue !== null) && <details className="ed-expectations"><summary>{t('entry.planAssumptions')}</summary><dl className="ed-facts"><div><dt>{t('entry.plannedAerobic')}</dt><dd>{w.plannedFatigue.aerobicFatigue === null ? t('entry.noAssumption') : t('entry.outOfTen', { value: w.plannedFatigue.aerobicFatigue })}</dd></div><div><dt>{t('entry.plannedMuscular')}</dt><dd>{w.plannedFatigue.muscularFatigue === null ? t('entry.noAssumption') : t('entry.outOfTen', { value: w.plannedFatigue.muscularFatigue })}</dd></div></dl></details>}
    <section className="ed-exercise-list"><h2>{t('entry.sessionFlow')}</h2>
    {(Object.keys(sections) as (keyof typeof sections)[]).filter(section => w.sections[section].length > 0).map(section => <section key={section} className="ed-section"><h3>{t(`section.${section}`)}</h3>{!w.sections[section].length ? <p>{t('entry.noExercises')}</p> : <ol className="ed-exercises">{w.sections[section].map(item => { const group = w.supersets.find(g => g.id === item.supersetId); return <li key={item.id}><h3>{exerciseText(item.exercise, 'name', language)}</h3>{group && <p className="ed-group">{t('entry.superset', { number: w.supersets.indexOf(group) + 1, transition: group.transitionRest || '—', round: group.roundRest || '—' })}</p>}<p><strong>{t('entry.plan')}</strong> {doseText(item.planned, item)}</p><p><strong>{t('entry.actual')}</strong> {w.status === 'completed' ? doseText(item.actual, item) : t('dose.noActual')}</p>{item.athleteNotes && <p className="ed-notes">{item.athleteNotes}</p>}<details><summary>{t('entry.exerciseDescription')}</summary><p className="ed-notes">{exerciseText(item.exercise, 'notes', language) || t('entry.noDescription')}</p>{item.exercise.cues && <p className="ed-notes">{exerciseText(item.exercise, 'cues', language)}</p>}</details></li>; })}</ol>}</section>)}
    {!Object.values(w.sections).some(items => items.length) && <p>{t('entry.savedWithoutExercises')}</p>}</section>
    {w.status === 'completed' && <section className="ed-after"><h2>{t('entry.afterWorkout')}</h2><dl className="ed-facts">{([[t('entry.aerobicFatigue'), w.postWorkout.aerobicFatigue], [t('entry.muscularFatigue'), w.postWorkout.muscularFatigue], [t('entry.satisfaction'), w.postWorkout.satisfaction], [t('entry.sessionRpe'), w.rpe]] as const).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value === null ? t('entry.noAnswer') : t('entry.outOfTen', { value })}</dd></div>)}</dl>{w.postWorkout.notes && <p className="ed-notes">{w.postWorkout.notes}</p>}</section>}
    <details className="ed-analysis"><summary>{t('entry.savedLoad')}</summary><dl className="ed-facts"><div><dt>{t('entry.loadPlan')}</dt><dd>{w.plannedLoadCalculation ? i18n.n(w.plannedLoadCalculation.value) : t('entry.noMeasurement')}</dd></div><div><dt>{t('entry.loadActual')}</dt><dd>{w.loadCalculation ? i18n.n(w.loadCalculation.value) : t('entry.noMeasurement')}</dd></div></dl><Help label={t('entry.loadHelpLabel')}>{t('entry.loadHelp')}</Help></details>
    <section className="ed-period-context"><h2>{t('entry.widerPlan')}</h2><p>{periods === undefined ? t('entry.noPeriodData') : periods.length ? periods.map(p => p.name).join(' → ') : t('entry.outsidePeriods')}</p></section>
  </section>;
}
