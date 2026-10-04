import { z } from 'zod';
import { loadState } from '@/lib/storage';
import { daySchema, doseSchema, stateSchema, type State } from '@/lib/domain';
import { AUTH_HEADERS, AuthError, assertProfileAvailable, assertSameOrigin, athleteState, authFailure, readJson, requireAthlete } from '@/lib/auth';
import { queueSheetsSync } from '@/lib/sheets-sync';
import { writeState } from '@/lib/state-store';
import {wellnessFields,wellnessResponseSchema} from '@/lib/wellness';
export const dynamic = 'force-dynamic';
const id = z.string().min(1).max(100).regex(/^[\w-]+$/);
const revision = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER - 1);
const notes = z.string().max(3000);
const eventFields = z.object({ id: id.optional(), title: z.string().trim().min(1).max(140), start: daySchema, end: daySchema, time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), kind: z.enum(['event', 'trip', 'competition']), location: z.string().max(300), notes }).strict().refine(e => e.start <= e.end, 'Koniec wydarzenia musi przypadać po początku.');
const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('workout'), revision, workoutId: id, status: z.enum(['planned', 'completed', 'skipped']), actualMinutes: z.number().finite().min(0).max(1440).nullable(), rpe: z.number().finite().min(0).max(10).nullable(), athleteNotes: notes, items: z.array(z.object({ id, actual: doseSchema.strict().nullable(), athleteNotes: notes.optional() }).strict()).max(220) }).strict(),
  z.object({ action: z.literal('fatigue'), revision, date: daySchema, value: z.number().int().min(0).max(10), notes }).strict(),
  z.object({ action:z.literal('wellness'), revision, date:daySchema, slot:wellnessFields.slot, answers:wellnessFields.answers, notes }).strict(),
  z.object({ action: z.literal('exercise-note'), revision, exerciseId: id, notes }).strict(),
  z.object({ action: z.literal('event'), revision, event: eventFields }).strict(),
  z.object({ action: z.literal('delete-event'), revision, eventId: id }).strict(),
]);

// Pure allowlist transformation, also exercised by the authorization regression tests.
function applyAthleteAction(state: State, profileId: string, raw: unknown): { state: State; revision: number } {
  const parsed = actionSchema.safeParse(raw);
  if (!parsed.success) throw new AuthError(400, parsed.error.issues[0]?.message || 'Nieprawidłowy zapis.');
  const input = parsed.data;
  if (!state.profiles.some(p => p.id === profileId)) throw new AuthError(401, 'Ten profil nie jest już dostępny.');
  const next = structuredClone(state);
  if (input.action === 'workout') {
    const workout = next.workouts.find(w => w.id === input.workoutId && w.profileId === profileId);
    if (!workout) throw new AuthError(404, 'Nie znaleziono treningu.');
    const items = Object.values(workout.sections).flat();
    if (new Set(input.items.map(i => i.id)).size !== input.items.length || input.items.some(i => !items.some(item => item.id === i.id))) throw new AuthError(400, 'Nieprawidłowe ćwiczenia w treningu.');
    workout.status = input.status; workout.actualMinutes = input.actualMinutes; workout.rpe = input.rpe; workout.athleteNotes = input.athleteNotes;
    for (const update of input.items) {
      const item = items.find(i => i.id === update.id)!;
      item.actual = update.actual;
      if (update.athleteNotes !== undefined) item.athleteNotes = update.athleteNotes;
    }
  } else if (input.action === 'fatigue') {
    const existing = next.fatigue.find(f => f.profileId === profileId && f.date === input.date);
    if (existing) { existing.value = input.value; existing.notes = input.notes; }
    else next.fatigue.push({ id: crypto.randomUUID(), profileId, date: input.date, value: input.value, notes: input.notes });
  } else if(input.action === 'wellness') {
    const existing=next.wellness.find(w=>w.profileId===profileId&&w.date===input.date&&w.slot===input.slot);
    const value={date:input.date,slot:input.slot,answers:input.answers,notes:input.notes,recordedBy:'athlete' as const};
    if(existing)Object.assign(existing,value);
    else next.wellness.push({...value,id:crypto.randomUUID(),profileId});
  } else if (input.action === 'exercise-note') {
    const assigned = next.workouts.some(w => w.profileId === profileId && Object.values(w.sections).flat().some(i => i.exercise.id === input.exerciseId));
    if (!assigned) throw new AuthError(404, 'Nie znaleziono ćwiczenia w Twoim planie.');
    const existing = next.exerciseNotes.find(n => n.profileId === profileId && n.exerciseId === input.exerciseId);
    if (existing) existing.notes = input.notes;
    else next.exerciseNotes.push({ id: crypto.randomUUID(), profileId, exerciseId: input.exerciseId, notes: input.notes });
  } else if (input.action === 'event') {
    if (input.event.id) {
      const existing = next.events.find(e => e.id === input.event.id && e.profileId === profileId && e.createdBy === 'athlete');
      if (!existing) throw new AuthError(404, 'Nie znaleziono Twojego wydarzenia.');
      Object.assign(existing, input.event);
    } else next.events.push({ ...input.event, id: crypto.randomUUID(), profileId, createdBy: 'athlete' });
  } else {
    if (!next.events.some(e => e.id === input.eventId && e.profileId === profileId && e.createdBy === 'athlete')) throw new AuthError(404, 'Nie znaleziono Twojego wydarzenia.');
    next.events = next.events.filter(e => e.id !== input.eventId);
  }
  const valid = stateSchema.safeParse(next);
  if (!valid.success) throw new AuthError(400, valid.error.issues[0]?.message || 'Sprawdź wpisane wartości.');
  return { state: valid.data, revision: input.revision };
}
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const auth = await requireAthlete(request);
    const raw = await readJson(request, 150_000);
    const snapshot = await loadState(auth.owner);
    await assertProfileAvailable(snapshot, auth.owner, auth.profileId);
    const next = applyAthleteAction(snapshot.state, auth.profileId, raw);
    if (snapshot.revision !== next.revision) throw new AuthError(409, 'Plan zmienił się od ostatniego odczytu. Odśwież go przed zapisaniem.', 'revision_conflict');
    const payload = JSON.stringify(next.state);
    if (new TextEncoder().encode(payload).length > 1_500_000) throw new AuthError(413, 'Plan osiągnął limit danych. Skontaktuj się z trenerem.');
    // Backup + quarantine of a degraded document are committed in the same batch as this CAS update.
    const written = await writeState(auth.owner, snapshot, next.state, { reason: 'athlete_write', guard: { sql: 'EXISTS (SELECT 1 FROM athlete_sessions s JOIN athlete_accounts a ON a.id = s.account_id AND a.owner = s.owner WHERE s.token_hash = ? AND s.owner = ? AND s.expires_at > ? AND a.disabled = 0 AND a.password_version = s.account_version AND a.profile_id = ?)', params: [auth.sessionHash, auth.owner, Date.now(), auth.profileId] } });
    if (!written) throw new AuthError(409, 'Plan lub dostęp do konta uległ zmianie. Odśwież dane i zaloguj się ponownie w razie potrzeby.', 'revision_conflict');
    await queueSheetsSync(auth.owner, [auth.profileId]);
    return Response.json({ state: athleteState(next.state, auth.profileId), revision: next.revision + 1 }, { headers: AUTH_HEADERS });
  } catch (error) { return authFailure(error); }
}
