import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { z } from 'zod';
import { SPORTS, exerciseSchema, supersetSchema, postWorkoutSchema, muscleRolesSchema, type MuscleRoleAssignment, type Draft, type Dose, type Exercise, type LocalSnapshot, type PostWorkout, type Section, type Superset, type TrainingType, type Workout, type WorkoutInput } from '../data/domain';
import { muscleRolesForExercise, periodsForDate } from '../data/analytics';
import { normalizeSupersets } from '../data/supersets';
import { DoseFields, Help, TrainingTypeField, type RawDose } from './TrainingFields';
import { itemLabel, reorderPlanItem, SupersetControls } from './SupersetControls';
import type { LocalRepository } from '../data/repository';
import { getBuiltinExercises } from '../data/catalog';
import './workout-editor.css';
import { PlannedFatigueFields, type RawPlannedFatigue } from '../features/workout-planning/PlannedFatigueFields';
import { MuscleRolesEditor } from '../features/workout-planning/MuscleRolesEditor';
import { currentTranslator, useI18n, type Translator } from '../i18n';
import { errorText } from '../i18n/labels';
import { parseDecimal, searchKey } from '../i18n/format';
import { exerciseName, exerciseText } from '../i18n/factory';
import { AppError } from '../data/errors';

type Props = { repository: LocalRepository; snapshot: LocalSnapshot; workout: Workout | null; draft?: Draft | null; initial?: Partial<WorkoutInput>; onClose: () => void; onSaved: (workout: Workout) => void };
type RawItem = { id: string; exercise: Exercise; planned: RawDose; actual: RawDose | null; athleteNotes: string; supersetId: string | null; muscleRoles: MuscleRoleAssignment[] | null };
type RawForm = { title: string; sportId: string; trainingType: TrainingType | null; supersets: Superset[]; postWorkout?: PostWorkout; plannedFatigue: RawPlannedFatigue; date: string; time: string; status: Workout['status']; plannedMinutes: string; durationMinutes: string; rpe: string; planNotes: string; notes: string; periodId: string; wasPlanned: boolean; sections: Record<Section, RawItem[]> };
type Confirmation = 'delete' | 'discard' | 'copy' | 'asPlanned' | null;
type DraftState = 'initial' | 'saved' | 'pending' | 'saving' | 'failed';
const sectionOrder: Section[] = ['warmup', 'main', 'cooldown'];
const rawDoseSchema = z.object({ sets: z.string(), quantity: z.string(), kg: z.string(), rir: z.string().default(''), tempo: z.string(), rest: z.string(), effort: z.string(), prescription: z.string() });
const rawItemSchema = z.object({ id: z.string(), exercise: exerciseSchema, planned: rawDoseSchema, actual: rawDoseSchema.nullable(), athleteNotes: z.string(), supersetId: z.string().nullable().default(null), muscleRoles: muscleRolesSchema.nullable().default(null) });
const rawFormSchema = z.object({ title: z.string(), sportId: z.string(), trainingType: z.enum(['strength', 'running', 'endurance', 'technical', 'team', 'mental']).nullable().default(null), supersets: z.array(supersetSchema).default([]), postWorkout: postWorkoutSchema.optional(), plannedFatigue: z.object({ aerobicFatigue: z.string(), muscularFatigue: z.string() }).default({ aerobicFatigue: '', muscularFatigue: '' }), date: z.string(), time: z.string(), status: z.enum(['planned', 'completed', 'skipped']), plannedMinutes: z.string(), durationMinutes: z.string(), rpe: z.string(), planNotes: z.string(), notes: z.string(), periodId: z.string(), wasPlanned: z.boolean(), sections: z.object({ warmup: z.array(rawItemSchema), main: z.array(rawItemSchema), cooldown: z.array(rawItemSchema) }) });
const clone = <T,>(value: T): T => structuredClone(value);
const text = (value: unknown) => value === null || value === undefined ? '' : String(value);
function today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function isConflict(error: unknown) { return error instanceof Error && /Conflict|Epoch/.test(error.name); }
function rawDose(dose?: Partial<Dose> | null): RawDose { return { sets: text(dose?.sets), quantity: text(dose?.quantity), kg: text(dose?.kg), rir: text(dose?.rir), tempo: dose?.tempo ?? '', rest: dose?.rest ?? '', effort: dose?.effort ?? '', prescription: dose?.prescription ?? '' }; }
function rawItem(item: NonNullable<WorkoutInput['sections']>['main'][number]): RawItem { return { id: item.id, exercise: clone(item.exercise), planned: rawDose(item.planned), actual: item.actual ? rawDose(item.actual) : null, athleteNotes: item.athleteNotes ?? '', supersetId: item.supersetId ?? null, muscleRoles: item.muscleRoles ? clone(item.muscleRoles) : null }; }
function initialForm(workout: Workout | null, initial: Partial<WorkoutInput> | undefined, snapshot: LocalSnapshot): RawForm {
  const source = workout ?? initial;
  return { plannedFatigue: { aerobicFatigue: text(source?.plannedFatigue?.aerobicFatigue), muscularFatigue: text(source?.plannedFatigue?.muscularFatigue) }, title: source?.title ?? '', sportId: source?.sportId ?? (snapshot.profile?.sportIds.length === 1 ? snapshot.profile.sportIds[0] : ''), trainingType: source?.trainingType ?? null, supersets: (source?.supersets ?? []).map(group => supersetSchema.parse(group)), ...(source?.postWorkout ? { postWorkout: postWorkoutSchema.parse(source.postWorkout) } : {}), date: source?.date ?? today(), time: source?.time ?? '', status: source?.status ?? 'completed', plannedMinutes: text(source?.plannedMinutes), durationMinutes: text(source?.durationMinutes), rpe: text(source?.rpe), planNotes: source?.planNotes ?? '', notes: source?.notes ?? '', periodId: source?.periodId ?? '', wasPlanned: source?.wasPlanned ?? source?.status === 'planned', sections: { warmup: (source?.sections?.warmup ?? []).map(rawItem), main: (source?.sections?.main ?? []).map(rawItem), cooldown: (source?.sections?.cooldown ?? []).map(rawItem) } };
}
// A draft keeps strings, including incomplete numbers, independently of the valid workout schema.
function restoreForm(raw: Draft['raw'], fallback: RawForm): RawForm {
  const parsed = rawFormSchema.safeParse(raw.form);
  if (!parsed.success) return fallback;
  const postWorkout = parsed.data.postWorkout ?? fallback.postWorkout;
  const hasPlannedFatigue = raw.form && typeof raw.form === 'object' && !Array.isArray(raw.form) && 'plannedFatigue' in raw.form;
  return { ...parsed.data, ...normalizeSupersets(parsed.data), plannedFatigue: hasPlannedFatigue ? parsed.data.plannedFatigue : fallback.plannedFatigue, ...(postWorkout ? { postWorkout } : {}) };
}
function numberValue(value: string, label: string, min: number, max: number, integer = false): number {
  if (!value.trim()) throw new AppError('fieldRequired', undefined, { label });
  const result = parseDecimal(value);
  if (result === null || result < min || result > max || integer && !Number.isInteger(result)) throw new AppError(integer ? 'fieldInteger' : 'fieldNumber', undefined, { label, min, max });
  return result;
}
function optionalNumber(value: string, label: string, max: number, integer = false) { return value.trim() ? numberValue(value, label, 0, max, integer) : null; }
function parseDose(value: RawDose, item: Exercise, i18n: Translator): Dose {
  const exercise = exerciseName(item, i18n.language);
  return { sets: value.sets.trim() ? numberValue(value.sets, i18n.t('editor.label_sets', { exercise }), 1, 100, true) : null, quantity: optionalNumber(value.quantity, i18n.t('editor.label_quantity', { exercise, quantity: i18n.t(`training.quantity_${item.metric}`) }), 100000), kg: optionalNumber(value.kg, i18n.t('editor.label_weight', { exercise }), 100000) ?? 0, rir: optionalNumber(value.rir, i18n.t('editor.label_rir', { exercise }), 100, true), tempo: value.tempo, rest: value.rest, effort: value.effort, prescription: value.prescription };
}
function workoutInput(form: RawForm, profileId: string, source: Workout | null, initial?: Partial<WorkoutInput>, asNew = false): WorkoutInput {
  const i18n = currentTranslator();
  if (form.status === 'completed' && form.date > today()) throw new AppError('futureAsPlan');
  if (!form.sportId) throw new AppError('sportDetailsRequired');
  if ((!source || asNew) && !form.trainingType) throw new AppError('kindRequired');
  return { profileId, plannedFatigue: { aerobicFatigue: optionalNumber(form.plannedFatigue.aerobicFatigue, i18n.t('editor.label_plannedAerobic'), 10, true), muscularFatigue: optionalNumber(form.plannedFatigue.muscularFatigue, i18n.t('editor.label_plannedMuscular'), 10, true) }, title: form.title, trainingType: form.trainingType, supersets: form.supersets, postWorkout: form.postWorkout ?? source?.postWorkout ?? initial?.postWorkout, sportId: form.sportId as WorkoutInput['sportId'], date: form.date, time: form.time || null, status: form.status, plannedMinutes: optionalNumber(form.plannedMinutes, i18n.t('editor.label_plannedMinutes'), 1440, true), durationMinutes: optionalNumber(form.durationMinutes, i18n.t('editor.label_actualMinutes'), 1440, true), rpe: optionalNumber(form.rpe, i18n.t('editor.label_rpe'), 10, true), planNotes: form.planNotes, notes: form.notes, periodId: form.periodId || null, wasPlanned: form.wasPlanned || form.status === 'planned', sections: Object.fromEntries(sectionOrder.map(section => [section, form.sections[section].map(item => ({ id: item.id, muscleRoles: item.muscleRoles ? clone(item.muscleRoles) : null, supersetId: item.supersetId, exercise: clone(item.exercise), planned: parseDose(item.planned, item.exercise, i18n), actual: item.actual ? parseDose(item.actual, item.exercise, i18n) : null, athleteNotes: item.athleteNotes }))])) as WorkoutInput['sections'] };
}

export function WorkoutEditor({ repository, snapshot, workout, draft = null, initial, onClose, onSaved }: Props) {
  const i18n = useI18n(), { t, language } = i18n;
  const [form, setForm] = useState(() => draft ? restoreForm(draft.raw, initialForm(workout, initial, snapshot)) : initialForm(workout, initial, snapshot));
  const [baseRevision] = useState(draft?.baseRevision ?? workout?.revision ?? null);
  const [baseEpoch] = useState(draft?.epoch ?? snapshot.epoch);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  // The failure is kept as a value and rendered in the current language.
  const [failure, setFailure] = useState<{ value: unknown } | null>(draft && !rawFormSchema.safeParse(draft.raw.form).success ? { value: { key: 'editor.draftUnreadable' as const } } : null);
  const setError = (value: unknown) => setFailure(value === '' ? null : { value });
  const error = !failure ? '' : typeof failure.value === 'string' ? failure.value : typeof failure.value === 'object' && failure.value !== null && 'key' in failure.value ? i18n.msg(failure.value as { key: 'editor.draftUnreadable' | 'editor.futureNotDone' }) : errorText(i18n, failure.value);
  const [conflict, setConflict] = useState(!!draft && !rawFormSchema.safeParse(draft.raw.form).success);
  const [draftState, setDraftState] = useState<DraftState>(draft ? 'saved' : 'initial');
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [copyDate, setCopyDate] = useState(today());
  const [search, setSearch] = useState('');
  const [addingSection, setAddingSection] = useState<Section | null>(null);
  const [editPlan, setEditPlan] = useState(false);
  const [sportDetails, setSportDetails] = useState(!form.sportId);
  const [committed, setCommitted] = useState<Workout | null>(null);
  const formRef = useRef(form);
  const currentDraft = useRef(draft);
  const changeVersion = useRef(!draft && !workout && initial ? 1 : 0);
  const savedVersion = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const stopped = useRef(false);
  const committing = useRef(false);
  const mounted = useRef(true);
  const unreadableDraft = useRef(!!draft && !rawFormSchema.safeParse(draft.raw.form).success);
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const planReadonly = form.status !== 'planned' && form.wasPlanned && !editPlan;
  const futureCompleted = form.status === 'completed' && form.date > today();
  const datePeriods = periodsForDate(snapshot.periods, form.date);
  const exercises = [...getBuiltinExercises(), ...snapshot.customExercises.filter(exercise => !exercise.archivedAt)].filter((exercise, index, all) => all.findIndex(other => other.id === exercise.id) === index);
  const results = exercises.filter(exercise => searchKey(`${exercise.name} ${exercise.nameEn ?? ''} ${exerciseName(exercise, language)}`).includes(searchKey(search.trim()))).slice(0, 40);

  function change(update: (current: RawForm) => RawForm) {
    if (busyRef.current || stopped.current) return;
    const updated = update(formRef.current);
    const next = { ...updated, ...normalizeSupersets(updated) };
    formRef.current = next; changeVersion.current += 1; setForm(next);
    setDraftState('pending');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { timer.current = null; void flushDraft().catch(() => undefined); }, 300);
  }
  function field<K extends keyof RawForm>(key: K, value: RawForm[K]) { change(current => ({ ...current, [key]: value })); }
  function changeItem(section: Section, id: string, update: (item: RawItem) => RawItem) { change(current => ({ ...current, sections: { ...current.sections, [section]: current.sections[section].map(item => item.id === id ? update(item) : item) } })); }
  async function flushDraft() {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    const task = queue.current.catch(() => undefined).then(async () => {
      if (stopped.current || committing.current || savedVersion.current === changeVersion.current) return;
      if (unreadableDraft.current) throw new AppError('draftKept');
      const version = changeVersion.current;
      const input = { profileId: snapshot.profile!.id, kind: 'workout' as const, entityId: draft?.entityId ?? workout?.id ?? null, baseRevision, epoch: baseEpoch, raw: { form: clone(formRef.current) } as unknown as Draft['raw'] };
      if (mounted.current) setDraftState('saving');
      try {
        const previous = currentDraft.current;
        currentDraft.current = previous ? await repository.updateDraft(previous.id, previous.revision, input) : await repository.createDraft(input, baseEpoch);
        savedVersion.current = version;
        if (mounted.current) setDraftState(version === changeVersion.current ? 'saved' : 'pending');
      } catch (failure) {
        if (mounted.current) { setDraftState('failed'); setError(failure); if (isConflict(failure)) setConflict(true); }
        throw failure;
      }
    });
    queue.current = task;
    return task;
  }
  const latestFlushDraft = useRef(flushDraft);
  // Keep event handlers current without re-registering the mount/unmount lifecycle.
  useEffect(() => { latestFlushDraft.current = flushDraft; });
  useEffect(() => {
    mounted.current = true;
    const protectUnsaved = (event: BeforeUnloadEvent) => { if (changeVersion.current !== savedVersion.current && !stopped.current) { event.preventDefault(); event.returnValue = ''; } };
    const onHidden = () => { if (document.visibilityState === 'hidden') void latestFlushDraft.current().catch(() => undefined); };
    window.addEventListener('beforeunload', protectUnsaved); document.addEventListener('visibilitychange', onHidden);
    return () => { mounted.current = false; if (timer.current) clearTimeout(timer.current); window.removeEventListener('beforeunload', protectUnsaved); document.removeEventListener('visibilitychange', onHidden); };
  }, []);
  useEffect(() => {
    if (!confirmation) return;
    const before = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') ?? []);
    focusable().at(-1)?.focus();
    function keyboard(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busyRef.current) { setConfirmation(null); event.preventDefault(); }
      if (event.key !== 'Tab') return;
      const controls = focusable(); const first = controls[0]; const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { last?.focus(); event.preventDefault(); }
      else if (!event.shiftKey && document.activeElement === last) { first?.focus(); event.preventDefault(); }
    }
    document.addEventListener('keydown', keyboard);
    return () => { document.removeEventListener('keydown', keyboard); before?.focus(); };
  }, [confirmation]);

  async function perform(action: () => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError('');
    try { await action(); }
    catch (failure) { setError(failure); if (isConflict(failure)) setConflict(true); }
    finally { busyRef.current = false; if (mounted.current) setBusy(false); }
  }
  async function removeDraft() { const previous = currentDraft.current; if (previous) { await repository.deleteDraft(previous.id, previous.revision, baseEpoch); currentDraft.current = null; } }
  async function save(asNew = false) {
    await perform(async () => {
      const input = workoutInput(formRef.current, snapshot.profile!.id, workout, initial, asNew);
      // Finish in-flight draft writes before committing; a draft write failure need not prevent a valid workout save.
      if (timer.current) { clearTimeout(timer.current); timer.current = null; }
      committing.current = true;
      try {
        await queue.current.catch(() => undefined);
        const targetId = draft?.entityId ?? workout?.id;
        const latest = asNew ? await repository.readSnapshot() : null;
        const epoch = latest?.epoch ?? baseEpoch;
        const previous = currentDraft.current;
        const latestDraft = latest?.drafts.find(item => item.id === previous?.id);
        // An explicit new copy may keep this form while another tab or restore replaced its draft.
        // In that case, preserve the other draft rather than deleting it after this commit.
        const ownDraft = previous && !unreadableDraft.current && (!asNew || latestDraft?.revision === previous.revision && latestDraft.epoch === previous.epoch) ? { id: previous.id, revision: previous.revision } : undefined;
        const saved = !asNew && targetId && baseRevision !== null ? await repository.updateWorkout(targetId, baseRevision, input, epoch, ownDraft) : await repository.createWorkout(input, epoch, ownDraft);
        stopped.current = true; setCommitted(saved); savedVersion.current = changeVersion.current;
        if (ownDraft) currentDraft.current = null;
        onSaved(saved);
      } finally { committing.current = false; }
    });
  }
  function submit(event: FormEvent) { event.preventDefault(); void save(); }
  async function close() { await perform(async () => { await flushDraft(); stopped.current = true; onClose(); }); }
  function addExercise(exercise: Exercise) {
    if (!addingSection) return;
    const section = addingSection;
    const item: RawItem = { id: crypto.randomUUID(), exercise: exerciseSchema.strip().parse(exercise), planned: rawDose(), actual: null, athleteNotes: '', supersetId: null, muscleRoles: muscleRolesForExercise(snapshot.exerciseRoles, exercise.id) };
    change(current => ({ ...current, sections: { ...current.sections, [section]: [...current.sections[section], item] } }));
    setAddingSection(null); setSearch('');
  }
  function moveItem(from: Section, id: string, to: Section) { if (from === to) return; change(current => { const item = current.sections[from].find(value => value.id === id)!; return { ...current, sections: { ...current.sections, [from]: current.sections[from].filter(value => value.id !== id), [to]: [...current.sections[to], { ...item, supersetId: null }] } }; }); }
  function reorder(section: Section, index: number, offset: number) { change(current => ({ ...current, ...reorderPlanItem(current, section, current.sections[section][index].id, offset) })); }
  async function confirmAction() {
    if (confirmation === 'asPlanned') {
      if (formRef.current.date > today()) { setError({ key: 'editor.futureNotDone' }); setConfirmation(null); return; }
      change(current => ({ ...current, status: 'completed', durationMinutes: current.plannedMinutes, sections: Object.fromEntries(sectionOrder.map(section => [section, current.sections[section].map(item => ({ ...item, actual: { ...clone(item.planned), kg: '', rir: '' } }))])) as RawForm['sections'] }));
      setConfirmation(null); return;
    }
    await perform(async () => {
      if (timer.current) { clearTimeout(timer.current); timer.current = null; }
      committing.current = confirmation === 'delete' || confirmation === 'discard';
      try {
        await queue.current.catch(() => undefined);
        if (confirmation === 'copy' && workout) {
          await flushDraft();
          const copied = await repository.copyWorkout(workout.id, copyDate, baseEpoch, baseRevision ?? workout.revision);
          stopped.current = true; onSaved(copied);
        } else if (confirmation === 'delete' && workout) {
          await repository.deleteWorkout(workout.id, baseRevision ?? workout.revision, baseEpoch);
          stopped.current = true;
          currentDraft.current = null; // The repository removes linked drafts in this same transaction.
          onClose();
        } else if (confirmation === 'discard') { await removeDraft(); stopped.current = true; onClose(); }
      } finally { committing.current = false; }
    });
  }

  if (!snapshot.profile) return <p role="alert">{t('editor.needProfile')}</p>;
  return <section className="workout-editor" aria-labelledby={headingId}>
    <button type="button" className="we-back" disabled={busy} onClick={() => void close()}>{t('editor.backKeepDraft')}</button>
    <div className="page-heading"><div><p className="eyebrow">{t(workout ? 'editor.eyebrowEdit' : form.status === 'planned' ? 'editor.eyebrowPlan' : 'editor.eyebrowLog')}</p><h1 id={headingId}>{t(workout ? 'editor.titleEdit' : form.status === 'planned' ? 'editor.titlePlan' : 'editor.titleLog')}</h1><p className="intro">{t('editor.intro')}</p></div></div>
    <p className="we-draft-status" role="status" aria-live="polite">{t(`editor.draft_${draftState}`)}</p>
    {error && <div className="error" role="alert"><p>{error}</p>{!committed && !conflict && <button type="button" disabled={busy} onClick={() => void perform(flushDraft)}>{t('editor.retryDraft')}</button>}</div>}
    {conflict && !committed && <div className="we-conflict"><p>{t('editor.conflict')}</p><button type="button" disabled={busy} onClick={() => void save(true)}>{t('editor.saveAsNew')}</button></div>}
    {committed ? <div className="card"><p>{t('editor.committed')}</p><button className="primary" type="button" onClick={() => onSaved(committed)}>{t('editor.backToJournal')}</button></div> : <form onSubmit={submit} className="we-form">
      <fieldset disabled={busy} className="card we-fields"><legend className="sr-only">{t('editor.basics')}</legend>
        <label className="field">{t('editor.name')} <span className="optional">{t('editor.optional')}</span><input value={form.title} maxLength={160} placeholder={t('editor.namePlaceholder')} onChange={event => field('title', event.target.value)} /></label>
        <div className="we-grid"><TrainingTypeField value={form.trainingType} required={!workout} onChange={value => field('trainingType', value)} /><label className="field">{t('editor.date')}<input type="date" required min="0001-01-01" max="9999-12-31" value={form.date} onChange={event => field('date', event.target.value)} /></label></div>
        <div className="training-periods" aria-live="polite"><strong>{t('editor.periodsForDay')}</strong>{datePeriods.length ? <ul>{datePeriods.map(period => <li key={period.id}>{(() => { const path = [period]; const seen = new Set([period.id]); let parent = snapshot.periods.find(candidate => candidate.id === period.parentId); while (parent && !seen.has(parent.id)) { path.unshift(parent); seen.add(parent.id); parent = snapshot.periods.find(candidate => candidate.id === parent!.parentId); } return path.map(entry => t(`editor.path_${entry.level ?? 'none'}`, { name: entry.name })).join(' → '); })()}</li>)}</ul> : <p>{t('editor.noPeriod')}</p>}</div>
        <label className="field">{t('editor.status')}<select value={form.status} onChange={event => change(current => ({ ...current, status: event.target.value as Workout['status'], wasPlanned: current.wasPlanned || event.target.value === 'planned' }))}><option value="completed" disabled={form.date > today()}>{t('workoutStatus.completed')}</option><option value="planned">{t('workoutStatus.planned')}</option><option value="skipped">{t('workoutStatus.skipped')}</option></select></label>
        {futureCompleted && <div className="error" role="alert"><p>{t('editor.futureDay')}</p><button type="button" onClick={() => change(current => ({ ...current, status: 'planned', wasPlanned: true }))}>{t('editor.changeToPlanned')}</button></div>}
        <details className="we-details" open={sportDetails} onToggle={event => setSportDetails(event.currentTarget.open)}><summary>{t(form.sportId ? 'editor.moreDetails' : 'editor.moreDetailsSport')}</summary><div className="we-fields"><label className="field">{t('editor.sport')}<select required value={form.sportId} onChange={event => field('sportId', event.target.value)}><option value="">{t('editor.chooseSport')}</option>{SPORTS.filter(sport => snapshot.profile!.sportIds.includes(sport.id) || sport.id === workout?.sportId || sport.id === form.sportId).map(sport => <option key={sport.id} value={sport.id}>{t(`sport.${sport.id}`)}</option>)}</select></label><label className="field">{t('editor.time')} <span className="optional">{t('editor.optional')}</span><input type="time" value={form.time} onChange={event => field('time', event.target.value)} /></label></div></details>
      </fieldset>
      {(form.status === 'planned' || form.wasPlanned || !!form.planNotes || !!form.plannedMinutes || !!form.plannedFatigue.aerobicFatigue || !!form.plannedFatigue.muscularFatigue) && <fieldset disabled={busy} className="card we-fields we-plan"><legend>{t('editor.planLegend')}</legend>{planReadonly && <><p className="field-hint">{t('editor.planKept')}</p><button className="we-secondary" type="button" onClick={() => setEditPlan(true)}>{t('editor.editPlanToo')}</button></>}<label className="field">{t('editor.plannedMinutes')} <span className="optional">{t('editor.optional')}</span><input inputMode="decimal" value={form.plannedMinutes} readOnly={planReadonly} onChange={event => field('plannedMinutes', event.target.value)} /></label><PlannedFatigueFields value={form.plannedFatigue} readOnly={planReadonly} onChange={value => field('plannedFatigue', value)}/><label className="field">{t('editor.planNote')}<textarea value={form.planNotes} maxLength={10000} readOnly={planReadonly} rows={3} onChange={event => field('planNotes', event.target.value)} /></label>{form.wasPlanned && <button type="button" className="we-secondary" disabled={form.date > today()} onClick={() => setConfirmation('asPlanned')}>{t('editor.doneAsPlanned')}</button>}</fieldset>}
      {form.status !== 'planned' && <fieldset disabled={busy} className="card we-fields we-actual"><legend>{t(form.status === 'completed' ? 'editor.actualLegend' : 'editor.skippedLegend')}</legend>{form.status === 'completed' && <div className="we-grid"><label className="field">{t('editor.actualMinutes')} <span className="optional">{t('editor.optional')}</span><input inputMode="decimal" value={form.durationMinutes} onChange={event => field('durationMinutes', event.target.value)} /></label><div className="field"><span>{t('editor.rpe')} <Help label="RPE">{t('editor.rpeHelp')}</Help></span><select aria-label={t('editor.rpe')} value={form.rpe} onChange={event => field('rpe', event.target.value)}><option value="">{t('editor.notSpecified')}</option>{Array.from({ length: 11 }, (_, value) => <option key={value} value={value}>{t('editor.outOfTen', { value })}</option>)}</select></div></div>}<label className="field">{t('editor.yourNote')}<textarea value={form.notes} maxLength={10000} rows={4} placeholder={t('editor.notePlaceholder')} onChange={event => field('notes', event.target.value)} /></label></fieldset>}
      <details className="card we-exercises" open={Object.values(form.sections).some(items => items.length > 0) || undefined}><summary>{t('editor.exercises')} <span className="optional">{t('editor.exercisesOptional')}</span></summary><p className="field-hint">{t('editor.exercisesHint')}</p>
        {sectionOrder.map(section => <section key={section} className="we-section" aria-label={t(`section.${section}`)}><h2>{t(`section.${section}`)}</h2>{form.sections[section].length === 0 && <p className="we-muted">{t('editor.noExercises')}</p>}
          <SupersetControls plan={form} section={section} readOnly={busy || planReadonly} onChange={value => change(current => ({ ...current, ...value }))} />
          {form.sections[section].map((item, index) => <fieldset key={item.id} disabled={busy} className={`we-item ${item.supersetId ? 'is-grouped' : ''}`}><legend>{t('editor.itemLegend', { label: itemLabel(form, section, item), name: exerciseName(item.exercise, language) })}</legend><details className="we-guidance"><summary>{t('editor.exerciseDescription')}</summary><p>{exerciseText(item.exercise, 'notes', language) || t('editor.noDescription')}</p>{item.exercise.cues && <p>{exerciseText(item.exercise, 'cues', language)}</p>}{snapshot.exerciseNotes.filter(note => note.exerciseId === item.exercise.id).map(note => <p key={note.id}><strong>{t('editor.yourExerciseNote')}</strong>{note.notes}</p>)}</details>
            <DoseFields label={t('editor.plan')} value={item.planned} exercise={item.exercise} trainingType={form.trainingType} grouped={!!item.supersetId} readOnly={planReadonly} onChange={dose => changeItem(section, item.id, current => ({ ...current, planned: dose }))} />
            <MuscleRolesEditor value={item.muscleRoles} exerciseName={exerciseName(item.exercise, language)} readOnly={planReadonly} onChange={roles => changeItem(section, item.id, current => ({ ...current, muscleRoles: roles }))}/>
            {form.status === 'completed' && <div className="we-item-actual"><h3>{t('editor.performance')}</h3>{item.actual ? <><DoseFields label={t('editor.performed')} value={item.actual} exercise={item.exercise} trainingType={form.trainingType} actual grouped={!!item.supersetId} onChange={dose => changeItem(section, item.id, current => ({ ...current, actual: dose }))} /><button type="button" className="we-secondary" onClick={() => changeItem(section, item.id, current => ({ ...current, actual: null }))}>{t('editor.leaveUnspecified')}</button></> : <><p className="we-muted">{t('editor.noActual')}</p><button type="button" className="we-secondary" onClick={() => changeItem(section, item.id, current => ({ ...current, actual: rawDose() }))}>{t('editor.enterActual')}</button></>}<label className="field">{t('editor.exerciseNote')}<textarea rows={2} maxLength={3000} value={item.athleteNotes} onChange={event => changeItem(section, item.id, current => ({ ...current, athleteNotes: event.target.value }))} /></label></div>}
            {!planReadonly && <div className="we-item-tools"><label className="field">{t('editor.section')}<select value={section} onChange={event => moveItem(section, item.id, event.target.value as Section)}>{sectionOrder.map(value => <option key={value} value={value}>{t(`section.${value}`)}</option>)}</select></label><div className="we-actions"><button type="button" disabled={busy || !!item.supersetId || index === 0} aria-label={t('editor.moveUp', { name: exerciseName(item.exercise, language) })} onClick={() => reorder(section, index, -1)}>{t('editor.up')}</button><button type="button" disabled={busy || !!item.supersetId || index === form.sections[section].length - 1} aria-label={t('editor.moveDown', { name: exerciseName(item.exercise, language) })} onClick={() => reorder(section, index, 1)}>{t('editor.down')}</button><button type="button" className="we-danger" aria-label={t('editor.removeNamed', { name: exerciseName(item.exercise, language) })} onClick={() => change(current => ({ ...current, sections: { ...current.sections, [section]: current.sections[section].filter(value => value.id !== item.id) } }))}>{t('editor.remove')}</button></div></div>}
          </fieldset>)}
          <button type="button" className="we-secondary" disabled={busy || planReadonly} onClick={() => { setAddingSection(section); setSearch(''); }}>{t('editor.addExercise')}</button>
          {addingSection === section && <div className="we-picker"><label className="field">{t('editor.search')}<input type="search" autoFocus value={search} onChange={event => setSearch(event.target.value)} /></label><p className="we-muted">{t(results.length ? 'editor.pickHint' : 'editor.noResults')}</p><ul>{results.map(exercise => <li key={exercise.id}><button type="button" disabled={busy} onClick={() => addExercise(exercise)}><span>{exerciseName(exercise, language)}</span><span>{t('editor.add')}</span></button></li>)}</ul>{results.length === 40 && <p className="we-muted">{t('editor.first40')}</p>}<button type="button" className="we-secondary" onClick={() => setAddingSection(null)}>{t('editor.closeSearch')}</button></div>}
        </section>)}
      </details>
      <button type="submit" className="primary" disabled={busy || conflict || futureCompleted}>{t(busy ? 'editor.saving' : workout ? 'editor.saveChanges' : form.status === 'planned' ? 'editor.savePlan' : 'editor.saveWorkout')}</button>
      <div className="we-actions"><button type="button" disabled={busy} onClick={() => void close()}>{t('editor.leaveDraft')}</button><button type="button" className="we-danger" disabled={busy} onClick={() => setConfirmation('discard')}>{t('editor.discard')}</button></div>
      {workout && <details className="we-details"><summary>{t('editor.copyDelete')}</summary><div className="we-actions"><button type="button" disabled={busy} onClick={() => setConfirmation('copy')}>{t('editor.copy')}</button><button type="button" className="we-danger" disabled={busy} onClick={() => setConfirmation('delete')}>{t('editor.delete')}</button></div></details>}
    </form>}
    {confirmation && <div ref={dialogRef} className="we-confirm" role="dialog" aria-modal="true" aria-label={t('editor.confirmDialog')}><div className="card"><h2>{t(confirmation === 'delete' ? 'editor.confirmDeleteTitle' : confirmation === 'discard' ? 'editor.confirmDiscardTitle' : confirmation === 'copy' ? 'editor.confirmCopyTitle' : 'editor.confirmPlannedTitle')}</h2><p>{t(confirmation === 'delete' ? 'editor.confirmDeleteText' : confirmation === 'discard' ? 'editor.confirmDiscardText' : confirmation === 'copy' ? 'editor.confirmCopyText' : 'editor.confirmPlannedText')}</p>{confirmation === 'copy' && <label className="field">{t('editor.copyDate')}<input type="date" required value={copyDate} onChange={event => setCopyDate(event.target.value)} /></label>}<div className="we-actions"><button className="primary" type="button" disabled={busy || confirmation === 'copy' && !copyDate} onClick={() => void confirmAction()}>{t(busy ? 'editor.saving' : 'editor.confirm')}</button><button type="button" disabled={busy} autoFocus onClick={() => setConfirmation(null)}>{t('editor.cancel')}</button></div></div></div>}
  </section>;
}
