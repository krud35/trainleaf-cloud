import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Capacitor } from '@capacitor/core';
import { SPORTS, SPORT_GROUPS, SHORTCUTS, type ShortcutId, type LocalSnapshot, type Profile, type ProfileInput } from '../data/domain';
import type { BackupPreview, LocalRepository } from '../data/repository';
import { snapshotCsv, today } from '../data/analytics';
import { exportTextFile } from '../platform/files';
import { dateLabel, Feedback, useAction } from './common';
import './settings.css';
import { ThemeControl } from '../features/theme/ThemeControl';
import { LanguageControl } from '../i18n/LanguageControl';
import { currentTranslator, useI18n } from '../i18n';
import { searchKey } from '../i18n/format';
import { AppError } from '../data/errors';

type Props = { repository: LocalRepository; snapshot: LocalSnapshot; onProfileSaved: (profile: Profile) => void; onRestored: () => Promise<void>; onOpenQuiz?: () => void };
const countKeys = ['workouts', 'customExercises', 'exerciseNotes', 'templates', 'periods', 'events', 'readinessReferences', 'exerciseRoles', 'muscleTargets', 'wellness', 'goals', 'drafts'] as const satisfies readonly (keyof BackupPreview['counts'])[];
const MAX_BACKUP_BYTES = 25 * 1024 * 1024;
type BackupCandidate = { name: string; text: string; preview: BackupPreview };

export function SettingsView({ repository, snapshot, onProfileSaved, onRestored, onOpenQuiz }: Props) {
  const { t } = useI18n();
  const [profile, setProfile] = useState(snapshot.profile);
  const [expectedRevision, setExpectedRevision] = useState(snapshot.profile?.revision);
  const [expectedEpoch] = useState(snapshot.epoch);
  const [name, setName] = useState(snapshot.profile?.displayName ?? '');
  const [sports, setSports] = useState<ProfileInput['sportIds']>(snapshot.profile?.sportIds ?? ['ultimate']);
  const [shortcuts,setShortcuts] = useState<ShortcutId[]>(snapshot.profile?.visibleShortcuts ?? [...SHORTCUTS]);
  const [sportQuery, setSportQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<string[]>(() => SPORT_GROUPS.filter(group => !snapshot.profile || SPORTS.some(sport => sport.group === group.id && snapshot.profile?.sportIds.includes(sport.id))).map(group => group.id));
  const normalizedQuery = searchKey(sportQuery.trim());
  const matchingSports = SPORTS.filter(sport => searchKey(t(`sport.${sport.id}`)).includes(normalizedQuery));
  const action = useAction();
  const quiz = snapshot.trainingQuizzes[0] ?? null;
  function toggle<T,>(items: T[], value: T) { return items.includes(value) ? items.filter(item => item !== value) : [...items, value]; }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    let committed: Profile | null = null;
    await action.run(async () => {
      if (!sports.length) throw new AppError('sportRequired');
      const saved = await repository.saveProfile({ displayName: name, sportIds: sports, modules:profile?.modules??['journal'], visibleShortcuts:shortcuts, roles: profile?.roles ?? ['athlete'] }, expectedRevision, expectedEpoch);
      setProfile(saved); setExpectedRevision(saved.revision); setName(saved.displayName);
      action.setNotice(currentTranslator().t(profile ? 'app.profileSaved' : 'settings.profileReady'));
      committed = saved;
      if (!Capacitor.isNativePlatform()) void navigator.storage?.persist?.().catch(() => false);
    });
    if (committed) onProfileSaved(committed);
  }
  return <section className="stack settings-view">
    <div className="page-heading"><div><p className="eyebrow">{t(profile ? 'settings.eyebrowProfile' : 'settings.eyebrowNew')}</p><h1>{t(profile ? 'settings.titleProfile' : 'settings.titleNew')}</h1><p className="intro">{t(profile ? 'settings.introProfile' : 'settings.introNew')}</p></div></div>
    <Feedback error={action.error} notice={action.notice} />
    <LanguageControl/>
    <ThemeControl/>
    <form className="form-layout" onSubmit={submit}>
      <fieldset className="card form-section" disabled={action.busy}><legend className="sr-only">{t('settings.profileNameLegend')}</legend><label className="field">{t('settings.nameLabel')}<input name="displayName" autoComplete="nickname" maxLength={80} value={name} onChange={event => setName(event.target.value)} placeholder={t('settings.namePlaceholder')} required /></label></fieldset>
      <fieldset className="card form-section sport-picker" disabled={action.busy}><legend>{t('settings.sportsLegend')}</legend><p className="field-hint">{t('settings.sportsHint')}</p><label className="field sport-search">{t('settings.findSport')}<input type="search" placeholder={t('settings.findSportPlaceholder')} value={sportQuery} onChange={event => setSportQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') event.preventDefault(); }}/></label><p className="sport-count" role="status">{normalizedQuery ? t('settings.selectedCountResults', { count: sports.length, results: matchingSports.length }) : t('settings.selectedCount', { count: sports.length })}</p><div className="sport-groups">{SPORT_GROUPS.map(group => { const visible = matchingSports.filter(sport => sport.group === group.id); const open = normalizedQuery ? visible.length > 0 : expandedGroups.includes(group.id); return <section className="sport-group" key={group.id} hidden={!visible.length}><button type="button" className="sport-group-toggle" aria-expanded={open} aria-controls={`sports-${group.id}`} onClick={() => { if (!normalizedQuery) setExpandedGroups(toggle(expandedGroups, group.id)); }}><span>{t(`sportGroup.${group.id}`)}</span><small>{sports.filter(id => SPORTS.some(sport => sport.id === id && sport.group === group.id)).length || ''}</small><span aria-hidden="true">{open ? '−' : '+'}</span></button><div id={`sports-${group.id}`} className="sport-options" hidden={!open}>{SPORTS.filter(sport => sport.group === group.id).map(sport => <label key={sport.id} hidden={!visible.includes(sport)} className={sports.includes(sport.id) ? 'choice selected' : 'choice'}><input type="checkbox" checked={sports.includes(sport.id)} onChange={() => setSports(toggle(sports, sport.id))}/><span>{t(`sport.${sport.id}`)}</span></label>)}</div></section>; })}</div>{!matchingSports.length && <p className="field-hint">{t('settings.noSports')}</p>}</fieldset>
      <fieldset id="shortcuts-settings" className="card form-section module-picker" disabled={action.busy}><legend>{t('settings.shortcutsLegend')}</legend><p className="field-hint">{t('settings.shortcutsHint')}</p><div className="module-options">{SHORTCUTS.map(id => <label key={id} className="module-choice"><input type="checkbox" checked={shortcuts.includes(id)} onChange={() => setShortcuts(toggle(shortcuts, id))} /><span>{t(`shortcut.${id}`)}</span></label>)}</div></fieldset>
      <button className="primary" type="submit" disabled={action.busy}>{t(action.busy ? 'settings.saving' : profile ? 'settings.save' : 'settings.create')}</button>
    </form>
    {profile && onOpenQuiz && <section className="card quiz-settings" aria-labelledby="quiz-settings-heading"><h2 id="quiz-settings-heading">{t('quiz.settingsTitle')}</h2><p className="field-hint">{t('quiz.settingsHint')}</p><p>{quiz?.status === 'completed' ? t('quiz.settingsDone', { date: dateLabel(today(new Date(quiz.answeredAt))) }) : t(quiz ? 'quiz.settingsSkipped' : 'quiz.settingsMissing')}</p><button type="button" className="secondary" onClick={onOpenQuiz}>{t(quiz?.status === 'completed' ? 'quiz.settingsEdit' : 'quiz.settingsOpen')}</button></section>}
    <section className="card stack settings-privacy"><h2>{t('settings.yourData')}</h2><p>{t(Capacitor.isNativePlatform() ? 'settings.dataNative' : 'settings.dataBrowser')} {t('settings.dataBackupHint')}</p><p>{t('settings.version', { version: '0.4.1' })}</p></section>
    <BackupPanel repository={repository} onRestored={onRestored} />
  </section>;
}

function BackupPanel({ repository, onRestored }: Pick<Props, 'repository' | 'onRestored'>) {
  const i18n = useI18n(), { t } = i18n;
  const action = useAction();
  const [candidate, setCandidate] = useState<BackupCandidate | null>(null);
  const [accepted, setAccepted] = useState(false);
  const selectionVersion = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);
  async function exportJson() {
    await action.run(async () => {
      const text = await repository.exportBackup();
      action.setNotice(currentTranslator().msg(await exportTextFile(`trainleaf-backup-${today()}.json`, text, 'application/json;charset=utf-8')));
    });
  }
  async function exportCsv() {
    await action.run(async () => {
      const current = await repository.readSnapshot();
      action.setNotice(currentTranslator().msg(await exportTextFile(`trainleaf-journal-${today()}.csv`, snapshotCsv(current), 'text/csv;charset=utf-8')));
    });
  }
  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    const version = ++selectionVersion.current;
    setCandidate(null); setAccepted(false);
    action.setError(''); action.setNotice('');
    if (!file) return;
    await action.run(async () => {
      if (file.size > MAX_BACKUP_BYTES) throw new AppError('backupFileTooLarge');
      const text = await file.text();
      const preview = repository.previewBackup(text);
      if (version === selectionVersion.current) setCandidate({ name: file.name, text, preview });
    });
  }
  async function restore() {
    if (!candidate || !accepted) return;
    // These immutable strings are the exact validated contents displayed in the preview.
    const selected = candidate;
    let committed = false;
    await action.run(async () => {
      await repository.restoreBackup(selected.text);
      committed = true;
      setCandidate(null); setAccepted(false);
      if (fileInput.current) fileInput.current.value = '';
      action.setNotice(currentTranslator().t('settings.restored'));
    });
    if (!committed) return;
    try { await onRestored(); }
    catch { action.setError(currentTranslator().t('settings.restoredRefreshFailed')); }
  }
  return <section className="card stack" aria-labelledby="backup-heading">
    <h2 id="backup-heading">{t('settings.backupTitle')}</h2>
    <p className="field-hint">{t('settings.backupHintFormats')}</p>
    <p className="field-hint">{t('settings.backupHintPrivacy')}</p>
    <Feedback error={action.error} notice={action.notice} />
    <div className="actions"><button type="button" className="secondary" disabled={action.busy} onClick={() => void exportJson()}>{t('settings.exportJson')}</button><button type="button" className="secondary" disabled={action.busy} onClick={() => void exportCsv()}>{t('settings.exportCsv')}</button></div>
    <label className="field">{t('settings.chooseBackup')}<input type="file" ref={fileInput} accept=".json,application/json" disabled={action.busy} onChange={event => void selectFile(event)} /></label>
    {candidate && <div className="confirm-box stack"><h3>{t('settings.previewTitle')}</h3><p>{candidate.name}</p><p>{t('settings.previewSummary', { profile: candidate.preview.profileName ?? t('settings.noProfile'), version: candidate.preview.version, created: i18n.dateTime(candidate.preview.exportedAt) })}</p><dl className="count-list">{countKeys.map(key => <div key={key}><dt>{t(`settings.count_${key}`)}</dt><dd>{candidate.preview.counts[key]}</dd></div>)}<div><dt>{t('quiz.backupCount')}</dt><dd>{candidate.preview.counts.trainingQuizzes}</dd></div></dl><p>{t('settings.restoreWarning')}</p><label className="module-choice"><input type="checkbox" checked={accepted} disabled={action.busy} onChange={event => setAccepted(event.target.checked)} /><span>{t('settings.restoreAccept')}</span></label><div className="actions"><button type="button" className="primary" disabled={action.busy || !accepted} onClick={() => void restore()}>{t(action.busy ? 'settings.restoring' : 'settings.restore')}</button><button type="button" className="secondary" disabled={action.busy} onClick={() => { setCandidate(null); setAccepted(false); ++selectionVersion.current; if (fileInput.current) fileInput.current.value = ''; }}>{t('settings.cancelRestore')}</button></div></div>}
  </section>;
}



