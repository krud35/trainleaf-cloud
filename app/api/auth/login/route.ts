import { z } from 'zod';
import { database, loadState } from '@/lib/storage';
import { AUTH_HEADERS, AuthError, SESSION_SECONDS, assertProfileAvailable, assertSameOrigin, authFailure, coachOwner, consumeLoginBudget, digest, publicSession, randomToken, readJson, sessionCookie, sessionToken, usernameSchema, verifyPassword, type Account } from '@/lib/auth';
export const dynamic = 'force-dynamic';
const loginSchema = z.object({ username: usernameSchema, password: z.string().min(1).max(128) }).strict();
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const raw = await readJson(request, 4096);
    const owner = coachOwner();
    const username = typeof (raw as Record<string, unknown>)?.username === 'string' ? String((raw as Record<string, unknown>).username).trim().toLowerCase().slice(0, 128) : '';
    await consumeLoginBudget(request, username, owner);
    const parsed = loginSchema.safeParse(raw);
    if (!parsed.success) throw new AuthError(401, 'Nieprawidłowy login lub hasło.');
    const account = await database().prepare('SELECT id, owner, profile_id, username, password_hash, password_version, disabled, created_at, updated_at FROM athlete_accounts WHERE owner = ? AND username = ?').bind(owner, parsed.data.username).first<Account>();
    const valid = await verifyPassword(parsed.data.password, account?.password_hash || '');
    if (!valid || !account || account.disabled) throw new AuthError(401, 'Nieprawidłowy login lub hasło.');
    const snapshot = await loadState(owner), { state } = snapshot;
    // Only after a correct password: a quarantined profile locks its account instead of falling back.
    await assertProfileAvailable(snapshot, owner, account.profile_id);
    if (!state.profiles.some(p => p.id === account.profile_id)) throw new AuthError(401, 'Nieprawidłowy login lub hasło.');
    const token = randomToken(), tokenHash = await digest(token), now = Date.now(), expiresAt = now + SESSION_SECONDS * 1000;
    // Conditional insert closes the password-reset/login race.
    const inserted = await database().prepare(`INSERT INTO athlete_sessions (token_hash, owner, account_id, account_version, created_at, expires_at) SELECT ?, owner, id, password_version, ?, ? FROM athlete_accounts WHERE id = ? AND owner = ? AND disabled = 0 AND password_version = ?`).bind(tokenHash, now, expiresAt, account.id, owner, account.password_version).run();
    if (!inserted.meta.changes) throw new AuthError(401, 'Nieprawidłowy login lub hasło.');
    const old = sessionToken(request);
    if (old) await database().prepare('DELETE FROM athlete_sessions WHERE token_hash = ? AND owner = ?').bind(await digest(old), owner).run();
    return Response.json({ success: true, ...await publicSession({ role: 'athlete', owner, profileId: account.profile_id, accountId: account.id, accountVersion: account.password_version, sessionHash: tokenHash, expiresAt }) }, { headers: { ...AUTH_HEADERS, 'Set-Cookie': sessionCookie(token) } });
  } catch (error) { return authFailure(error); }
}
