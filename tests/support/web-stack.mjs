// Isolated web stack for regression tests: the REAL route handlers and the REAL lib/storage.ts
// (loadState -> recovery -> stateSchema) on node:sqlite ':memory:' with the schema from drizzle/*.sql.
// Only the platform is replaced: `cloudflare:workers` (env.DB, waitUntil) and `@/app/chatgpt-auth`.
// globalThis.fetch is replaced per stack by a recorder that never reaches the network.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import ts from 'typescript';

export const root = path.resolve(import.meta.dirname, '..', '..');
const require = createRequire(import.meta.url);
export const OWNER = 'coach-owner', ORIGIN = 'https://fieldwork.example';

function createLoader(stubs) {
  const cache = new Map();
  function resolve(spec, from) {
    const base = spec.startsWith('@/') ? path.join(root, spec.slice(2)) : path.resolve(path.dirname(from), spec);
    for (const ext of ['', '.ts', '.tsx']) { const f = base + ext; if (fs.existsSync(f) && fs.statSync(f).isFile()) return f; }
    throw Error(`Cannot resolve ${spec} from ${from}`);
  }
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const loaded = { exports: {} }; cache.set(file, loaded);
    const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
    const localRequire = spec => spec in stubs ? stubs[spec] : spec.startsWith('@/') || spec.startsWith('.') ? load(resolve(spec, file)) : require(spec);
    new Function('require', 'module', 'exports', js)(localRequire, loaded, loaded.exports);
    return loaded.exports;
  }
  return rel => load(path.join(root, rel));
}

/** D1 adapter (same shape as tests/auth.test.mjs) with a hook to inject failures into batches. */
function createD1(sqlite, faults) {
  const db = {
    prepare(sql) { return { sql, params: [], bind(...params) { this.params = params; return this; }, async first() { return sqlite.prepare(sql).get(...this.params) || null; }, async all() { return { results: sqlite.prepare(sql).all(...this.params) }; }, async run() { return { meta: { changes: Number(sqlite.prepare(sql).run(...this.params).changes) } }; } }; },
    async batch(statements) {
      await faults.beforeBatch?.(statements);
      sqlite.exec('BEGIN');
      try {
        const results = [];
        for (const stmt of statements) {
          if (faults.failStatement?.test(stmt.sql)) throw Error('injected D1 failure');
          results.push(/RETURNING\s/i.test(stmt.sql) ? { results: sqlite.prepare(stmt.sql).all(...stmt.params) } : await stmt.run());
        }
        sqlite.exec('COMMIT'); return results;
      } catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
  };
  return db;
}

export function createStack() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys=ON;');
  for (const f of fs.readdirSync(path.join(root, 'drizzle')).filter(f => f.endsWith('.sql')).sort()) sqlite.exec(fs.readFileSync(path.join(root, 'drizzle', f), 'utf8'));
  const faults = {}, backgroundJobs = [], logs = [], fetchCalls = [];
  const env = { FIELDWORK_COACH_USER_ID: OWNER, DB: createD1(sqlite, faults) };
  let platformUser = null;
  const load = createLoader({ 'cloudflare:workers': { env, waitUntil: job => backgroundJobs.push(job) }, '@/app/chatgpt-auth': { getChatGPTUser: async () => platformUser } });
  const mod = { domain: load('lib/domain.ts'), storage: load('lib/storage.ts'), recovery: load('lib/state-recovery.ts'), auth: load('lib/auth.ts') };
  const routes = { state: load('app/api/state/route.ts'), repair: load('app/api/state/repair/route.ts'), athlete: load('app/api/athlete/route.ts'), login: load('app/api/auth/login/route.ts'), session: load('app/api/auth/session/route.ts'), account: load('app/api/auth/athlete-account/route.ts'), sheets: load('app/api/sheets/route.ts') };
  const password = 'synthetic-' + crypto.randomBytes(12).toString('hex');
  let ip = 0;
  async function call(route, method = 'GET', body, { cookie = '', origin = ORIGIN, query = '' } = {}) {
    const headers = { Origin: origin, 'Content-Type': 'application/json', 'cf-connecting-ip': `198.51.100.${(ip++ % 200) + 1}` };
    if (cookie) headers.Cookie = cookie;
    const response = await route[method](new Request(ORIGIN + '/' + query, { method, headers, ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }) }));
    const text = await response.text();
    let data; try { data = JSON.parse(text); } catch { data = text; }
    return { status: response.status, data, text, response };
  }
  const as = user => { platformUser = user; };
  const asCoach = () => as({ userId: OWNER, displayName: 'Coach' }), asAnonymous = () => as(null);
  const setPayload = (state, revision = 0, owner = OWNER) => sqlite.prepare('INSERT INTO planner_state (owner, payload, revision, updated_at) VALUES (?,?,?,?) ON CONFLICT(owner) DO UPDATE SET payload=excluded.payload, revision=excluded.revision, updated_at=excluded.updated_at').run(owner, typeof state === 'string' ? state : JSON.stringify(state), revision, new Date().toISOString());
  const row = (owner = OWNER) => ({ ...sqlite.prepare('SELECT payload, revision FROM planner_state WHERE owner=?').get(owner) });
  const rowState = () => JSON.parse(row().payload);
  async function createAthlete(profileId, username) {
    const previous = platformUser; asCoach();
    const created = await call(routes.account, 'POST', { profileId, username, password });
    platformUser = previous;
    if (created.status !== 200) throw Error(`account ${profileId}: ${created.status} ${created.text}`);
    return login(username);
  }
  async function login(username) {
    const previous = platformUser; asAnonymous();
    const r = await call(routes.login, 'POST', { username, password });
    platformUser = previous;
    return { status: r.status, data: r.data, cookie: r.status === 200 ? r.response.headers.get('set-cookie').split(';')[0] : null };
  }
  const originalFetch = globalThis.fetch, originalError = console.error;
  globalThis.fetch = async (url, options = {}) => { fetchCalls.push({ url: String(url), body: options.body ? JSON.parse(options.body) : null }); throw Error('network disabled in tests'); };
  console.error = (...args) => { logs.push(args.map(String).join(' ')); };
  async function drain() { await Promise.allSettled(backgroundJobs.splice(0)); }
  function close() { globalThis.fetch = originalFetch; console.error = originalError; sqlite.close(); }
  return { sqlite, env, faults, logs, fetchCalls, ...mod, routes, call, asCoach, asAnonymous, setPayload, row, rowState, createAthlete, login, drain, close };
}

// ---- fixtures -------------------------------------------------------------------------------
export const exercise = { id: 'ex-a', name: 'Przysiad', category: 'strength', metric: 'kg', shares: [{ muscle: 'quads', weight: 1 }], video: '', notes: '' };
export const workout = (id, profileId) => ({ id, profileId, name: 'Siła', date: '2026-10-03', time: '18:00', category: 'strength', status: 'planned', duration: 60, actualMinutes: null, rpe: null, notes: 'Plan trenera', athleteNotes: '', sections: { warmup: [], main: [{ id: id + '-item', exercise, planned: { sets: 3, quantity: 5, kg: 40 }, actual: null, athleteNotes: '' }], cooldown: [] } });
export const profile = (id, name) => ({ id, name, role: '', notes: '', warmupId: '' });
export function healthyState(domain) {
  return domain.stateSchema.parse({
    version: 1, catalogVersion: 4,
    profiles: [profile('a', 'Zawodnik A'), profile('b', 'Zawodnik B'), profile('c', 'Zawodnik C')],
    exercises: [exercise], templates: [], workouts: [workout('wa', 'a'), workout('wb', 'b')],
    fatigue: [{ id: 'fa1', profileId: 'a', date: '2026-10-01', value: 4, notes: '' }],
    wellness: [{ id: 'wl1', profileId: 'a', date: '2026-10-02', slot: 'morning', answers: { sleepHours: 7 }, notes: '', recordedBy: 'athlete' }],
    periods: [], events: [{ id: 'ev-b', profileId: 'b', title: 'Obóz B', start: '2026-10-10', end: '2026-10-12', time: '10:00', kind: 'trip', location: '', notes: '', createdBy: 'athlete' }], exerciseNotes: [],
  });
}
