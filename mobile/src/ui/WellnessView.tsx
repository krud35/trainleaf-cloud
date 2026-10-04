import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import type { LocalSnapshot, Wellness, WellnessInput } from '../data/domain';
import type { LocalRepository } from '../data/repository';
import { today } from '../data/analytics';
import { dateLabel, Feedback, useAction } from './common';
import { slotQuestions, wellnessQuestions, wellnessResponseSchema, wellnessSlots, type WellnessAnswers, type WellnessMetric, type WellnessSlot } from '../../../lib/wellness';
import { currentTranslator, useI18n, type Translator } from '../i18n';
import { parseDecimal } from '../i18n/format';
import { AppError } from '../data/errors';
import './wellness.css';
import { RangeField } from './RangeField';
import { feelingLabels } from './scale-labels';
import { WellbeingTrends } from '../features/wellbeing/WellbeingTrends';
import { WellnessEntryDetail } from '../features/entry-details/WellnessEntryDetail';
import { insightPeriod, insightRanges, type InsightRange } from '../features/progress/summary';
import { currentCheckinDay, currentWellnessSlot } from '../features/shared/localTime';

export type WellnessViewProps = { repository: LocalRepository; snapshot: LocalSnapshot; onChanged: () => Promise<void>;
  initialMode?: 'trends' | 'new' | 'detail' | 'edit'; entryId?: string; onClose?: () => void;
  onSavedNotice?: (notice: string) => void; onRefreshError?: (message: string) => void;
  registerExitGuard?: (guard: (proceed: () => void) => void) => () => void };
type WellnessForm = { date: string; slot: WellnessSlot; answers: Partial<Record<WellnessMetric, string>>; notes: string };
/** One line with the recorded answers of an entry, in the current language. */
function answersSummary(i18n: Translator, answers: WellnessAnswers) {
  return (Object.keys(wellnessQuestions) as WellnessMetric[]).filter(metric => answers[metric] !== undefined).map(metric => metric === 'sleepHours'
    ? i18n.t('wellbeing.summaryHours', { label: i18n.t(`wellnessQuestion.label_${metric}`), value: i18n.n(answers[metric]!, 2) })
    : i18n.t('wellbeing.summaryScale', { label: i18n.t(`wellnessQuestion.label_${metric}`), value: answers[metric]!, max: wellnessQuestions[metric].max })).join(' · ');
}
const blankForm = (): WellnessForm => ({ date: currentCheckinDay(), slot: currentWellnessSlot(), answers: {}, notes: '' });
const formFrom = (record: Wellness): WellnessForm => ({ date: record.date, slot: record.slot, answers: Object.fromEntries(Object.entries(record.answers).map(([key, value]) => [key, String(value)])), notes: record.notes });

export function WellnessView({ repository, snapshot, onChanged, initialMode = 'trends', entryId, onClose, onSavedNotice, onRefreshError, registerExitGuard }: WellnessViewProps) {
  const i18n = useI18n(), { t } = i18n;
  const [startingRecord] = useState(() => entryId ? snapshot.wellness.find(record => record.id === entryId) ?? null : null);
  const [externalEntry] = useState(initialMode !== 'trends');
  const [mode, setMode] = useState<'trends' | 'form' | 'detail'>(() => initialMode === 'new' || initialMode === 'edit' && startingRecord ? 'form' : initialMode === 'detail' && startingRecord ? 'detail' : 'trends');
  const [detail, setDetail] = useState<Wellness | null>(startingRecord);
  const [form, setForm] = useState<WellnessForm>(() => initialMode !== 'new' && startingRecord ? formFrom(startingRecord) : blankForm());
  const [editing, setEditing] = useState<Wellness | null>(() => initialMode !== 'new' && startingRecord ? structuredClone(startingRecord) : null);
  const [epoch, setEpoch] = useState(snapshot.epoch);
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);
  const [pending, setPending] = useState<(() => void) | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ record: Wellness; epoch: number } | null>(null);
  const [range, setRange] = useState<InsightRange | 'all' | 'custom'>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState(today());
  const [slotFilter, setSlotFilter] = useState<WellnessSlot | ''>('');
  const action = useAction();
  const headingId = useId();
  const formHeading = useRef<HTMLHeadingElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const existing = snapshot.wellness.find(record => record.date === form.date && record.slot === form.slot);
  const history = snapshot.wellness.filter(record => record.date <= today() && (!from || record.date >= from) && (!to || record.date <= to) && (!slotFilter || record.slot === slotFilter)).sort((a, b) => b.date.localeCompare(a.date) || wellnessSlots.indexOf(b.slot) - wellnessSlots.indexOf(a.slot));
  const invalidRange = !!from && !!to && from > to;

  function markDirty() { dirtyRef.current = true; setDirty(true); }
  function markClean() { dirtyRef.current = false; setDirty(false); }
  function update<K extends keyof WellnessForm>(key: K, value: WellnessForm[K]) { setForm(current => ({ ...current, [key]: value })); markDirty(); }
  function setAnswer(metric: WellnessMetric, value: string) { setForm(current => ({ ...current, answers: { ...current.answers, [metric]: value } })); markDirty(); }
  function guarded(change: () => void) { if (dirtyRef.current) setPending(() => change); else change(); }
  function selectRecord(record: Wellness) {
    guarded(() => { setDetail(structuredClone(record)); setEditing(structuredClone(record)); setForm(formFrom(record)); setEpoch(snapshot.epoch); setMode('form'); markClean(); action.setError(''); action.setNotice(''); });
  }
  function newRecord() {
    guarded(() => { setEditing(null); setForm(blankForm()); setEpoch(snapshot.epoch); setMode('form'); markClean(); action.setError(''); action.setNotice(''); });
  }
  function selectSlot(slot: WellnessSlot) {
    if (slot === form.slot) return;
    guarded(() => { setForm(current => ({ ...current, slot, answers: {}, notes: '' })); markDirty(); });
  }
  useEffect(() => registerExitGuard?.(proceed => {
    if (dirtyRef.current) setPending(() => () => { markClean(); proceed(); }); else proceed();
  }), [registerExitGuard]);
  useEffect(() => {
    if (mode === 'form') { formHeading.current?.focus(); formHeading.current?.scrollIntoView({ block: 'start' }); }
  }, [mode]);
  useEffect(() => {
    function beforeExit(event: BeforeUnloadEvent) { if (dirtyRef.current) { event.preventDefault(); event.returnValue = ''; } }
    window.addEventListener('beforeunload', beforeExit);
    return () => window.removeEventListener('beforeunload', beforeExit);
  }, []);
  useEffect(() => {
    if (!pending && !deleteTarget) return;
    const previous = document.activeElement as HTMLElement | null;
    const controls = () => Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled)') ?? []);
    controls().at(-1)?.focus();
    function keys(event: KeyboardEvent) {
      if (event.key === 'Escape' && !action.busy) { setPending(null); setDeleteTarget(null); event.preventDefault(); }
      if (event.key !== 'Tab') return;
      const items = controls(); const first = items[0]; const last = items.at(-1);
      if (!items.length) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === first) { last?.focus(); event.preventDefault(); }
      else if (!event.shiftKey && document.activeElement === last) { first?.focus(); event.preventDefault(); }
    }
    document.addEventListener('keydown', keys);
    return () => { document.removeEventListener('keydown', keys); previous?.focus(); };
  }, [pending, deleteTarget, action.busy]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    let persisted = false;
    await action.run(async () => {
      if (!snapshot.profile) throw new AppError('profileRequired');
      if (!editing && existing) throw new AppError('wellnessExists');
      const answers: WellnessAnswers = {};
      for (const metric of slotQuestions[form.slot]) {
        const raw = form.answers[metric]?.trim();
        if (raw !== undefined && raw !== '') {
          const value = parseDecimal(raw) ?? Number.NaN;
          const question = wellnessQuestions[metric];
          if (!Number.isFinite(value) || value < question.min || value > question.max || Math.abs(value / question.step - Math.round(value / question.step)) > 0.000001) throw new AppError(metric === 'sleepHours' ? 'wellnessSleepStep' : 'wellnessValueRange', undefined, { label: currentTranslator().t(`wellnessQuestion.label_${metric}`), min: question.min, max: question.max });
          answers[metric] = value;
        }
      }
      wellnessResponseSchema.parse({ slot: form.slot, answers });
      const input: WellnessInput = { profileId: snapshot.profile.id, date: form.date, slot: form.slot, answers, notes: form.notes };
      const saved = editing ? await repository.updateWellness(editing.id, editing.revision, input, epoch) : await repository.createWellness(input, epoch);
      // This is already durable. A later history refresh must not imply a failed commit.
      setEditing(saved); setForm(formFrom(saved)); setDetail(saved); markClean(); setPending(null); setMode('trends'); action.setNotice(onSavedNotice ? '' : currentTranslator().t('wellbeing.saved'));
      persisted = true;
    });
    if (persisted) {
      try { await onChanged(); }
      catch { const message = currentTranslator().t('wellbeing.savedRefreshFailed'); action.setError(onRefreshError ? '' : message); onRefreshError?.(message); }
      onSavedNotice?.(currentTranslator().t('wellbeing.saved'));
      if (externalEntry) onClose?.();
    }
  }
  async function remove() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    let persisted = false;
    await action.run(async () => {
      await repository.deleteWellness(target.record.id, target.record.revision, target.epoch);
      setDeleteTarget(null);
      if (editing?.id === target.record.id) { setEditing(null); setForm(blankForm()); setEpoch(snapshot.epoch); setMode('trends'); markClean(); }
      action.setNotice(currentTranslator().t('wellbeing.deleted'));
      persisted = true;
    });
    if (persisted) {
      try { await onChanged(); }
      catch { action.setError(currentTranslator().t('wellbeing.deletedRefreshFailed')); }
    }
  }
  function setPreset(next: InsightRange | 'all') { setRange(next); setFrom(next === 'all' ? '' : insightPeriod(today(), next).start); setTo(next === 'all' ? '' : today()); }

  const closeForm = () => guarded(() => { setMode(detail && editing ? 'detail' : 'trends'); markClean(); if (externalEntry) onClose?.(); });
  return <section className="wellness-view wellbeing-view" aria-labelledby={mode === 'detail' ? undefined : headingId} aria-label={mode === 'detail' ? t('wellbeing.title') : undefined}>
    {mode !== 'detail' && <div className="page-heading"><div><h1 id={headingId}>{t('wellbeing.title')}</h1></div></div>}
    <Feedback error={action.error} notice={action.notice} />
    {mode === 'detail' && detail && <WellnessEntryDetail entry={detail} onEdit={() => selectRecord(detail)} onClose={() => { setMode('trends'); if (externalEntry) onClose?.(); }} />}
    {mode === 'form' && <form className="wv-form" onSubmit={submit}>
      <button className="back" type="button" disabled={action.busy} onClick={closeForm}>{t('wellbeing.backNoSave')}</button>
      <div className="wv-form-heading"><h2 ref={formHeading} tabIndex={-1}>{editing ? t('wellbeing.editing', { date: dateLabel(editing.date), slot: t(`wellnessSlot.${editing.slot}`) }) : t('wellbeing.newEntry')}</h2>{editing && <button className="wv-secondary" type="button" disabled={action.busy} onClick={newRecord}>{t('wellbeing.newEntry')}</button>}</div>
      <fieldset className="card wv-fields" disabled={action.busy}><legend className="sr-only">{t('wellbeing.dateAndSlot')}</legend><div className="wv-grid"><label className="field">{t('wellbeing.date')}<input type="date" required min="0001-01-01" max="9999-12-31" readOnly={!!editing} value={form.date} onChange={event => update('date', event.target.value)} /></label><label className="field">{t('wellbeing.slot')}<select aria-label={t('wellbeing.slot')} disabled={!!editing} value={form.slot} onChange={event => selectSlot(event.target.value as WellnessSlot)}>{wellnessSlots.map(slot => <option key={slot} value={slot}>{t(`wellnessSlot.${slot}`)}</option>)}</select></label></div>{editing && <p className="field-hint">{t('wellbeing.editingHint')}</p>}{!editing && existing && <div className="wv-existing"><p>{t('wellbeing.existsNote')}</p><button type="button" disabled={action.busy} onClick={() => selectRecord(existing)}>{t('wellbeing.openExisting')}</button></div>}</fieldset>
      <fieldset className="card wv-fields" disabled={action.busy}><legend>{t(`wellbeing.feel_${form.slot}`)}</legend>
        {slotQuestions[form.slot].map(metric => {
          const question = wellnessQuestions[metric];
          const raw = form.answers[metric];
          return <div className="wv-question" key={`${form.slot}-${metric}`}>{metric === 'sleepHours' ? <>
            <label className="field"><span>{t('wellbeing.hoursLabel', { label: t(`wellnessQuestion.label_${metric}`) })}</span><span className="wv-question-text">{t(`wellnessQuestion.question_${metric}`)}</span><input inputMode="decimal" value={raw ?? ''} placeholder={t('wellbeing.notSpecified')} aria-describedby={`${headingId}-${metric}-hint`} onChange={event => setAnswer(metric, event.target.value)} /></label>
            <p className="wv-scale-hint" id={`${headingId}-${metric}-hint`}>{t('wellbeing.sleepRange', { ends: t(`wellnessQuestion.ends_${metric}`) })}</p>
          </> : <RangeField label={t(`wellnessQuestion.label_${metric}`)} question={t(`wellnessQuestion.question_${metric}`)} min={question.min} max={question.max} value={raw === undefined || raw === '' ? null : Number(raw)} labels={feelingLabels(metric)} onChange={value => setAnswer(metric, value === null ? '' : String(value))} />}</div>;
        })}
        <label className="field">{t('wellbeing.note')} <span className="optional">{t('wellbeing.optional')}</span><textarea rows={3} maxLength={10000} value={form.notes} placeholder={t('wellbeing.notePlaceholder')} onChange={event => update('notes', event.target.value)} /></label>
      </fieldset>
      <p className="wv-unsaved" role="status">{t(dirty ? 'wellbeing.unsaved' : editing ? 'wellbeing.savedOnDevice' : 'wellbeing.savesOnButton')}</p>
      <button className="primary" type="submit" disabled={action.busy || !editing && !!existing}>{t(action.busy ? 'wellbeing.saving' : editing ? 'wellbeing.saveChanges' : 'wellbeing.save')}</button>
      {editing && <button className="wv-danger" type="button" disabled={action.busy} onClick={() => setDeleteTarget({ record: editing, epoch })}>{t('wellbeing.deleteThis')}</button>}
    </form>}
    {mode === 'trends' && <><WellbeingTrends records={snapshot.wellness} /><button className="primary wv-new-entry" type="button" onClick={newRecord}>{t('wellbeing.newCheckin')}</button>
    <section className="wv-history" aria-label={t('wellbeing.history')}><h2>{t('wellbeing.yourEntries')}</h2><div className="wv-range" role="group" aria-label={t('wellbeing.historyRange')}>{[...insightRanges, { id: 'all' as const }].map(value => <button type="button" aria-pressed={range === value.id} key={value.id} onClick={() => setPreset(value.id)}>{value.id === 'all' ? t('wellbeing.all') : t(`wellbeing.range_${value.id}`)}</button>)}</div><details className="wv-filters"><summary>{t('wellbeing.dateFilters')}</summary><div className="wv-fields"><div className="wv-grid"><label className="field">{t('wellbeing.fromDate')}<input type="date" value={from} onChange={event => { setFrom(event.target.value); setRange('custom'); }} /></label><label className="field">{t('wellbeing.toDate')}<input type="date" value={to} onChange={event => { setTo(event.target.value); setRange('custom'); }} /></label></div><label className="field">{t('wellbeing.slot')}<select value={slotFilter} onChange={event => setSlotFilter(event.target.value as WellnessSlot | '')}><option value="">{t('wellbeing.allSlots')}</option>{wellnessSlots.map(slot => <option key={slot} value={slot}>{t(`wellnessSlot.${slot}`)}</option>)}</select></label></div></details>
      {invalidRange ? <p className="error" role="alert">{t('wellbeing.invalidRange')}</p> : !history.length ? <div className="empty-state"><h3>{t('wellbeing.emptyTitle')}</h3><p>{t('wellbeing.emptyText')}</p></div> : <ol className="wv-history-list">{history.map(record => <li key={record.id}><button className="wv-record" type="button" onClick={() => { setDetail(structuredClone(record)); setMode('detail'); }}><span className="wv-record-heading"><strong>{t('wellbeing.recordHeading', { date: dateLabel(record.date), slot: t(`wellnessSlot.${record.slot}`) })}</strong><span aria-hidden="true">→</span></span><span className="wv-values">{answersSummary(i18n, record.answers)}</span><span className="sr-only">{t('wellbeing.openSummary')}</span></button></li>)}</ol>}
    </section></>}
    {(pending || deleteTarget) && <div className="wv-dialog" ref={dialog} role="dialog" aria-modal="true" aria-label={t(deleteTarget ? 'wellbeing.confirmDelete' : 'wellbeing.unsavedDialog')}><div className="card"><h2>{t(deleteTarget ? 'wellbeing.deleteTitle' : 'wellbeing.unsavedTitle')}</h2><p>{deleteTarget ? t('wellbeing.deleteText', { date: dateLabel(deleteTarget.record.date), slot: t(`wellnessSlot.${deleteTarget.record.slot}`) }) : t('wellbeing.unsavedText')}</p><div className="wv-actions"><button type="button" className="wv-danger" disabled={action.busy} onClick={() => { if (deleteTarget) void remove(); else { const next = pending; setPending(null); next?.(); } }}>{t(action.busy ? 'wellbeing.deleting' : deleteTarget ? 'wellbeing.deleteEntry' : 'wellbeing.discard')}</button><button type="button" disabled={action.busy} onClick={() => { setDeleteTarget(null); setPending(null); }}>{t('wellbeing.cancel')}</button></div></div></div>}
  </section>;
}
