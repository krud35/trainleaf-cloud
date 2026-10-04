import { useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ChevronRight, Dumbbell } from 'lucide-react';
import { categories, metrics, muscles } from '../../../lib/domain';
import { exerciseTypes, inferExerciseTypes, type ExerciseType } from '../../../lib/exercise-types';
import { SPORTS, emptyDose, sectionsSchema, supersetSchema, type Exercise, type Item, type Dose, type Section, type WorkoutInput, type SportId, type LocalSnapshot } from '../data/domain';
import { getBuiltinExercises, getBuiltinTemplates } from '../data/catalog';
import { muscleRolesForExercise } from '../data/analytics';
import type { LocalRepository } from '../data/repository';
import './library.css';
import { cloneTrainingPlan, normalizeSupersets } from '../data/supersets';
import { DoseFields, TrainingTypeField, type RawDose } from './TrainingFields';
import { itemLabel, reorderPlanItem, SupersetControls } from './SupersetControls';
import { currentTranslator, useI18n } from '../i18n';
import { doseCount, errorText, trainingTypeLabel } from '../i18n/labels';
import { searchKey } from '../i18n/format';
import { builtinTemplateName, exerciseName, exerciseProvenance, exerciseText, isFactoryText, localizedExerciseCopy } from '../i18n/factory';

export interface LibraryViewProps {
  repository: LocalRepository;
  snapshot: LocalSnapshot;
  onChanged: () => Promise<void>;
  initialTab?: 'exercises' | 'templates';
  onStartWorkout: (initial: Partial<WorkoutInput>) => void;
}

type ExerciseInput = Parameters<LocalRepository['createExercise']>[0];
type TemplateInput = Parameters<LocalRepository['createTemplate']>[0];
type OwnExercise = LocalSnapshot['customExercises'][number];
type OwnTemplate = LocalSnapshot['templates'][number];
type Note = LocalSnapshot['exerciseNotes'][number];
type TemplateSections = { warmup: Item[]; main: Item[]; cooldown: Item[] };
type TemplateScope = 'whole' | Section;
type Screen =
  | { kind: 'list' }
  | { kind: 'detail'; exercise: Exercise; custom?: OwnExercise; note?: Note; epoch: number }
  | { kind: 'exercise'; initial: Exercise; existing?: OwnExercise; epoch: number }
  | { kind: 'template'; initial: TemplateInput; existing?: OwnTemplate; readonly?: boolean; epoch: number };

const scopes: readonly TemplateScope[] = ['whole', 'warmup', 'main', 'cooldown'];
const scopeName = (scope: TemplateScope) => currentTranslator().t(`section.${scope}`);
const emptySections = (): TemplateSections => ({ warmup: [], main: [], cooldown: [] });
const uid = () => crypto.randomUUID();
const copy = <T,>(value: T): T => structuredClone(value);
// Catalog and session snapshots contain exercise fields only, never local row metadata.
const exerciseSnapshot = (exercise: Exercise): Exercise => {
  const { id, name, category, metric, shares, video, notes, nameEn, notesEn, cues, cuesEn,
    variants, variantsEn, sourceUrls, provenance, prescription, types } = exercise;
  return copy({ id, name, category, metric, shares, video, notes, nameEn, notesEn, cues, cuesEn,
    variants, variantsEn, sourceUrls, provenance, prescription, types });
};
const searchable = searchKey;
const matches = (exercise: Exercise, query: string, type: string) =>
  (!query || searchable(`${exercise.name} ${exercise.nameEn ?? ''} ${exercise.notes} ${exercise.notesEn ?? ''} ${exerciseName(exercise, currentTranslator().language)} ${exerciseText(exercise, 'notes', currentTranslator().language)}`).includes(searchable(query.trim()))) &&
  (!type || inferExerciseTypes(exercise).includes(type as ExerciseType));
const describeError = (error: unknown): string => errorText(currentTranslator(), error);

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="field">{label}{children}{hint && <span className="optional">{hint}</span>}</label>;
}

function ExerciseFilters({ query, type, onQuery, onType }: { query: string; type: string; onQuery: (value: string) => void; onType: (value: string) => void }) {
  const { t } = useI18n();
  return <div className="library-filter-grid">
    <Field label={t('library.searchExercise')}><input type="search" value={query} onChange={event => onQuery(event.target.value)} placeholder={t('library.searchPlaceholder')} /></Field>
    <Field label={t('library.type')}><select value={type} onChange={event => onType(event.target.value)}>
      <option value="">{t('library.allTypes')}</option>{(Object.keys(exerciseTypes) as ExerciseType[]).map(key => <option key={key} value={key}>{t(`exerciseType.${key}`)}</option>)}
    </select></Field>
  </div>;
}

function DoseEditor({ value, exercise, trainingType, grouped, onChange }: { value: Dose; exercise: Exercise; trainingType?: TemplateInput['trainingType']; grouped?: boolean; onChange: (value: Dose) => void }) {
  const [raw, setRaw] = useState<RawDose>(() => ({ sets: value.sets === null ? '' : String(value.sets), quantity: value.quantity === null ? '' : String(value.quantity), kg: String(value.kg), rir: value.rir === null || value.rir === undefined ? '' : String(value.rir), tempo: value.tempo ?? '', rest: value.rest ?? '', effort: value.effort ?? '', prescription: value.prescription ?? '' }));
  const { t } = useI18n();
  return <DoseFields label={t('editor.plan')} value={raw} exercise={exercise} trainingType={trainingType} grouped={grouped} onChange={next => {
    setRaw(next);
    const number = (input: string) => input.trim() ? Number(input.replace(',', '.')) : null;
    onChange({ sets: number(next.sets), quantity: number(next.quantity), kg: number(next.kg) ?? 0, rir: number(next.rir), tempo: next.tempo, rest: next.rest, effort: next.effort, prescription: next.prescription });
  }} />;
}

function ExerciseEditor({ initial, busy, onSave, onCancel }: { initial: Exercise; busy: boolean; onSave: (value: Omit<Exercise, 'id'>) => void; onCancel: () => void }) {
  const { t } = useI18n();
  const [value, setValue] = useState(() => exerciseSnapshot(initial));
  const [sources, setSources] = useState((initial.sourceUrls ?? []).join('\n'));
  const [shares, setShares] = useState(initial.shares.map(share => ({ muscle: share.muscle, percent: String(Math.round(share.weight * 10000) / 100) })));
  const [validation, setValidation] = useState('');
  const patch = (changes: Partial<Exercise>) => setValue(previous => ({ ...previous, ...changes }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const parsedShares = shares.map(share => ({ muscle: share.muscle, weight: Number(share.percent) / 100 }));
    if (parsedShares.some(share => !Number.isFinite(share.weight) || share.weight < 0 || share.weight > 1) || (parsedShares.length > 0 && Math.abs(parsedShares.reduce((sum, share) => sum + share.weight, 0) - 1) >= .001)) {
      setValidation(t('library.sharesInvalid')); return;
    }
    if (!value.types?.length) { setValidation(t('library.typeRequired')); return; }
    const input: Omit<Exercise, 'id'> = {
      name: value.name, category: value.category, metric: value.metric, shares: value.shares,
      video: value.video, notes: value.notes, nameEn: value.nameEn, notesEn: value.notesEn,
      cues: value.cues, cuesEn: value.cuesEn, variants: value.variants, variantsEn: value.variantsEn,
      sourceUrls: value.sourceUrls, provenance: value.provenance, prescription: value.prescription, types: value.types,
    };
    setValidation('');
    onSave({ ...input, shares: parsedShares, sourceUrls: sources.split('\n').map(url => url.trim()).filter(Boolean) });
  };
  return <form onSubmit={submit} className="library-stack">
    {validation && <p className="error" role="alert">{validation}</p>}
    <fieldset disabled={busy} className="library-fieldset library-stack">
      <Field label={t('library.exerciseName')}><input required maxLength={140} value={value.name} onChange={event => patch({ name: event.target.value })} /></Field>
      <Field label={t('library.englishName')}><input maxLength={140} value={value.nameEn ?? ''} onChange={event => patch({ nameEn: event.target.value })} /></Field>
      <div className="library-filter-grid">
        <Field label={t('library.category')}><select value={value.category} onChange={event => patch({ category: event.target.value as Exercise['category'] })}>{(Object.keys(categories) as Exercise['category'][]).map(key => <option key={key} value={key}>{t(`exerciseCategory.${key}`)}</option>)}</select></Field>
        <Field label={t('library.doseUnit')}><select value={value.metric} onChange={event => patch({ metric: event.target.value as Exercise['metric'] })}>{(Object.keys(metrics) as Exercise['metric'][]).map(key => <option key={key} value={key}>{t(`metric.${key}`)}</option>)}</select></Field>
      </div>
      <fieldset className="library-fieldset"><legend className="library-legend">{t('library.types')}</legend><div className="library-types">{(Object.keys(exerciseTypes) as ExerciseType[]).map(key => <label className="choice" key={key}><input type="checkbox" checked={value.types?.includes(key as ExerciseType) ?? false} onChange={event => patch({ types: event.target.checked ? [...(value.types ?? []), key as ExerciseType] : value.types?.filter(type => type !== key) })} /><span>{t(`exerciseType.${key}`)}</span></label>)}</div></fieldset>
      <Field label={t('library.instructions')}><textarea value={value.notes} maxLength={3000} onChange={event => patch({ notes: event.target.value })} placeholder={t('library.instructionsPlaceholder')} /></Field>
      <Field label={t('library.cues')}><textarea value={value.cues ?? ''} maxLength={3000} onChange={event => patch({ cues: event.target.value })} /></Field>
      <Field label={t('library.variants')}><textarea value={value.variants ?? ''} maxLength={3000} onChange={event => patch({ variants: event.target.value })} /></Field>
      <details className="library-disclosure"><summary>{t('library.moreInfo')}</summary><div className="library-stack">
        <Field label={t('library.exampleDose')}><input value={value.prescription ?? ''} maxLength={500} onChange={event => patch({ prescription: event.target.value })} /></Field>
        <Field label={t('library.video')}><input type="url" maxLength={2000} value={value.video} onChange={event => patch({ video: event.target.value })} placeholder="https://…" /></Field>
        <Field label={t('library.sources')} hint={t('library.sourcesHint')}><textarea value={sources} onChange={event => setSources(event.target.value)} /></Field>
        <Field label={t('library.provenance')}><input value={value.provenance ?? ''} maxLength={1000} onChange={event => patch({ provenance: event.target.value })} /></Field>
        <Field label={t('library.instructionsEn')}><textarea value={value.notesEn ?? ''} maxLength={3000} onChange={event => patch({ notesEn: event.target.value })} /></Field>
        <Field label={t('library.cuesEn')}><textarea value={value.cuesEn ?? ''} maxLength={3000} onChange={event => patch({ cuesEn: event.target.value })} /></Field>
        <Field label={t('library.variantsEn')}><textarea value={value.variantsEn ?? ''} maxLength={3000} onChange={event => patch({ variantsEn: event.target.value })} /></Field>
      </div></details>
      <details className="library-disclosure"><summary>{t('library.shares')}</summary><div className="library-stack">
        <p className="library-muted">{t('library.sharesHint')}</p>
        {shares.map((share, index) => <div key={share.muscle} className="library-share-row">
          <Field label={t('library.muscle')}><select value={share.muscle} onChange={event => setShares(previous => previous.map((entry, i) => i === index ? { ...entry, muscle: event.target.value as Exercise['shares'][number]['muscle'] } : entry))}>{Object.entries(muscles).filter(([key]) => key === share.muscle || !shares.some(entry => entry.muscle === key)).map(([key]) => <option value={key} key={key}>{t(`muscle.${key as Exercise['shares'][number]['muscle']}`)}</option>)}</select></Field>
          <Field label={t('library.sharePercent')}><input type="number" inputMode="decimal" min="0" max="100" step="any" required value={share.percent} onChange={event => setShares(previous => previous.map((entry, i) => i === index ? { ...entry, percent: event.target.value } : entry))} /></Field>
          <button type="button" className="library-secondary" onClick={() => setShares(previous => previous.filter((_, i) => i !== index))}>{t('library.removeShare')}</button>
        </div>)}
        <button type="button" className="library-secondary" disabled={shares.length >= 20} onClick={() => {
          const muscle = (Object.keys(muscles) as Exercise['shares'][number]['muscle'][]).find(key => !shares.some(share => share.muscle === key));
          if (muscle) setShares(previous => [...previous, { muscle, percent: previous.length ? '0' : '100' }]);
        }}>{t('library.addShare')}</button>
      </div></details>
      <div className="library-actions"><button className="primary" type="submit">{t(busy ? 'library.saving' : 'library.saveExercise')}</button><button className="library-secondary" type="button" onClick={onCancel}>{t('library.cancel')}</button></div>
    </fieldset>
  </form>;
}

function ExerciseDetail({ exercise, note, busy, onNote, onDeleteNote, onEdit, onDuplicate, onArchive, onUse }: {
  exercise: Exercise; note?: Note; busy: boolean; onNote: (notes: string) => void; onDeleteNote: () => void; onEdit?: () => void; onDuplicate: () => void; onArchive?: () => void; onUse: () => void;
}) {
  const { t, language } = useI18n();
  const text = (field: 'notes' | 'cues' | 'variants') => exerciseText(exercise, field, language);
  // The English block is shown only for text the interface is not already displaying.
  const englishExtra = language !== 'en' || !isFactoryText(exercise, 'notes') || !isFactoryText(exercise, 'cues');
  const [notes, setNotes] = useState(note?.notes ?? '');
  const [confirmArchive, setConfirmArchive] = useState(false);
  const content = (title: string, text?: string) => text ? <section className="library-detail-part"><h3>{title}</h3><p className="library-preserve">{text}</p></section> : null;
  const links = [...new Set([exercise.video, ...(exercise.sourceUrls ?? [])].filter(url => /^https:\/\//i.test(url)))];
  return <div className="library-stack">
    <div className="library-actions"><button className="primary" disabled={busy} onClick={onUse}>{t('library.addToWorkout')}</button>{onEdit && <button className="library-secondary" disabled={busy} onClick={onEdit}>{t('library.editExercise')}</button>}<button className="library-secondary" disabled={busy} onClick={onDuplicate}>{t('library.ownCopy')}</button></div>
    <div className="card library-stack">
      {exercise.nameEn && exercise.nameEn !== exerciseName(exercise, language) && <p className="library-muted" lang="en">{exercise.nameEn}</p>}
      <p className="library-muted">{t('library.unit', { types: inferExerciseTypes(exercise).map(type => t(`exerciseType.${type}`)).join(' · '), unit: t(`metric.${exercise.metric}`) })}</p>
      {content(t('library.instructions'), text('notes'))}{content(t('library.cues'), text('cues'))}{content(t('library.variantsTitle'), text('variants'))}{content(t('library.exampleDose'), exercise.prescription)}
      {(!exercise.notes && !exercise.cues) && <p className="library-muted">{t('library.noInstructions')}</p>}
      {englishExtra && (exercise.notesEn || exercise.cuesEn || exercise.variantsEn) && <details className="library-disclosure"><summary>{t('library.englishDescription')}</summary><div lang="en">{content(t('library.enInstructions'), exercise.notesEn)}{content(t('library.enCues'), exercise.cuesEn)}{content(t('library.enVariants'), exercise.variantsEn)}</div></details>}
      {exercise.shares.length > 0 && <section><h3>{t('library.muscleShares')}</h3><ul className="library-source-list">{exercise.shares.map(share => <li key={share.muscle}>{t('library.shareValue', { muscle: t(`muscle.${share.muscle}`), percent: Math.round(share.weight * 100) })}</li>)}</ul></section>}
      {(links.length > 0 || exercise.provenance) && <section><h3>{t('library.sourcesTitle')}</h3>{exercise.provenance && <p className="library-preserve">{exerciseProvenance(exercise, language)}</p>}<ul className="library-source-list">{links.map((url, index) => <li key={url}><a href={url} target="_blank" rel="noopener noreferrer">{url === exercise.video ? t('library.videoLink', { host: new URL(url).hostname }) : t('library.sourceLink', { number: index + 1, host: new URL(url).hostname })}</a></li>)}</ul><p className="library-muted">{t('library.offlineHint')}</p></section>}
    </div>
    <form className="card library-stack" onSubmit={event => { event.preventDefault(); onNote(notes); }}><h3>{t('library.myNote')}</h3><p className="library-muted">{t('library.myNoteHint')}</p><fieldset disabled={busy} className="library-fieldset library-stack"><Field label={t('library.note')}><textarea maxLength={3000} value={notes} onChange={event => setNotes(event.target.value)} /></Field><div className="library-actions"><button className="primary" type="submit">{t(busy ? 'library.saving' : 'library.saveNote')}</button>{note && <button type="button" className="library-secondary" onClick={() => { onDeleteNote(); }}>{t('library.deleteNote')}</button>}</div></fieldset></form>
    {onArchive && <div className="card library-stack">{!confirmArchive ? <button className="library-danger" disabled={busy} onClick={() => setConfirmArchive(true)}>{t('library.archive')}</button> : <><h3>{t('library.archiveTitle')}</h3><p>{t('library.archiveText')}</p><div className="library-actions"><button className="library-danger" disabled={busy} onClick={onArchive}>{t('library.confirmArchive')}</button><button className="library-secondary" disabled={busy} onClick={() => setConfirmArchive(false)}>{t('library.cancel')}</button></div></>}</div>}
  </div>;
}

function TemplateEditor({ initial, exercises, exerciseRoles, sports, readonly, requireType, busy, onSave, onCancel, onDuplicate, onUse, onArchive }: {
  initial: TemplateInput; exercises: Exercise[]; exerciseRoles: LocalSnapshot['exerciseRoles']; sports: readonly SportId[]; readonly?: boolean; requireType?: boolean; busy: boolean;
  onSave: (value: TemplateInput) => void; onCancel: () => void; onDuplicate: (value: TemplateInput) => void; onUse: (value: TemplateInput) => void; onArchive?: () => void;
}) {
  const i18n = useI18n(), { t, language } = i18n;
  const [value, setValue] = useState(() => ({ ...copy(initial), sections: sectionsSchema.parse(initial.sections), supersets: (initial.supersets ?? []).map(group => supersetSchema.parse(group)) }));
  const patchPlan = (plan: { sections: TemplateSections; supersets: NonNullable<TemplateInput['supersets']> }) => setValue(previous => ({ ...previous, ...normalizeSupersets(plan) }));
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [addSection, setAddSection] = useState<Section>(initial.section === 'whole' ? 'main' : initial.section);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmScope, setConfirmScope] = useState<TemplateScope | null>(null);
  const [validation, setValidation] = useState('');
  const visibleExercises = exercises.filter(exercise => matches(exercise, query, type));
  const activeSections: Section[] = value.section === 'whole' ? ['warmup', 'main', 'cooldown'] : [value.section];
  const patchItem = (section: Section, id: string, dose: Dose) => setValue(previous => ({ ...previous, sections: { ...previous.sections, [section]: previous.sections[section].map(item => item.id === id ? { ...item, planned: dose } : item) } }));
  const setScope = (scope: TemplateScope) => {
    const next = copy(value.sections);
    if (scope !== 'whole') for (const section of ['warmup', 'main', 'cooldown'] as Section[]) if (section !== scope) next[section] = [];
    setValue(previous => ({ ...previous, section: scope, ...normalizeSupersets({ sections: next, supersets: previous.supersets }) })); setAddSection(scope === 'whole' ? 'main' : scope); setConfirmScope(null);
  };
  const useTemplate = () => {
    if (!sports.includes(value.sportId)) { setValidation(t('library.templateSportMissing')); return; }
    try { sectionsSchema.parse(value.sections); onUse(value); }
    catch (failure) { setValidation(describeError(failure)); }
  };
  return <form className="library-stack" onSubmit={event => { event.preventDefault(); if (requireType && !value.trainingType) { setValidation(t('library.kindRequired')); return; } setValidation(''); onSave(value); }}>
    {validation && <p className="error" role="alert">{validation}</p>}
    {readonly && <p className="library-muted">{t('library.builtinReadonly')}</p>}
    <fieldset className="library-fieldset library-stack" disabled={busy || readonly}>
      <Field label={t('library.templateName')}><input required maxLength={140} value={value.name} onChange={event => setValue(previous => ({ ...previous, name: event.target.value }))} /></Field>
      <TrainingTypeField value={value.trainingType} required={requireType} onChange={trainingType => setValue(previous => ({ ...previous, trainingType }))} /><div className="library-filter-grid"><Field label={t('library.sport')}><select required value={value.sportId} onChange={event => setValue(previous => ({ ...previous, sportId: event.target.value as SportId }))}><option value="">{t('library.chooseSport')}</option>{SPORTS.filter(sport => sports.includes(sport.id) || sport.id === value.sportId).map(sport => <option key={sport.id} value={sport.id}>{t(`sport.${sport.id}`)}</option>)}</select></Field><Field label={t('library.scope')}><select value={value.section} onChange={event => {
        const scope = event.target.value as TemplateScope;
        if (scope !== 'whole' && (['warmup', 'main', 'cooldown'] as Section[]).some(section => section !== scope && value.sections[section].length)) setConfirmScope(scope); else setScope(scope);
      }}>{scopes.map(key => <option value={key} key={key}>{t(`section.${key}`)}</option>)}</select></Field></div>
      {confirmScope && <div className="library-confirm"><p>{t('library.scopeChange', { scope: scopeName(confirmScope) })}</p><div className="library-actions"><button type="button" className="library-danger" onClick={() => setScope(confirmScope)}>{t('library.changeScope')}</button><button type="button" className="library-secondary" onClick={() => setConfirmScope(null)}>{t('library.cancelChange')}</button></div></div>}
      <Field label={t('library.templateNote')}><textarea maxLength={3000} value={value.notes ?? ''} onChange={event => setValue(previous => ({ ...previous, notes: event.target.value }))} /></Field>
    </fieldset>
    {activeSections.map(section => <section className="card library-stack" key={section}><h3>{t('library.scopeCount', { scope: scopeName(section), count: value.sections[section].length })}</h3>{!value.sections[section].length && <p className="library-muted">{t('library.emptySection')}</p>}<SupersetControls plan={value} section={section} allowedSections={activeSections} readOnly={busy || readonly} onChange={patchPlan} />{value.sections[section].map((item, index) => <div className={`library-template-item ${item.supersetId ? 'is-grouped' : ''}`} key={item.id}>
      <h3>{t('library.itemHeading', { label: itemLabel(value, section, item), name: exerciseName(item.exercise, language) })}</h3>
      {readonly ? <><p>{item.planned.sets === null && item.planned.quantity === null ? t('library.doseToComplete') : doseCount(i18n, item.planned, item.exercise.metric)}{item.planned.rir != null ? ` · ${t('dose.rir', { rir: item.planned.rir })}` : ''}</p>{[item.planned.prescription, item.planned.tempo && t('dose.tempo', { value: item.planned.tempo }), item.planned.rest && t('dose.rest', { value: item.planned.rest }), item.planned.effort].filter(Boolean).map((text, i) => <p className="library-muted" key={i}>{text}</p>)}</> : <fieldset className="library-fieldset library-stack" disabled={busy}><DoseEditor value={item.planned} exercise={item.exercise} trainingType={value.trainingType} grouped={!!item.supersetId} onChange={dose => patchItem(section, item.id, dose)} /><div className="library-actions"><button className="library-secondary" type="button" disabled={!!item.supersetId || index === 0} aria-label={t('library.moveUp', { name: exerciseName(item.exercise, language) })} onClick={() => setValue(previous => {
        return { ...previous, ...reorderPlanItem(previous, section, item.id, -1) };
      })}>{t('library.up')}</button><button className="library-secondary" type="button" disabled={!!item.supersetId || index === value.sections[section].length - 1} aria-label={t('library.moveDown', { name: exerciseName(item.exercise, language) })} onClick={() => setValue(previous => {
        return { ...previous, ...reorderPlanItem(previous, section, item.id, 1) };
      })}>{t('library.down')}</button><button className="library-danger" type="button" aria-label={t('library.removeNamed', { name: exerciseName(item.exercise, language) })} onClick={() => setValue(previous => ({ ...previous, ...normalizeSupersets({ sections: { ...previous.sections, [section]: previous.sections[section].filter(entry => entry.id !== item.id) }, supersets: previous.supersets }) }))}>{t('library.remove')}</button></div></fieldset>}
    </div>)}</section>)}
    {!readonly && <fieldset className="card library-fieldset library-stack" disabled={busy}><legend className="library-legend">{t('library.addToTemplate')}</legend><ExerciseFilters query={query} type={type} onQuery={setQuery} onType={setType} />{value.section === 'whole' && <Field label={t('library.targetSection')}><select value={addSection} onChange={event => setAddSection(event.target.value as Section)}>{(['warmup', 'main', 'cooldown'] as Section[]).map(section => <option value={section} key={section}>{t(`section.${section}`)}</option>)}</select></Field>}<Field label={t('library.exerciseResults', { count: visibleExercises.length })}><select value={visibleExercises.some(exercise => exercise.id === selectedExercise) ? selectedExercise : ''} onChange={event => setSelectedExercise(event.target.value)}><option value="">{t('library.chooseExercise')}</option>{visibleExercises.map(exercise => <option value={exercise.id} key={exercise.id}>{exerciseName(exercise, language)}{exercise.nameEn && exercise.nameEn !== exerciseName(exercise, language) ? ` · ${exercise.nameEn}` : ''}</option>)}</select></Field><button className="library-secondary" type="button" disabled={!visibleExercises.some(exercise => exercise.id === selectedExercise)} onClick={() => {
      const exercise = visibleExercises.find(entry => entry.id === selectedExercise); if (!exercise) return;
      const section = value.section === 'whole' ? addSection : value.section;
      setValue(previous => ({ ...previous, sections: { ...previous.sections, [section]: [...previous.sections[section], { id: uid(), muscleRoles: muscleRolesForExercise(exerciseRoles, exercise.id), exercise: exerciseSnapshot(exercise), planned: emptyDose(), supersetId: null, actual: null, athleteNotes: '' }] } }));
    }}>{t('library.addExercise')}</button></fieldset>}
    <div className="library-actions">{!readonly && <button className="primary" type="submit" disabled={busy}>{t(busy ? 'library.saving' : 'library.saveTemplate')}</button>}<button className={readonly ? 'primary' : 'library-secondary'} type="button" disabled={busy} onClick={useTemplate}>{t('library.applyToWorkout')}</button><button className="library-secondary" type="button" disabled={busy} onClick={() => { try { onDuplicate(value); } catch (failure) { setValidation(describeError(failure)); } }}>{t('library.createCopy')}</button><button className="library-secondary" type="button" disabled={busy} onClick={onCancel}>{t('library.backToTemplates')}</button></div>
    {onArchive && <div className="card library-stack">{confirmArchive ? <><p>{t('library.deleteTemplateText', { name: value.name })}</p><div className="library-actions"><button className="library-danger" type="button" disabled={busy} onClick={onArchive}>{t('library.confirmDelete')}</button><button className="library-secondary" type="button" disabled={busy} onClick={() => setConfirmArchive(false)}>{t('library.cancel')}</button></div></> : <button className="library-danger" type="button" disabled={busy} onClick={() => setConfirmArchive(true)}>{t('library.deleteTemplate')}</button>}</div>}
  </form>;
}

export function LibraryView({ repository, snapshot, onChanged, onStartWorkout, initialTab = 'exercises' }: LibraryViewProps) {
  const i18n = useI18n(), { t, language } = i18n;
  const [tab, setTab] = useState<'exercises' | 'templates'>(initialTab);
  const [screen, setScreen] = useState<Screen>({ kind: 'list' });
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [origin, setOrigin] = useState('all');
  const [templateQuery, setTemplateQuery] = useState('');
  const [sourceWorkout, setSourceWorkout] = useState('');
  const [sourceScope, setSourceScope] = useState<TemplateScope>('whole');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [refreshFailed, setRefreshFailed] = useState(false);
  const id = useId();
  const builtins = useMemo(() => getBuiltinExercises(), []);
  const builtinTemplates = useMemo(() => getBuiltinTemplates(), []);
  const custom = snapshot.customExercises.filter(exercise => !exercise.archivedAt);
  const exercises = [...custom, ...builtins];
  const templates = snapshot.templates;
  const profile = snapshot.profile;
  const sports = profile?.sportIds ?? [];
  const changeScreen = (next: Screen) => { setScreen(next); setError(''); window.scrollTo({ top: 0, behavior: 'instant' }); };
  const refresh = async () => {
    try { await onChanged(); setRefreshFailed(false); return true; } catch { setRefreshFailed(true); return false; }
  };
  const manualRefresh = async () => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true);
    try { if (await refresh()) changeScreen({ kind: 'list' }); }
    finally { busyRef.current = false; setBusy(false); }
  };
  const commit = async <T,>(action: () => Promise<T>, message: string, committed: (result: T) => void) => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(''); setSuccess('');
    try {
      const result = await action();
      // Only the repository result determines whether the write committed.
      setSuccess(message); committed(result);
      await refresh();
    } catch (failure) { setError(describeError(failure)); }
    finally { busyRef.current = false; setBusy(false); }
  };
  if (!profile) return <p className="empty-state">{t('library.needProfile')}</p>;
  const templateInput = (value: TemplateInput): TemplateInput => ({ profileId: profile.id, name: value.name, sportId: value.sportId, trainingType: value.trainingType ?? null, supersets: copy(value.supersets ?? []), section: value.section, sections: copy(value.sections), notes: value.notes ?? '' });
  const freshTemplate = (value?: TemplateInput): TemplateInput => value ? { ...templateInput(value), name: t('library.copyName', { name: value.name }).slice(0, 140), ...cloneTrainingPlan(value) } : { profileId: profile.id, name: '', sportId: sports.length === 1 ? sports[0] : '' as SportId, trainingType: null, supersets: [], section: 'whole', sections: emptySections(), notes: '' };
  const startTemplate = (template: TemplateInput, builtin = false) => onStartWorkout({ title: builtin ? builtinTemplateName(template.name, language) : template.name, sportId: template.sportId, trainingType: template.trainingType ?? null, status: 'planned', wasPlanned: true, ...cloneTrainingPlan(template), notes: template.notes ?? '' });
  const openExercise = (exercise: Exercise) => changeScreen({ kind: 'detail', exercise: exerciseSnapshot(exercise), custom: custom.find(entry => entry.id === exercise.id), note: snapshot.exerciseNotes.find(note => note.exerciseId === exercise.id), epoch: snapshot.epoch });
  const newExercise = (exercise?: Exercise) => changeScreen({ kind: 'exercise', initial: exercise ? { ...localizedExerciseCopy(exerciseSnapshot(exercise), language), id: uid(), name: t('library.copyName', { name: exerciseName(exercise, language) }).slice(0, 140) } : { id: uid(), name: '', category: 'strength', metric: 'kg', shares: [], video: '', notes: '', types: ['strength'] }, epoch: snapshot.epoch });
  const heading = screen.kind === 'exercise' ? screen.existing ? t('library.headingEditExercise') : t('library.headingOwnExercise') : screen.kind === 'detail' ? exerciseName(screen.exercise, language) : screen.kind === 'template' ? screen.readonly ? builtinTemplateName(screen.initial.name, language) : screen.existing ? t('library.headingEditTemplate') : t('library.headingNewTemplate') : t('library.title');
  return <div className="library-view">
    {screen.kind !== 'list' && <button className="back" disabled={busy} onClick={() => changeScreen({ kind: 'list' })}>{t('library.back')}</button>}
    <div className="page-heading"><div><p className="eyebrow">{t('library.eyebrow')}</p><h1>{heading}</h1>{screen.kind === 'list' && <p className="intro">{t('library.intro')}</p>}</div></div>
    {error && <div className="error" role="alert">{error}<button type="button" disabled={busy} onClick={() => { void manualRefresh(); }}>{t('library.refreshAndList')}</button></div>}
    {success && <p className="success" role="status">{success}</p>}
    {refreshFailed && <div className="library-confirm" role="status"><p>{t(success ? 'library.savedRefreshFailed' : 'library.refreshFailed')}</p><button type="button" className="library-secondary" disabled={busy} onClick={() => { void manualRefresh(); }}>{t('library.refreshView')}</button></div>}
    {screen.kind === 'list' && <>
      <div className="library-tabs" role="group" aria-label={t('library.part')}><button className={tab === 'exercises' ? 'primary' : 'library-secondary'} aria-pressed={tab === 'exercises'} onClick={() => setTab('exercises')}>{t('library.tabExercises')}</button><button className={tab === 'templates' ? 'primary' : 'library-secondary'} aria-pressed={tab === 'templates'} onClick={() => setTab('templates')}>{t('library.tabTemplates')}</button></div>
      {tab === 'exercises' ? <div className="library-stack">
        <button className="primary" onClick={() => newExercise()}>{t('library.newOwnExercise')}</button>
        <div className="card library-stack"><ExerciseFilters query={query} type={type} onQuery={setQuery} onType={setType} /><Field label={t('library.origin')}><select value={origin} onChange={event => setOrigin(event.target.value)}><option value="all">{t('library.originAll')}</option><option value="own">{t('library.originOwn')}</option><option value="builtin">{t('library.originBuiltin')}</option></select></Field></div>
        <p className="library-muted" role="status">{t('library.exerciseCount', { count: exercises.filter(exercise => matches(exercise, query, type) && (origin === 'all' || (origin === 'own' ? custom.some(entry => entry.id === exercise.id) : !custom.some(entry => entry.id === exercise.id)))).length })}</p>
        <ul className="library-list">{exercises.filter(exercise => matches(exercise, query, type) && (origin === 'all' || (origin === 'own' ? custom.some(entry => entry.id === exercise.id) : !custom.some(entry => entry.id === exercise.id)))).map(exercise => <li key={exercise.id}><button className="library-list-card" onClick={() => openExercise(exercise)}><span className="library-row-icon" aria-hidden="true"><Dumbbell size={20} strokeWidth={1.5}/></span><span className="library-row-copy"><strong>{exerciseName(exercise, language)}</strong>{exercise.nameEn && exercise.nameEn !== exerciseName(exercise, language) && <span lang="en">{exercise.nameEn}</span>}<small>{t('library.typesAndUnit', { types: inferExerciseTypes(exercise).map(type => t(`exerciseType.${type}`)).join(' · '), unit: t(`metric.${exercise.metric}`) })}</small><small>{t(custom.some(entry => entry.id === exercise.id) ? 'library.own' : 'library.builtin')}</small></span><ChevronRight size={16} strokeWidth={1.5} aria-hidden="true"/></button></li>)}</ul>
        {!exercises.some(exercise => matches(exercise, query, type) && (origin === 'all' || (origin === 'own' ? custom.some(entry => entry.id === exercise.id) : !custom.some(entry => entry.id === exercise.id)))) && <p className="empty-state">{t('library.noMatches')}</p>}
      </div> : <div className="library-stack">
        <button className="primary" onClick={() => changeScreen({ kind: 'template', initial: freshTemplate(), epoch: snapshot.epoch })}>{t('library.newTemplate')}</button>
        <div className="card library-stack"><Field label={t('library.searchTemplate')}><input type="search" value={templateQuery} onChange={event => setTemplateQuery(event.target.value)} /></Field></div>
        <h2>{t('library.myTemplates')}</h2>{!templates.length && <p className="empty-state">{t('library.templatesEmpty')}</p>}
        <ul className="library-list">{templates.filter(template => searchable(template.name).includes(searchable(templateQuery))).map(template => <li key={template.id}><button className="library-list-card" onClick={() => changeScreen({ kind: 'template', initial: { profileId: template.profileId, name: template.name, sportId: template.sportId, trainingType: template.trainingType ?? null, supersets: copy(template.supersets ?? []), section: template.section, sections: copy(template.sections), notes: template.notes }, existing: template, epoch: snapshot.epoch })}><strong>{template.name}</strong><span>{t('library.scopeCount', { scope: scopeName(template.section), count: Object.values(template.sections).flat().length })}</span><small>{t('library.typeAndSport', { type: template.trainingType ? trainingTypeLabel(i18n, template.trainingType) : t('training.kindUnset'), sport: t(`sport.${template.sportId}`) })}</small></button></li>)}</ul>
        <h2>{t('library.builtinTemplates')}</h2><ul className="library-list">{builtinTemplates.filter(template => searchable(`${template.name} ${builtinTemplateName(template.name, language)}`).includes(searchable(templateQuery))).map((template, index) => <li key={`${template.name}-${index}`}><button className="library-list-card" onClick={() => changeScreen({ kind: 'template', initial: templateInput(template), readonly: true, epoch: snapshot.epoch })}><strong>{builtinTemplateName(template.name, language)}</strong><span>{t('library.scopeCount', { scope: scopeName(template.section), count: Object.values(template.sections).flat().length })}</span><small>{t('library.builtinAndType', { type: template.trainingType ? trainingTypeLabel(i18n, template.trainingType) : t('training.kindUnset') })}</small></button></li>)}</ul>
        <div className="card library-stack"><h2>{t('library.fromWorkout')}</h2><Field label={t('library.savedWorkout')}><select value={sourceWorkout} onChange={event => setSourceWorkout(event.target.value)}><option value="">{t('library.chooseWorkout')}</option>{snapshot.workouts.filter(workout => !workout.deletedAt).map(workout => <option value={workout.id} key={workout.id}>{t('library.workoutOption', { date: i18n.date(workout.date), title: workout.title })}</option>)}</select></Field><Field label={t('library.whatToSave')}><select value={sourceScope} onChange={event => setSourceScope(event.target.value as TemplateScope)}>{scopes.map(key => <option value={key} key={key}>{t(`section.${key}`)}</option>)}</select></Field><p className="library-muted">{t('library.fromWorkoutHint')}</p><button className="library-secondary" disabled={!snapshot.workouts.some(workout => workout.id === sourceWorkout && !workout.deletedAt)} onClick={() => {
          const workout = snapshot.workouts.find(entry => entry.id === sourceWorkout); if (!workout) return;
          const selected = emptySections(); for (const section of ['warmup', 'main', 'cooldown'] as Section[]) if (sourceScope === 'whole' || sourceScope === section) selected[section] = copy(workout.sections[section]);
          changeScreen({ kind: 'template', initial: { profileId: profile.id, name: (sourceScope === 'whole' ? workout.title : t('library.scopedName', { title: workout.title, scope: scopeName(sourceScope) })).slice(0, 140), sportId: workout.sportId, trainingType: workout.trainingType, section: sourceScope, ...cloneTrainingPlan(normalizeSupersets({ sections: selected, supersets: workout.supersets })), notes: '' }, epoch: snapshot.epoch });
        }}>{t('library.prepareTemplate')}</button></div>
      </div>}
    </>}
    {screen.kind === 'exercise' && <ExerciseEditor key={`${screen.initial.id}-${screen.existing?.revision ?? 'new'}`} initial={screen.initial} busy={busy} onCancel={() => changeScreen({ kind: 'list' })} onSave={input => {
      const next: ExerciseInput = { ...input, profileId: profile.id };
      void commit(() => screen.existing ? repository.updateExercise(screen.existing.id, screen.existing.revision, next, screen.epoch) : repository.createExercise(next, screen.epoch), t('library.exerciseSaved'), () => changeScreen({ kind: 'list' }));
    }} />}
    {screen.kind === 'detail' && <ExerciseDetail key={`${screen.exercise.id}-${screen.note?.revision ?? 'none'}`} exercise={screen.exercise} note={screen.note} busy={busy}
      onEdit={screen.custom ? () => changeScreen({ kind: 'exercise', initial: screen.exercise, existing: screen.custom, epoch: screen.epoch }) : undefined}
      onDuplicate={() => newExercise(screen.exercise)}
      onUse={() => onStartWorkout({ title: exerciseName(screen.exercise, language), sportId: sports.length === 1 ? sports[0] : undefined, trainingType: null, supersets: [], status: 'planned', wasPlanned: true, sections: { ...emptySections(), main: [{ id: uid(), muscleRoles: muscleRolesForExercise(snapshot.exerciseRoles, screen.exercise.id), exercise: copy(screen.exercise), planned: emptyDose(), supersetId: null, actual: null, athleteNotes: '' }] } })}
      onArchive={screen.custom ? () => { void commit(() => repository.deleteExercise(screen.custom!.id, screen.custom!.revision, screen.epoch), t('library.exerciseArchived'), () => changeScreen({ kind: 'list' })); } : undefined}
      onNote={notes => {
        const input = { profileId: profile.id, exerciseId: screen.exercise.id, notes };
        void commit(() => screen.note ? repository.updateExerciseNote(screen.note.id, screen.note.revision, input, screen.epoch) : repository.createExerciseNote(input, screen.epoch), t('library.noteSaved'), note => setScreen({ ...screen, note }));
      }}
      onDeleteNote={() => { if (!screen.note) return; void commit(() => repository.deleteExerciseNote(screen.note!.id, screen.note!.revision, screen.epoch), t('library.noteDeleted'), () => setScreen({ ...screen, note: undefined })); }}
    />}
    {screen.kind === 'template' && <TemplateEditor key={`${screen.existing?.id ?? id}-${screen.epoch}-${screen.initial.name}-${screen.readonly ? 'builtin' : 'own'}`} initial={screen.initial} exercises={exercises} exerciseRoles={snapshot.exerciseRoles} sports={sports} busy={busy} readonly={screen.readonly} requireType={!screen.existing && !screen.readonly} onCancel={() => { setTab('templates'); changeScreen({ kind: 'list' }); }} onUse={template => startTemplate(template, !!screen.readonly)} onDuplicate={value => changeScreen({ kind: 'template', initial: freshTemplate(screen.readonly ? { ...value, name: builtinTemplateName(value.name, language) } : value), epoch: snapshot.epoch })} onSave={input => {
      void commit(() => screen.existing ? repository.updateTemplate(screen.existing.id, screen.existing.revision, input, screen.epoch) : repository.createTemplate(input, screen.epoch), t('library.templateSaved'), () => { setTab('templates'); changeScreen({ kind: 'list' }); });
    }} onArchive={screen.existing ? () => { void commit(() => repository.deleteTemplate(screen.existing!.id, screen.existing!.revision, screen.epoch), t('library.templateDeleted'), () => { setTab('templates'); changeScreen({ kind: 'list' }); }); } : undefined} />}
  </div>;
}
