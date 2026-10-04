import { env } from 'cloudflare:workers';
import { z } from 'zod';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { database, loadState } from '@/lib/storage';
import type { State } from '@/lib/domain';
import { StateError } from '@/lib/state-recovery';
import { profileQuarantined } from '@/lib/state-store';

export const AUTH_HEADERS = { 'Cache-Control': 'private, no-store', Vary: 'Cookie' };
export const SESSION_COOKIE = '__Host-fieldwork_session';
export const SESSION_SECONDS = 24 * 60 * 60;
// OWASP Password Storage Cheat Sheet: PBKDF2-HMAC-SHA256, 600,000 iterations.
export const PASSWORD_ITERATIONS = 600_000;
export const usernameSchema = z.string().trim().toLowerCase().min(3).max(64).regex(/^[a-z0-9][a-z0-9._-]*$/, 'Login: 3–64 litery, cyfry, kropki, myślniki lub podkreślenia.');
export const passwordSchema = z.string().min(15, 'Hasło musi mieć co najmniej 15 znaków.').max(128, 'Hasło może mieć najwyżej 128 znaków.');
export class AuthError extends Error {
  constructor(public status: number, message: string, public code?: string) { super(message); }
}
// Stable machine-readable codes; clients must not parse the Polish messages.
const STATUS_CODES: Record<number, string> = { 400: 'invalid_input', 401: 'unauthenticated', 403: 'forbidden', 404: 'not_found', 409: 'conflict', 413: 'too_large', 415: 'unsupported_media_type', 429: 'rate_limited', 503: 'unavailable' };
export const PROFILE_REPAIR_MESSAGE = 'Dane Twojego profilu wymagają naprawy przez trenera. Skontaktuj się z trenerem.';
export type CoachAuth = { role: 'coach'; owner: string; displayName: string };
export type AthleteAuth = { role: 'athlete'; owner: string; accountId: string; accountVersion: number; profileId: string; sessionHash: string; expiresAt: number };
export type Auth = CoachAuth | AthleteAuth;
export type Account = { id: string; owner: string; profile_id: string; username: string; password_hash: string; password_version: number; disabled: number; created_at: number; updated_at: number };

export function coachOwner(): string {
  const owner = (env as unknown as Record<string, unknown>).FIELDWORK_COACH_USER_ID;
  // Never grant ownership to the first visitor or derive it from a mutable email.
  if (typeof owner !== 'string' || !owner.trim()) throw new AuthError(503, 'Logowanie jest chwilowo niedostępne.');
  return owner;
}
export function assertSameOrigin(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) throw new AuthError(403, 'Nieprawidłowe źródło żądania.');
  if (request.headers.get('sec-fetch-site') === 'cross-site') throw new AuthError(403, 'Nieprawidłowe źródło żądania.');
}
export async function readJson(request: Request, limit = 16_384): Promise<unknown> {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new AuthError(415, 'Wymagane dane JSON.');
  if (!request.body) throw new AuthError(400, 'Brak danych.');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > limit) { await reader.cancel(); throw new AuthError(413, 'Zbyt dużo danych.'); } chunks.push(value); }
    const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    try { return JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new AuthError(400, 'Nieprawidłowe dane JSON.'); }
  } finally { reader.releaseLock(); }
}
export function authFailure(error: unknown, options: { coach?: boolean } = {}) {
  if (error instanceof AuthError) return Response.json({ error: error.message, code: error.code || STATUS_CODES[error.status] || 'error' }, { status: error.status, headers: AUTH_HEADERS });
  // Damaged data is not an outage: retrying cannot help, the coach has to repair the document.
  // Only the coach receives rule paths/codes and the revision needed for a repair write.
  if (error instanceof StateError) return Response.json({ error: error.message, code: error.code, ...(options.coach ? { revision: error.revision, issues: error.issues, repair: '/api/state/repair' } : {}) }, { status: 500, headers: AUTH_HEADERS });
  // Do not log request bodies, credentials, hashes, tokens, or database exceptions.
  console.error('Fieldwork authentication or storage operation failed.');
  return Response.json({ error: 'Nie udało się wykonać operacji. Spróbuj ponownie.', code: 'storage_unavailable' }, { status: 503, headers: AUTH_HEADERS });
}
const hex = (bytes: Uint8Array) => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
function unhex(value: string) { return Uint8Array.from(value.match(/.{2}/g) || [], x => parseInt(x, 16)); }
export function randomToken() { return hex(crypto.getRandomValues(new Uint8Array(32))); }
export async function digest(value: string) { return hex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))); }

async function derivePassword(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const bytes = new TextEncoder().encode(password);
  try {
    const key = await crypto.subtle.importKey('raw', bytes, 'PBKDF2', false, ['deriveBits']);
    return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt as Uint8Array<ArrayBuffer>, iterations: PASSWORD_ITERATIONS }, key, 256));
  } catch (error) {
    // Some production Workers cap native PBKDF2 at 100k (workerd #1346/#7550).
    // Use the same standard algorithm/work factor, never a weakened hash.
    if (!(error instanceof Error) || !/iterations|iteration count|pbkdf2.*limit/i.test(error.message)) throw error;
    const [{ pbkdf2Async }, { sha256 }] = await Promise.all([import('@noble/hashes/pbkdf2.js'), import('@noble/hashes/sha2.js')]);
    return pbkdf2Async(sha256, bytes, salt, { c: PASSWORD_ITERATIONS, dkLen: 32, asyncTick: 10 });
  }
}
export async function hashPassword(password: string) {
  passwordSchema.parse(password);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2-sha256$${PASSWORD_ITERATIONS}$${hex(salt)}$${hex(await derivePassword(password, salt))}`;
}
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const match = /^pbkdf2-sha256\$600000\$([a-f0-9]{32})\$([a-f0-9]{64})$/.exec(stored);
  // Unknown accounts take the same password-derivation path as known accounts.
  const salt = unhex(match?.[1] || 'cfe2f456fbb4e511d1cd39543ed9c264');
  const expected = unhex(match?.[2] || '0'.repeat(64));
  const actual = await derivePassword(password, salt);
  let difference = 0; for (let i = 0; i < expected.length; i++) difference |= expected[i] ^ actual[i];
  return !!match && difference === 0;
}
export function sessionToken(request: Request): string | null {
  const found = (request.headers.get('cookie') || '').split(';').map(x => x.trim()).filter(x => x.startsWith(SESSION_COOKIE + '='));
  if (found.length !== 1) return null;
  const token = found[0].slice(SESSION_COOKIE.length + 1);
  return /^[a-f0-9]{64}$/.test(token) ? token : null;
}
export function sessionCookie(token: string, maxAge = SESSION_SECONDS) {
  return `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}
export async function getAuth(request: Request): Promise<Auth | null> {
  const owner = coachOwner();
  const token = sessionToken(request);
  if (token) {
    const sessionHash = await digest(token);
    const row = await database().prepare(`SELECT a.id, a.profile_id, a.password_version, s.expires_at FROM athlete_sessions s JOIN athlete_accounts a ON a.id = s.account_id AND a.owner = s.owner WHERE s.token_hash = ? AND s.owner = ? AND s.expires_at > ? AND a.disabled = 0 AND a.password_version = s.account_version`).bind(sessionHash, owner, Date.now()).first<{ id: string; profile_id: string; password_version: number; expires_at: number }>();
    if (row) return { role: 'athlete', owner, accountId: row.id, profileId: row.profile_id, accountVersion: row.password_version, sessionHash, expiresAt: row.expires_at };
    // An expired/revoked athlete session must not silently elevate into coach mode.
    return null;
  }
  const user = await getChatGPTUser();
  return user?.userId === owner ? { role: 'coach', owner, displayName: user.displayName } : null;
}
export async function requireCoach(request: Request): Promise<CoachAuth> {
  const auth = await getAuth(request);
  if (!auth) throw new AuthError(401, 'Zaloguj się, aby kontynuować.');
  if (auth.role !== 'coach') throw new AuthError(403, 'Ta czynność jest dostępna tylko dla trenera.');
  return auth;
}
export async function requireAthlete(request: Request): Promise<AthleteAuth> {
  const auth = await getAuth(request);
  if (!auth) throw new AuthError(401, 'Zaloguj się, aby kontynuować.');
  if (auth.role !== 'athlete') throw new AuthError(403, 'Ta czynność jest dostępna dla zawodnika.');
  return auth;
}
export async function publicSession(auth: Auth | null) {
  if (!auth) return { role: 'anonymous' as const };
  if (auth.role === 'coach') return { role: auth.role, displayName: auth.displayName };
  const snapshot = await loadState(auth.owner);
  await assertProfileAvailable(snapshot, auth.owner, auth.profileId);
  const profile = snapshot.state.profiles.find(p => p.id === auth.profileId);
  if (!profile) return { role: 'anonymous' as const };
  return { role: auth.role, profileId: profile.id, profileName: profile.name, displayName: profile.name, expiresAt: auth.expiresAt };
}
/** Fail closed: an account whose profile record is quarantined gets no data at all (never another profile's). */
export async function assertProfileAvailable(snapshot: { state: State; blockedProfiles?: string[] }, owner: string, profileId: string) {
  const missing = !snapshot.state.profiles.some(p => p.id === profileId);
  if (snapshot.blockedProfiles?.includes(profileId) || missing && await profileQuarantined(owner, profileId)) throw new AuthError(403, PROFILE_REPAIR_MESSAGE, 'profile_quarantined');
}

export function athleteState(state: State, profileId: string): State {
  const profile = state.profiles.find(p => p.id === profileId);
  if (!profile) throw new AuthError(401, 'Ten profil nie jest już dostępny.');
  const workouts = state.workouts.filter(w => w.profileId === profileId);
  const assigned = new Map(workouts.flatMap(w => Object.values(w.sections).flat().map(i => [i.exercise.id, i.exercise] as const)));
  // Historical snapshots remain accessible even if their catalog entry was removed.
  // Prefer the current catalog guidance whenever the assigned entry still exists.
  for (const exercise of state.exercises) if (assigned.has(exercise.id)) assigned.set(exercise.id, exercise);
  // Explicit projection: new coach-only collections must never become public by accident.
  return {
    version: state.version,
    profiles: [{ ...profile, notes: '', warmupId: '' }],
    exercises: [...assigned.values()],
    templates: [], workouts,
    fatigue: state.fatigue.filter(f => f.profileId === profileId),
    wellness: state.wellness.filter(w => w.profileId === profileId),
    periods: state.periods.filter(p => p.profileId === profileId),
    events: state.events.filter(e => e.profileId === profileId),
    exerciseNotes: state.exerciseNotes.filter(n => n.profileId === profileId),
  };
}

export async function consumeLoginBudget(request: Request, username: string, owner: string) {
  const now = Date.now(), windowMs = 15 * 60_000;
  // Only the platform-provided CF header is used; attacker-controlled X-Forwarded-For is ignored.
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  // Check the bounded global bucket first, so blocked requests cannot create
  // unbounded rows by cycling invented usernames or addresses.
  const scopes = [{ key: `login:global:${owner}`, max: 200 }, { key: `login:ip:${owner}:${ip}`, max: 50 }, { key: `login:account:${owner}:${username}`, max: 10 }];
  for (const scope of scopes) {
    const result = await database().prepare(`INSERT INTO auth_rate_limits (key, window_start, attempts) VALUES (?, ?, 1) ON CONFLICT(key) DO UPDATE SET window_start = CASE WHEN auth_rate_limits.window_start <= ? THEN excluded.window_start ELSE auth_rate_limits.window_start END, attempts = CASE WHEN auth_rate_limits.window_start <= ? THEN 1 ELSE auth_rate_limits.attempts + 1 END RETURNING attempts`).bind(await digest(scope.key), now, now - windowMs, now - windowMs).first<{ attempts: number }>();
    if (!result || result.attempts > scope.max) throw new AuthError(429, 'Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut.');
  }
  // Remove old rate buckets and expired sessions without storing IP/login strings.
  await database().batch([database().prepare('DELETE FROM auth_rate_limits WHERE window_start < ?').bind(now - 86_400_000), database().prepare('DELETE FROM athlete_sessions WHERE expires_at <= ?').bind(now)]);
}
