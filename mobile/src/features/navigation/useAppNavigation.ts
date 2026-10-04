import { useRef, useState } from 'react';
import type { Draft, LocalSnapshot, ShortcutId, Workout, WorkoutInput } from '../../data/domain';
import { initialPlanningContext } from '../planning/context';
import { currentCheckinDay, currentWellnessSlot } from '../shared/localTime';

export type View = 'today' | 'planning' | 'library' | 'templates' | 'progress' | 'settings' | 'wellness' | 'more' | 'history';
type Editor = { key: string; workout: Workout | null; draft?: Draft | null; initial?: Partial<WorkoutInput> };
type WellnessRoute = { key: string; initialMode: 'trends' | 'new' | 'detail'; entryId?: string; returnTo: View };
/** Keeps the source view mounted and preserves its context while an entry is open. */
export function useAppNavigation(snapshot: LocalSnapshot) {
  const [view, setView] = useState<View>(snapshot.profile ? 'today' : 'settings');
  const [editor, setEditor] = useState<Editor | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [survey, setSurvey] = useState<{ workout: Workout; epoch: number } | null>(null);
  const [planning, setPlanning] = useState(initialPlanningContext);
  const [wellnessRoute, setWellnessRoute] = useState<WellnessRoute>({ key: 'initial', initialMode: 'trends', returnTo: 'more' });
  const returnPosition = useRef({ y: 0, element: null as HTMLElement | null });
  const capture = () => { returnPosition.current = { y: window.scrollY, element: document.activeElement instanceof HTMLElement ? document.activeElement : null }; };
  const top = () => window.scrollTo({ top: 0 });
  const restorePosition = () => requestAnimationFrame(() => {
    if (returnPosition.current.element?.isConnected) returnPosition.current.element.focus({ preventScroll: true });
    window.scrollTo({ top: returnPosition.current.y });
  });
  function navigate(next: View) {
    setEditor(null); setDetailId(null); setSurvey(null); setView(next); top();
    if (next === 'wellness') setWellnessRoute({ key: crypto.randomUUID(), initialMode: 'trends', returnTo: view });
  }
  function openWorkout(workout: Workout) { capture(); setDetailId(workout.id); top(); }
  function closeDetail() { setDetailId(null); restorePosition(); }
  function edit(workout: Workout) { if (!detailId) capture(); setEditor({ key: crypto.randomUUID(), workout }); top(); }
  function newWorkout(initial?: Partial<WorkoutInput>) { capture(); setDetailId(null); setEditor({ key: crypto.randomUUID(), workout: null, initial }); top(); }
  function openDraft(draft: Draft) { capture(); setDetailId(null); setEditor({ key: crypto.randomUUID(), workout: snapshot.workouts.find(w => w.id === draft.entityId) ?? null, draft }); top(); }
  function closeEditor() { setEditor(null); if (detailId) top(); else restorePosition(); }
  function openSurvey(workout: Workout) { if (!detailId) capture(); setSurvey({ workout, epoch: snapshot.epoch }); top(); }
  function closeSurvey() { setSurvey(null); if (detailId) top(); else restorePosition(); }
  function openTodayWellness() {
    const now = new Date();
    const latest = snapshot.wellness.filter(w => w.date === currentCheckinDay(now) && w.slot === currentWellnessSlot(now)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    capture(); setWellnessRoute({ key: crypto.randomUUID(), initialMode: latest ? 'detail' : 'new', entryId: latest?.id, returnTo: view }); setView('wellness'); top();
  }
  function closeWellness() { setView(wellnessRoute.returnTo); restorePosition(); }
  function shortcut(id: ShortcutId) {
    const destinations: Record<ShortcutId, View> = { history: 'history', library: 'library', templates: 'templates', wellness: 'wellness', goals: 'progress', periods: 'planning', backup: 'settings' };
    navigate(destinations[id]);
    if (id === 'periods') setPlanning(p => ({ ...p, view: 'season' }));
    if (id === 'backup' || id === 'goals') requestAnimationFrame(() => document.getElementById(id === 'backup' ? 'backup-heading' : 'goals-heading')?.scrollIntoView({ block: 'start' }));
  }
  return { view, setView, editor, setEditor, detailId, setDetailId, survey, setSurvey, planning, setPlanning, wellnessRoute, navigate, openWorkout, closeDetail, edit, newWorkout, openDraft, closeEditor, openSurvey, closeSurvey, openTodayWellness, closeWellness, shortcut };
}
