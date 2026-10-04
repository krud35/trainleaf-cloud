import { useCallback, useRef, useState } from 'react';
import { CalendarDays, ChartNoAxesCombined, Ellipsis, NotebookText, SlidersHorizontal } from 'lucide-react';
import { type LocalSnapshot, type TrainingQuizAnswers, type Workout } from './data/domain';
import { periodsForDate } from './data/analytics';
import type { LocalRepository } from './data/repository';
import { WorkoutEditor } from './ui/WorkoutEditor';
import { LibraryView } from './ui/LibraryView';
import { PlanningView } from './ui/PlanningView';
import { ProgressView } from './ui/ProgressView';
import { WellnessView } from './ui/WellnessView';
import { SettingsView } from './ui/SettingsView';
import { TodayView } from './ui/TodayView';
import { HistoryView } from './ui/HistoryView';
import { PostWorkoutSurvey } from './ui/PostWorkoutSurvey';
import { errorMessage, Feedback } from './ui/common';
import { useI18n } from './i18n';
import { MoreView } from './features/navigation/MoreView';
import { useAppNavigation, type View } from './features/navigation/useAppNavigation';
import { WorkoutEntryDetail } from './features/entry-details/WorkoutEntryDetail';
import { ReserveBar } from './features/readiness/ReserveBar';
import { TrainingQuiz } from './features/onboarding/TrainingQuiz';
import { MoveWorkoutDialog, type MoveRequest } from './features/readiness/MoveWorkoutDialog';
import { WeeklyMuscleMap } from './features/anatomy/WeeklyMuscleMap';
import { useAndroidBack, minimizeAndroid } from './platform/useAndroidBack';
import './ui/layout.css';

export function App({ repository, initialSnapshot }: { repository: LocalRepository; initialSnapshot: LocalSnapshot }) {
  const { t } = useI18n();
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const nav = useAppNavigation(snapshot);
  const [notice, setNotice] = useState(''), [error, setError] = useState('');
  const [eventId, setEventId] = useState<string | null>(null);
  const [move, setMove] = useState<MoveRequest | null>(null);
  const [manualQuiz, setManualQuiz] = useState(false);
  const [startedWithProfile] = useState(!!initialSnapshot.profile);
  const exitGuard = useRef<((proceed: () => void) => void) | null>(null);
  const registerExitGuard = useCallback((guard: (proceed: () => void) => void) => { exitGuard.current = guard; return () => { if (exitGuard.current === guard) exitGuard.current = null; }; }, []);
  const { view, editor, survey } = nav;
  const profile = snapshot.profile;
  const detail = snapshot.workouts.find(w => w.id === nav.detailId);
  // The quiz is offered once: until an answer or a "skipped" mark is stored. Settings can reopen it.
  const quizRecord = snapshot.trainingQuizzes[0] ?? null;
  const quizMode = !profile || editor || survey ? null : manualQuiz ? 'edit' as const : quizRecord ? null : startedWithProfile ? 'update' as const : 'new' as const;
  const overlay = !!(editor || survey || nav.detailId || quizMode);
  async function refresh() {
    try { const next = await repository.readSnapshot(); setSnapshot(next); if (!next.profile) nav.setView('settings'); return next; }
    catch (e) { setError(t('app.refreshFailed', { reason: errorMessage(e) })); throw e; }
  }
  async function answerQuiz(answers: TrainingQuizAnswers | null) {
    const saved = await repository.saveTrainingQuiz({ profileId: profile!.id, status: answers ? 'completed' : 'skipped', answers }, snapshot.epoch);
    setSnapshot(s => ({ ...s, trainingQuizzes: [saved] })); setManualQuiz(false); setError(''); setNotice(t(saved.status === 'completed' ? 'quiz.saved' : 'quiz.skipped'));
    window.scrollTo({ top: 0 });
    await refresh().catch(() => undefined);
  }
  function guarded(proceed: () => void) { if (exitGuard.current) exitGuard.current(proceed); else proceed(); }
  function navigate(next: View) { guarded(() => { nav.navigate(next); setNotice(''); setError(''); }); }
  useAndroidBack(() => {
    if (quizMode) {
      const back = document.querySelector<HTMLButtonElement>('.training-quiz .quiz-back');
      if (back && !back.disabled) back.click(); else if (quizMode === 'edit') setManualQuiz(false); else minimizeAndroid();
      return;
    }
    if (survey) { nav.closeSurvey(); return; }
    if (nav.detailId) { nav.closeDetail(); return; }
    const localBack = Array.from(document.querySelectorAll<HTMLButtonElement>('.view-frame .back:not(.view-back)')).find(button => button.getClientRects().length > 0);
    if (localBack) { if (!localBack.disabled) localBack.click(); return; }
    if (view === 'wellness') { guarded(nav.closeWellness); return; }
    if (view !== 'today') navigate('today'); else minimizeAndroid();
  });
  async function saved(workout: Workout) {
    const askSurvey = workout.status === 'completed' && editor?.workout?.status !== 'completed';
    const existing = !!editor?.workout;
    setSnapshot(s => ({ ...s, workouts: [...s.workouts.filter(w => w.id !== workout.id), workout] }));
    nav.setEditor(null); setNotice(t('app.workoutSaved'));
    if (existing) nav.setDetailId(workout.id);
    else { nav.setDetailId(null); nav.setView(workout.status === 'planned' ? 'planning' : 'today'); if (workout.status === 'planned') nav.setPlanning(p => ({ ...p, day: workout.date, seasonYear: Number(workout.date.slice(0, 4)), view: 'week' })); }
    try {
      const fresh = await refresh();
      if (askSurvey) { const durable = fresh.workouts.find(w => w.id === workout.id); if (durable) nav.setSurvey({ workout: durable, epoch: fresh.epoch }); }
    } catch { /* The workout is already committed; refresh provides a separate recovery action. */ }
    window.scrollTo({ top: 0 });
  }
  const mainView = ['today', 'planning', 'progress', 'more'].includes(view) ? view : 'more';
  return <div className="app-shell">
    <header className="app-header"><span className="brand"><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 27V14C13 8 8 6 3 6v9c0 7 5 11 13 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M16 27V14c3-6 8-8 13-8v9c0 7-5 11-13 12Z" fill="currentColor"/><path d="m7 12 9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg><span>Trainleaf<small>{t('app.tagline')}</small></span></span>{profile && !editor && !survey && !quizMode && <button type="button" className="app-settings" aria-label={t('app.openSettings')} onClick={() => navigate('settings')}><SlidersHorizontal size={21} strokeWidth={1.5} aria-hidden="true"/></button>}</header>
    <main><Feedback error={error} notice={notice}/>{error && <button className="secondary" onClick={() => { setError(''); void refresh().catch(() => undefined); }}>{t('app.retryRead')}</button>}
      {quizMode && profile ? <TrainingQuiz key={quizMode} mode={quizMode} initial={quizRecord?.answers ?? null} onSubmit={answerQuiz} onSkip={() => answerQuiz(null)} onCancel={() => setManualQuiz(false)}/> : editor && profile ? <WorkoutEditor key={editor.key} repository={repository} snapshot={snapshot} workout={editor.workout} draft={editor.draft} initial={editor.initial} onClose={() => { nav.closeEditor(); void refresh().catch(() => undefined); }} onSaved={w => void saved(w)}/> : survey ? <PostWorkoutSurvey key={`${survey.workout.id}-${survey.workout.revision}`} repository={repository} workout={survey.workout} epoch={survey.epoch} onClose={() => { nav.closeSurvey(); setNotice(t('app.surveyLater')); }} onSaved={workout => { setSnapshot(s => ({ ...s, workouts: s.workouts.map(w => w.id === workout.id ? workout : w) })); nav.closeSurvey(); setNotice(t('app.surveySaved')); void refresh().catch(() => undefined); }}/> : detail ? <WorkoutEntryDetail workout={detail} periods={periodsForDate(snapshot.periods, detail.date)} onClose={nav.closeDetail} onEdit={() => nav.edit(detail)} actions={detail.status === 'completed' ? <button className="secondary" onClick={() => nav.openSurvey(detail)}>{t('app.completeSurvey')}</button> : undefined}/> : nav.detailId ? <section className="stack"><p>{t('app.workoutUnavailable')}</p><button className="secondary" onClick={nav.closeDetail}>{t('app.back')}</button></section> : null}
      <div className="view-frame" hidden={overlay}>
        {profile && !['today', 'planning', 'progress', 'more'].includes(view) && <button className="back view-back" onClick={() => view === 'wellness' ? guarded(nav.closeWellness) : navigate('more')}>{view === 'wellness' && nav.wellnessRoute.returnTo === 'today' ? t('app.backToToday') : view === 'wellness' && nav.wellnessRoute.returnTo === 'progress' ? t('app.backToProgress') : t('app.backToMore')}</button>}
        {view === 'settings' && <SettingsView key={`${profile?.id ?? 'new'}-${snapshot.epoch}`} repository={repository} snapshot={snapshot} onProfileSaved={p => { setSnapshot(s => ({ ...s, profile: p })); nav.setView(profile ? 'more' : 'today'); setNotice(t('app.profileSaved')); }} onRestored={async () => { await refresh(); nav.setDetailId(null); setNotice(t('app.backupRestored')); }} onOpenQuiz={() => { setNotice(''); setManualQuiz(true); window.scrollTo({ top: 0 }); }}/>}
        {view === 'today' && profile && <TodayView snapshot={snapshot} onNew={nav.newWorkout} onEdit={nav.openWorkout} onSurvey={nav.openSurvey} onWellness={nav.openTodayWellness} onHistory={() => navigate('history')} onProgress={() => navigate('progress')} onPlan={() => navigate('planning')} onDraft={nav.openDraft} onOpenEvent={event => { nav.setPlanning(p => ({ ...p, day: event.start, seasonYear: Number(event.start.slice(0, 4)), view: 'week' })); setEventId(event.id); navigate('planning'); }}/>} 
        {view === 'history' && profile && <HistoryView snapshot={snapshot} onOpen={nav.openWorkout} onSurvey={nav.openSurvey}/>}
        {view === 'more' && profile && <MoreView profile={profile} onNavigate={id => { if (id === 'settings' || id === 'customize') { navigate('settings'); if (id === 'customize') requestAnimationFrame(() => document.getElementById('shortcuts-settings')?.scrollIntoView({ block: 'start' })); } else nav.shortcut(id); }}/>}
        {view === 'planning' && profile && <PlanningView repository={repository} snapshot={snapshot} onChanged={async () => { await refresh(); }} onEdit={nav.openWorkout} onNew={nav.newWorkout} context={nav.planning} onContextChange={nav.setPlanning} eventId={eventId} onEventClose={() => setEventId(null)} dayReadiness={day => <ReserveBar snapshot={snapshot} day={day}/>} weeklyAnatomy={<WeeklyMuscleMap snapshot={snapshot} repository={repository} week={nav.planning.day} onChanged={async () => { await refresh(); }} onOpenWorkout={nav.openWorkout}/>} onReschedule={(workout, date) => setMove({ workout: structuredClone(workout), date, epoch: snapshot.epoch, snapshot: structuredClone(snapshot) })}/>}
        {(view === 'library' || view === 'templates') && profile && <LibraryView key={view} initialTab={view === 'templates' ? 'templates' : 'exercises'} repository={repository} snapshot={snapshot} onChanged={async () => { await refresh(); }} onStartWorkout={nav.newWorkout}/>}
        {view === 'progress' && profile && <ProgressView repository={repository} snapshot={snapshot} onChanged={async () => { await refresh(); }} onWorkoutOpen={nav.openWorkout} onWellnessOpen={() => navigate('wellness')}/>}
        {view === 'wellness' && profile && <WellnessView key={nav.wellnessRoute.key} repository={repository} snapshot={snapshot} initialMode={nav.wellnessRoute.initialMode} entryId={nav.wellnessRoute.entryId} onClose={nav.wellnessRoute.initialMode === 'trends' ? undefined : nav.closeWellness} onSavedNotice={setNotice} onRefreshError={setError} registerExitGuard={registerExitGuard} onChanged={async () => { await refresh(); }}/>}
      </div>
    </main>
    {move && <MoveWorkoutDialog request={move} repository={repository} onClose={() => setMove(null)} onSaved={async workout => { setMove(null); nav.setPlanning(p => ({ ...p, day: workout.date, seasonYear: Number(workout.date.slice(0, 4)) })); setNotice(t('app.workoutMoved')); await refresh(); }}/>} 
    {profile && !editor && !survey && !quizMode && <nav className="mobile-nav" aria-label={t('app.mainNavigation')}>{[{ id: 'today', name: t('app.navToday'), Icon: NotebookText }, { id: 'planning', name: t('app.navPlan'), Icon: CalendarDays }, { id: 'progress', name: t('app.navProgress'), Icon: ChartNoAxesCombined }, { id: 'more', name: t('app.navMore'), Icon: Ellipsis }].map(({ id, name, Icon }) => <button key={id} aria-current={mainView === id ? 'page' : undefined} onClick={() => navigate(id as View)}><span className="nav-icon"><Icon size={22} strokeWidth={1.5} aria-hidden="true"/></span><span>{name}</span></button>)}</nav>}
  </div>;
}



