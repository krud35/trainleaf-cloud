import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import { pbkdf2Sync } from 'node:crypto';
import ts from 'typescript';

// Real SQLite exercises the exact production authorization, CAS and revocation SQL.
// Only the platform identity and D1 transport are replaced; no live data is touched.
const require = createRequire(import.meta.url), root = path.resolve(import.meta.dirname, '..');
const sqlite = new DatabaseSync(':memory:');
sqlite.exec(`PRAGMA foreign_keys=ON;
CREATE TABLE planner_state (owner TEXT PRIMARY KEY, payload TEXT NOT NULL, revision INTEGER NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE athlete_accounts (id TEXT PRIMARY KEY, owner TEXT NOT NULL, profile_id TEXT NOT NULL, username TEXT NOT NULL, password_hash TEXT NOT NULL, password_version INTEGER NOT NULL, disabled INTEGER NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, UNIQUE(owner,profile_id), UNIQUE(owner,username));
CREATE TABLE athlete_sessions (token_hash TEXT PRIMARY KEY, owner TEXT NOT NULL, account_id TEXT NOT NULL REFERENCES athlete_accounts(id) ON DELETE CASCADE, account_version INTEGER NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL);
CREATE TABLE auth_rate_limits (key TEXT PRIMARY KEY, window_start INTEGER NOT NULL, attempts INTEGER NOT NULL);`);
sqlite.exec('CREATE TABLE sheet_connections (owner TEXT NOT NULL, profile_id TEXT NOT NULL, endpoint TEXT NOT NULL, secret TEXT NOT NULL, spreadsheet_id TEXT NOT NULL, auto_sync INTEGER NOT NULL DEFAULT 0, last_revision INTEGER, last_synced_at TEXT, last_error TEXT, PRIMARY KEY(owner,profile_id));');
// Recovery tables (backup + quarantine) come from the real migration.
sqlite.exec(fs.readFileSync(path.join(root, 'drizzle', '0002_state_recovery.sql'), 'utf8'));
const db = {
  prepare(sql) { return { sql, params: [], bind(...params) { this.params = params; return this; }, async first() { return sqlite.prepare(sql).get(...this.params) || null; }, async all() { return { results: sqlite.prepare(sql).all(...this.params) }; }, async run() { return { meta: { changes: Number(sqlite.prepare(sql).run(...this.params).changes) } }; } }; },
  async batch(statements) { sqlite.exec('BEGIN'); try { const results = []; for (const stmt of statements) results.push(/RETURNING\s/i.test(stmt.sql) ? { results: sqlite.prepare(stmt.sql).all(...stmt.params) } : await stmt.run()); sqlite.exec('COMMIT'); return results; } catch (error) { sqlite.exec('ROLLBACK'); throw error; } },
};
let platformUser = null, auth, domain, sheetsSync;
const backgroundJobs = [];
const env = { FIELDWORK_COACH_USER_ID: 'coach-owner', DB: db };
const storage = { database: () => db, async loadState(owner) { const row = sqlite.prepare('SELECT payload, revision FROM planner_state WHERE owner=?').get(owner); if (!row) throw Error('Missing state'); return { state: domain.stateSchema.parse(JSON.parse(row.payload)), revision: row.revision }; } };
function load(relative) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  const localRequire = name => name === 'cloudflare:workers' ? { env, waitUntil: job => backgroundJobs.push(job) } : name === '@/app/chatgpt-auth' ? { getChatGPTUser: async () => platformUser } : name === '@/lib/storage' ? storage : name === '@/lib/domain' ? domain : name === '@/lib/auth' ? auth : name === '@/lib/sheets-sync' ? sheetsSync : name === '@/lib/sheets-weeks' ? { buildWeeklySheets: () => [{ key: '2026-09-28', title: 'FW 2026-09-28', rows: [['test', '', '', '', '', '', '', '']], dayRows: [1], sectionRows: [] }] } : name.startsWith('.') ? load(path.relative(root,path.resolve(root,path.dirname(relative),name+'.ts'))) : name.startsWith('@/') ? load(name.slice(2)+'.ts') : require(name);
  new Function('require', 'module', 'exports', js)(localRequire, module, module.exports);
  return module.exports;
}
domain = load('lib/domain.ts'); auth = load('lib/auth.ts'); sheetsSync = load('lib/sheets-sync.ts');
const stateRoute = load('app/api/state/route.ts'), loginRoute = load('app/api/auth/login/route.ts'), logoutRoute = load('app/api/auth/logout/route.ts'), accountRoute = load('app/api/auth/athlete-account/route.ts'), athleteRoute = load('app/api/athlete/route.ts'), sessionRoute = load('app/api/auth/session/route.ts');
const sheetsRoute = load('app/api/sheets/route.ts');
const ex = { id: 'exercise-a', name: 'Assigned exercise', category: 'strength', metric: 'kg', shares: [{ muscle: 'quads', weight: 1 }], video: '', notes: 'Coach instruction' };
const otherEx = { ...ex, id: 'exercise-b', name: 'Another athlete only' };
const dose = { sets: 3, quantity: 5, kg: 20 };
const makeWorkout = (id, profileId, exercise) => ({ id, profileId, name: 'Session', date: '2026-10-03', time: '18:00', category: 'strength', status: 'planned', duration: 60, actualMinutes: null, rpe: null, notes: 'Coach instruction', athleteNotes: '', sections: { warmup: [], main: [{ id: id + '-item', exercise, planned: dose, actual: null, athleteNotes: '' }], cooldown: [] } });
const event = (id, profileId, createdBy) => ({ id, profileId, createdBy, title: id, start: '2026-10-03', end: '2026-10-03', time: '12:00', kind: 'trip', location: '', notes: '' });
const initial = domain.stateSchema.parse({ version: 1, profiles: [{ id: 'a', name: 'Athlete A', role: '', notes: 'PRIVATE coach note', warmupId: '' }, { id: 'b', name: 'Athlete B', role: '', notes: 'PRIVATE B', warmupId: '' }], exercises: [ex, otherEx], templates: [], workouts: [makeWorkout('wa', 'a', ex), makeWorkout('wb', 'b', otherEx)], fatigue: [{ id: 'fb', profileId: 'b', date: '2026-10-03', value: 8, notes: 'PRIVATE B' }], periods: [], events: [event('coach-event', 'a', 'coach'), event('b-event', 'b', 'athlete')], exerciseNotes: [{ id: 'nb', profileId: 'b', exerciseId: 'exercise-b', notes: 'PRIVATE B' }] });
sqlite.prepare('INSERT INTO planner_state VALUES (?,?,0,?)').run('coach-owner', JSON.stringify(initial), new Date().toISOString());
const origin = 'https://fieldwork.example';
function request(url, method = 'GET', body, cookie = '', extraHeaders = {}) { return new Request(origin + url, { method, headers: { Origin: origin, 'Content-Type': 'application/json', Cookie: cookie, 'cf-connecting-ip': '198.51.100.1', ...extraHeaders }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); }
async function call(route, method = 'GET', body, cookie = '', headers = {}) { const response = await route[method](request('/', method, body, cookie, headers)); return { response, status: response.status, data: await response.json() }; }

assert.equal((await call(stateRoute)).status, 401);
assert.equal((await call(sessionRoute)).data.role, 'anonymous');
platformUser = { userId: 'unrelated-chatgpt-user', displayName: 'Stranger' };
assert.equal((await call(stateRoute)).status, 401, 'Public ChatGPT sign-in is not coach registration');
assert.equal((await call(accountRoute)).status, 401);
platformUser = { userId: env.FIELDWORK_COACH_USER_ID, displayName: 'Coach' };
assert.equal((await call(sessionRoute)).data.role, 'coach');
assert.equal((await call(stateRoute)).data.state.profiles.length, 2);
const coachSnapshot = (await call(stateRoute)).data;
assert.equal((await call(stateRoute, 'PUT', coachSnapshot, '', { Origin: 'https://evil.example' })).status, 403);
assert.equal((await call(accountRoute, 'POST', { profileId: 'a', username: 'athlete.a', password: 'short' })).status, 400);
const password = 'One very long test passphrase!';
const configured = await call(accountRoute, 'POST', { profileId: 'a', username: 'Athlete.A', password });
assert.equal(configured.status, 200); assert.equal(configured.data.account.username, 'athlete.a');
const account = sqlite.prepare('SELECT * FROM athlete_accounts WHERE profile_id=?').get('a');
assert.match(account.password_hash, /^pbkdf2-sha256\$600000\$[a-f0-9]{32}\$[a-f0-9]{64}$/);
assert.equal(account.password_hash.includes(password), false);
const [, iterations, salt, expected] = account.password_hash.split('$');
assert.equal(pbkdf2Sync(password, Buffer.from(salt, 'hex'), Number(iterations), 32, 'sha256').toString('hex'), expected);
const originalDerive = crypto.subtle.deriveBits;
try { crypto.subtle.deriveBits = async () => { throw Error('PBKDF2 iteration counts above 100000 are not supported'); }; assert.equal(await auth.verifyPassword(password, account.password_hash), true, 'Workers fallback must match native PBKDF2 exactly'); }
finally { crypto.subtle.deriveBits = originalDerive; }
assert.equal((await call(accountRoute, 'POST', { profileId: 'b', username: 'athlete.a', password })).status, 409);
assert.equal(JSON.stringify((await call(accountRoute)).data).includes(expected), false);
platformUser = null;
const wrong = await call(loginRoute, 'POST', { username: 'athlete.a', password: 'incorrect password' });
const unknown = await call(loginRoute, 'POST', { username: 'unknown.user', password: 'incorrect password' });
assert.equal(wrong.status, 401); assert.deepEqual(wrong.data, unknown.data);
const login = await call(loginRoute, 'POST', { username: 'ATHLETE.A', password });
assert.equal(login.status, 200); assert.equal(login.data.role, 'athlete');
const setCookie = login.response.headers.get('set-cookie');
for (const flag of ['__Host-fieldwork_session=', 'HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/', 'Max-Age=86400']) assert.ok(setCookie.includes(flag));
const cookie = setCookie.split(';')[0], token = cookie.split('=')[1];
const sessionRow = sqlite.prepare('SELECT * FROM athlete_sessions').get();
assert.equal(sessionRow.token_hash, await auth.digest(token)); assert.notEqual(sessionRow.token_hash, token);
const athleteSnapshot = await call(stateRoute, 'GET', undefined, cookie);
assert.equal(athleteSnapshot.status, 200);
assert.deepEqual(athleteSnapshot.data.state.profiles.map(p => p.id), ['a']);
assert.equal(athleteSnapshot.data.state.profiles[0].notes, '');
assert.deepEqual(athleteSnapshot.data.state.exercises.map(e => e.id), ['exercise-a']);
assert.deepEqual(athleteSnapshot.data.state.workouts.map(w => w.id), ['wa']);
assert.equal(JSON.stringify(athleteSnapshot.data).includes('PRIVATE'), false);
assert.equal(athleteSnapshot.data.state.fatigue.length, 0);
assert.equal(athleteSnapshot.data.state.exerciseNotes.length, 0);
const historical = structuredClone(initial); historical.exercises = historical.exercises.filter(e => e.id !== 'exercise-a');
const historicalView = auth.athleteState(historical, 'a');
assert.deepEqual(historicalView.exercises.map(e => e.id), ['exercise-a'], 'Removed catalog entries survive as own assigned snapshots');
assert.equal(historicalView.exercises[0].name, ex.name);
historical.exercises.push({ ...ex, name: 'Updated current catalog guidance' });
assert.equal(auth.athleteState(historical, 'a').exercises[0].name, 'Updated current catalog guidance', 'Current catalog entry takes precedence over its older workout snapshot');
assert.equal((await call(stateRoute, 'PUT', coachSnapshot, cookie)).status, 403);
assert.equal((await call(sheetsRoute, 'GET', undefined, cookie)).status, 403);
assert.equal((await call(sheetsRoute, 'POST', { action: 'sync', profileId: 'a' }, cookie)).status, 403);
assert.equal((await call(accountRoute, 'POST', { profileId: 'b', username: 'attacker', password }, cookie)).status, 403);
await assert.rejects(() => auth.requireCoach(request('/', 'GET', undefined, cookie)), e => e.status === 403);
const completion = { action: 'workout', revision: 0, workoutId: 'wa', status: 'completed', actualMinutes: 50, rpe: 7, athleteNotes: 'My session notes', items: [{ id: 'wa-item', actual: { sets: 2, quantity: 5, kg: 20 }, athleteNotes: 'My item note' }] };
assert.equal((await call(athleteRoute, 'POST', { ...completion, profileId: 'b' }, cookie)).status, 400);
assert.equal((await call(athleteRoute, 'POST', { ...completion, workoutId: 'wb' }, cookie)).status, 404);
assert.equal((await call(athleteRoute, 'POST', { ...completion, items: [{ id: 'wa-item', actual: dose, planned: { ...dose, kg: 1 } }] }, cookie)).status, 400);
assert.equal((await call(athleteRoute, 'POST', { ...completion, items: [{ id: 'wb-item', actual: dose }] }, cookie)).status, 400);
const saved = await call(athleteRoute, 'POST', completion, cookie);
assert.equal(saved.status, 200); assert.equal(saved.data.revision, 1);
const full = await storage.loadState('coach-owner');
assert.deepEqual(full.state.workouts[0].sections.main[0].planned, dose);
assert.equal(full.state.workouts[0].notes, 'Coach instruction');
assert.equal(full.state.workouts[0].athleteNotes, 'My session notes');
assert.deepEqual(full.state.workouts[1], initial.workouts[1]);
assert.equal((await call(athleteRoute, 'POST', completion, cookie)).status, 409);
assert.equal((await call(athleteRoute, 'POST', { action: 'delete-event', revision: 1, eventId: 'coach-event' }, cookie)).status, 404);
assert.equal((await call(athleteRoute, 'POST', { action: 'delete-event', revision: 1, eventId: 'b-event' }, cookie)).status, 404);
assert.equal((await call(athleteRoute, 'POST', { action: 'exercise-note', revision: 1, exerciseId: 'exercise-b', notes: 'overwrite' }, cookie)).status, 404);
const myNote = await call(athleteRoute, 'POST', { action: 'exercise-note', revision: 1, exerciseId: 'exercise-a', notes: 'My progress' }, cookie);
assert.equal(myNote.status, 200); assert.equal(myNote.data.state.exerciseNotes[0].profileId, 'a');
const myEvent = { title: 'My trip', start: '2026-10-05', end: '2026-10-06', time: '10:00', kind: 'trip', location: 'Warsaw', notes: '' };
assert.equal((await call(athleteRoute, 'POST', { action: 'event', revision: 2, event: { ...myEvent, createdBy: 'coach' } }, cookie)).status, 400);
const added = await call(athleteRoute, 'POST', { action: 'event', revision: 2, event: myEvent }, cookie);
assert.equal(added.status, 200); assert.equal(added.data.state.events.at(-1).createdBy, 'athlete');
const removed = await call(athleteRoute, 'POST', { action: 'delete-event', revision: 3, eventId: added.data.state.events.at(-1).id }, cookie);
assert.equal(removed.status, 200);
const fatigue = await call(athleteRoute, 'POST', { action: 'fatigue', revision: 4, date: '2026-10-03', value: 3, notes: 'Good sleep' }, cookie);
assert.equal(fatigue.status, 200); assert.equal(fatigue.data.state.fatigue[0].profileId, 'a');
assert.equal((await storage.loadState('coach-owner')).state.fatigue.find(f => f.profileId === 'b').value, 8);
const wellnessInput={action:'wellness',revision:fatigue.data.revision,date:'2026-10-03',slot:'morning',answers:{sleepHours:7.5,fatigue:0},notes:'My morning'};
for(const patch of [{profileId:'b'},{id:'forged'},{recordedBy:'coach'},{slot:'daytime'},{answers:{}},{answers:{fatigue:11}},{answers:{readiness:90}}])assert.equal((await call(athleteRoute,'POST',{...wellnessInput,...patch},cookie)).status,400);
let wellnessSaved=await call(athleteRoute,'POST',wellnessInput,cookie);assert.equal(wellnessSaved.status,200);assert.equal(wellnessSaved.data.state.wellness[0].answers.fatigue,0);assert.equal(wellnessSaved.data.state.wellness[0].profileId,'a');assert.equal(wellnessSaved.data.state.wellness[0].recordedBy,'athlete');
assert.equal((await call(athleteRoute,'POST',wellnessInput,cookie)).status,409);
const wellnessId=wellnessSaved.data.state.wellness[0].id;
wellnessSaved=await call(athleteRoute,'POST',{...wellnessInput,revision:wellnessSaved.data.revision,answers:{fatigue:1}},cookie);assert.equal(wellnessSaved.status,200);assert.equal(wellnessSaved.data.state.wellness.length,1);assert.equal(wellnessSaved.data.state.wellness[0].id,wellnessId);
for(const [slot,answers] of [['daytime',{energy:4,mood:3}],['evening',{fatigue:6,recovery:3}]]){wellnessSaved=await call(athleteRoute,'POST',{...wellnessInput,revision:wellnessSaved.data.revision,slot,answers},cookie);assert.equal(wellnessSaved.status,200)}
assert.equal(wellnessSaved.data.state.wellness.length,3);
const wellnessIsolation=structuredClone((await storage.loadState('coach-owner')).state);wellnessIsolation.wellness.push({...wellnessIsolation.wellness[0],id:'wellness-b',profileId:'b',notes:'PRIVATE'});assert.ok(!JSON.stringify(auth.athleteState(wellnessIsolation,'a')).includes('PRIVATE'));assert.deepEqual(sheetsSync.changedProfileIds((await storage.loadState('coach-owner')).state,wellnessIsolation),['b']);
platformUser = { userId: env.FIELDWORK_COACH_USER_ID, displayName: 'Coach' };
const reset = await call(accountRoute, 'POST', { profileId: 'a', username: 'athlete.a', password: 'Another very long passphrase!' });
assert.equal(reset.status, 200);
assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM athlete_sessions').get().count, 0);
assert.equal((await call(stateRoute, 'GET', undefined, cookie)).status, 401, 'Revoked athlete cookie cannot silently grant platform coach mode');
platformUser = null;
assert.equal((await call(loginRoute, 'POST', { username: 'athlete.a', password })).status, 401);
const login2 = await call(loginRoute, 'POST', { username: 'athlete.a', password: 'Another very long passphrase!' });
assert.equal(login2.status, 200);
const cookie2 = login2.response.headers.get('set-cookie').split(';')[0];
assert.equal((await call(logoutRoute, 'POST', {}, cookie2)).status, 200);
assert.equal((await call(stateRoute, 'GET', undefined, cookie2)).status, 401);
const login3 = await call(loginRoute, 'POST', { username: 'athlete.a', password: 'Another very long passphrase!' });
assert.equal(login3.status, 200);
const cookie3 = login3.response.headers.get('set-cookie').split(';')[0];
sqlite.prepare('UPDATE athlete_sessions SET expires_at=?').run(Date.now() - 1);
assert.equal((await call(stateRoute, 'GET', undefined, cookie3)).status, 401, 'Expired sessions must be denied');
const login4 = await call(loginRoute, 'POST', { username: 'athlete.a', password: 'Another very long passphrase!' });
assert.equal(login4.status, 200);
const cookie4 = login4.response.headers.get('set-cookie').split(';')[0];
platformUser = { userId: env.FIELDWORK_COACH_USER_ID, displayName: 'Coach' };
assert.equal((await call(accountRoute, 'DELETE', { profileId: 'a' })).status, 200);
assert.equal((await call(stateRoute, 'GET', undefined, cookie4)).status, 401, 'Disabled accounts must lose existing sessions');
platformUser = null;
assert.equal((await call(loginRoute, 'POST', { username: 'athlete.a', password: 'Another very long passphrase!' })).status, 401);
for (let i = 0; i < 10; i++) { const r = await call(loginRoute, 'POST', { username: 'rate.test', password: 'not correct' }); assert.equal(r.status, 401); }
assert.equal((await call(loginRoute, 'POST', { username: 'rate.test', password: 'not correct' })).status, 429);
assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM auth_rate_limits WHERE key LIKE ?').get('%rate.test%').count, 0);
const savedOwner = env.FIELDWORK_COACH_USER_ID; delete env.FIELDWORK_COACH_USER_ID;
assert.equal((await call(stateRoute)).status, 503); env.FIELDWORK_COACH_USER_ID = savedOwner;
await Promise.all(backgroundJobs);
platformUser = { userId: env.FIELDWORK_COACH_USER_ID, displayName: 'Coach' };
const sheetSecret = 'test-only-bridge-secret-'.repeat(3), spreadsheetId = 'a'.repeat(30);
const sheetConfig = { action: 'configure', profileId: 'a', endpoint: 'https://script.google.com/macros/s/testDeployment/exec', spreadsheetId, secret: sheetSecret, autoSync: false };
const connection = await call(sheetsRoute, 'POST', sheetConfig);
assert.equal(connection.status, 200); assert.equal(connection.data.autoSync, false);
assert.equal(JSON.stringify(connection.data).includes(sheetSecret), false);
assert.equal((await call(sheetsRoute, 'POST', { ...sheetConfig, profileId: 'b' })).status, 409, 'A spreadsheet file cannot be shared by different profiles');
const oldFetch = globalThis.fetch; let sent;
try {
  globalThis.fetch = async (url, options) => {
    if (options.method === 'POST') { sent = JSON.parse(options.body); assert.equal(sent.secret, sheetSecret); assert.equal(sent.profileId, 'a'); assert.equal(sent.rows.some(row => row.includes('Athlete B')), false); assert.equal(sent.weeks[0].rows[0].length, 8); return new Response('', { status: 302, headers: { Location: 'https://script.googleusercontent.com/test-output' } }); }
    assert.equal(url, 'https://script.googleusercontent.com/test-output'); assert.equal(options.body, undefined);
    return Response.json({ success: true, requestId: sent.requestId, profileId: sent.profileId, revision: sent.revision });
  };
  const synced = await call(sheetsRoute, 'POST', { action: 'sync', profileId: 'a' });
  assert.equal(synced.status, 200); assert.equal(synced.data.success, true);
  assert.equal(sqlite.prepare('SELECT last_revision FROM sheet_connections WHERE profile_id=?').get('a').last_revision, wellnessSaved.data.revision);
  // Auto-export failure is recorded but cannot turn a committed app save into failure.
  sqlite.prepare('UPDATE sheet_connections SET auto_sync=1 WHERE profile_id=?').run('a');
  globalThis.fetch = async () => { throw Error('test network failure'); };
  const next = await storage.loadState('coach-owner'); next.state.profiles[0].name = 'Updated athlete';
  const appSaved = await call(stateRoute, 'PUT', next); assert.equal(appSaved.status, 200);
  await Promise.all(backgroundJobs);
  assert.equal((await storage.loadState('coach-owner')).revision, wellnessSaved.data.revision+1);
  assert.ok(sqlite.prepare('SELECT last_error FROM sheet_connections WHERE profile_id=?').get('a').last_error);
  globalThis.fetch = async () => new Response('', { status: 302, headers: { Location: 'https://evil.example/exfiltrate' } });
  const deniedRedirect = await call(sheetsRoute, 'POST', { action: 'sync', profileId: 'a' }); assert.equal(deniedRedirect.status, 502);
  assert.equal(JSON.stringify(deniedRedirect.data).includes(sheetSecret), false);
} finally { globalThis.fetch = oldFetch; }
console.log('PASS auth: native/fallback PBKDF2 agreement, role isolation, filtered reads, strict partial updates, CAS, CSRF, generic failures, hashed sessions, logout/reset revocation, and DB rate limits.');
console.log('PASS Sheets: coach-only routes, separate files, secret redaction, weekly payload, safe redirect, persisted sync status, background failure isolated from app saves.');
sqlite.close();
