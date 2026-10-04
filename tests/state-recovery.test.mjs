import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStack, healthyState, OWNER } from './support/web-stack.mjs';

// P3: one invalid record must not take the whole planner down, must not be silently lost,
// must not grant access, and must be diagnosable from logs without leaking values.
const SENTINEL = 'SENTINEL_9f3c';
const variants = {
  'completed workout without actual': { corrupt: s => { s.workouts.find(w => w.id === 'wa').status = 'completed'; }, collection: 'workouts', id: 'wa', code: 'completed_without_actual' },
  'unknown key in wellness answers': { corrupt: s => { s.wellness[0].answers[SENTINEL + '_KEY'] = SENTINEL + '_VALUE'; s.wellness[0].notes = SENTINEL + ' note'; }, collection: 'wellness', id: 'wl1', code: 'unrecognized_keys', path: 'wellness.0.answers' },
  'duplicate fatigue id': { corrupt: s => { s.fatigue.push({ ...s.fatigue[0], date: '2026-10-02' }); }, collection: 'fatigue', id: 'fa1', code: 'duplicate_id' },
  'answer from another time of day': { corrupt: s => { s.wellness[0].answers = { energy: 4 }; }, collection: 'wellness', id: 'wl1', code: 'custom', path: 'wellness.0' },
  'event ending before start': { corrupt: s => { s.events.push({ id: 'ev-a', profileId: 'a', title: 'Wyjazd', start: '2026-10-05', end: '2026-10-04', time: '10:00', kind: 'trip', location: '', notes: '', createdBy: 'athlete' }); }, collection: 'events', id: 'ev-a', code: 'custom' },
  'duplicated profile a': { corrupt: s => { s.profiles.push({ ...s.profiles[0], name: 'Kopia A' }); }, collection: 'profiles', id: 'a', code: 'duplicate_id', blocksA: true },
};
// Written as a legacy client (global revision): recovery must work for clients without record versions too.
const wellnessB = (w, date = '2026-10-03') => ({ action: 'wellness', date, slot: 'morning', answers: { sleepHours: 7.5 }, notes: '', revision: w.row().revision });

for (const [name, v] of Object.entries(variants)) test(`one bad record of profile a (${name}) does not block b; data stays recoverable`, async () => {
  const w = createStack();
  try {
    w.setPayload(healthyState(w.domain), 0);
    const A = await w.createAthlete('a', 'athlete.a'), B = await w.createAthlete('b', 'athlete.b');
    await w.createAthlete('c', 'athlete.c');
    const bad = healthyState(w.domain); v.corrupt(bad);
    assert.equal(w.domain.stateSchema.safeParse(bad).success, false);
    const original = JSON.stringify(bad);
    w.setPayload(original, 7);

    // Coach sees the quarantine list: collection, id, profile, path and rule code.
    w.asCoach();
    const coach = await w.call(w.routes.state);
    assert.equal(coach.status, 200); assert.equal(coach.data.health, 'degraded');
    const entry = coach.data.quarantine.find(q => q.collection === v.collection && q.recordId === v.id);
    assert.ok(entry, JSON.stringify(coach.data.quarantine));
    assert.equal(entry.profileId, 'a'); assert.equal(entry.stored, false);
    assert.ok(entry.issues.some(i => i.code === v.code && (!v.path || i.path === v.path)), JSON.stringify(entry.issues));
    assert.ok(!coach.text.includes(SENTINEL), 'coach overview carries metadata only');
    assert.equal((await w.call(w.routes.account, 'POST', { profileId: 'c', username: 'athlete.c', password: 'Another long synthetic passphrase' })).status, 200);
    w.asAnonymous();

    // Athlete B is untouched: read, session, login, write.
    const bState = await w.call(w.routes.state, 'GET', undefined, { cookie: B.cookie });
    assert.equal(bState.status, 200); assert.deepEqual(bState.data.state.profiles.map(p => p.id), ['b']);
    assert.equal(bState.data.health, undefined); assert.equal(bState.data.quarantine, undefined);
    assert.equal((await w.call(w.routes.session, 'GET', undefined, { cookie: B.cookie })).data.role, 'athlete');
    assert.equal((await w.login('athlete.b')).status, 200);
    // Fail closed for a: a quarantined profile locks its account; it never falls back to other data.
    const aState = await w.call(w.routes.state, 'GET', undefined, { cookie: A.cookie });
    if (v.blocksA) {
      assert.equal(aState.status, 403); assert.equal(aState.data.code, 'profile_quarantined'); assert.equal(aState.data.state, undefined);
      assert.equal((await w.call(w.routes.session, 'GET', undefined, { cookie: A.cookie })).status, 403);
      assert.equal((await w.login('athlete.a')).data.code, 'profile_quarantined');
      assert.equal((await w.call(w.routes.athlete, 'POST', { action: 'fatigue', date: '2026-10-03', value: 3, notes: '', revision: w.row().revision }, { cookie: A.cookie })).status, 403);
    } else {
      assert.equal(aState.status, 200); assert.deepEqual(aState.data.state.profiles.map(p => p.id), ['a']);
      assert.ok(!aState.text.includes(SENTINEL)); assert.equal((await w.login('athlete.a')).status, 200);
    }
    for (const r of [bState, aState]) assert.ok(!/Unrecognized|invalid_type|ZodError/.test(r.text), 'no raw zod error reaches users');

    const bWrite = await w.call(w.routes.athlete, 'POST', wellnessB(w), { cookie: B.cookie });
    assert.equal(bWrite.status, 200, bWrite.text); assert.equal(bWrite.data.revision, 8);
    assert.ok(w.rowState().wellness.some(x => x.profileId === 'b'));

    // Recoverable: raw backup equals the stored bytes, every quarantined record is a byte-exact slice of them.
    const backup = w.sqlite.prepare('SELECT payload, reason FROM planner_state_backups WHERE owner=? AND revision=7').get(OWNER);
    assert.equal(backup.payload, original); assert.equal(backup.reason, 'athlete_write');
    const stored = w.sqlite.prepare('SELECT * FROM planner_quarantine WHERE owner=?').all(OWNER);
    assert.ok(stored.length >= 1);
    for (const q of stored) { assert.ok(original.includes(q.raw_json), q.collection); assert.equal(q.source_revision, 7); }
    assert.ok(stored.some(q => q.collection === v.collection && q.record_id === v.id));
    // A later write keeps them; the document itself is valid again.
    assert.equal((await w.call(w.routes.athlete, 'POST', wellnessB(w, '2026-10-04'), { cookie: B.cookie })).status, 200);
    assert.equal(w.sqlite.prepare('SELECT COUNT(*) AS n FROM planner_quarantine WHERE owner=?').get(OWNER).n, stored.length);
    assert.equal(w.sqlite.prepare('SELECT payload FROM planner_state_backups WHERE owner=? AND revision=7').get(OWNER).payload, original);
    w.asCoach();
    const after = await w.call(w.routes.state);
    assert.equal(after.data.health, 'ok');
    assert.ok(after.data.quarantine.some(q => q.collection === v.collection && q.recordId === v.id && q.stored));
    if (v.blocksA) { w.asAnonymous(); assert.equal((await w.call(w.routes.state, 'GET', undefined, { cookie: A.cookie })).data.code, 'profile_quarantined', 'still locked after the profile left the document'); }
  } finally { w.close(); }
});

test('recovery keys are deterministic and orphaned records follow a quarantined profile', async () => {
  const w = createStack();
  try {
    const bad = healthyState(w.domain);
    bad.profiles.push({ ...bad.profiles[0] });
    const one = await w.recovery.recoverState(structuredClone(bad)), two = await w.recovery.recoverState(structuredClone(bad));
    assert.equal(one.health, 'degraded');
    assert.deepEqual(one.entries.map(e => e.key), two.entries.map(e => e.key));
    assert.deepEqual(one.blockedProfiles, ['a']);
    assert.deepEqual(one.state.profiles.map(p => p.id), ['b', 'c']);
    for (const id of ['wa', 'fa1', 'wl1']) assert.equal(one.entries.find(e => e.recordId === id)?.issues[0].code, 'profile_quarantined', id);
    assert.equal(one.entries.filter(e => e.collection === 'profiles').length, 2, 'both copies, no winner is guessed');
    // Period hierarchy cascades and dangling warm-ups are cleared, not blocking.
    const periods = healthyState(w.domain);
    periods.periods = [{ id: 'macro', profileId: 'b', name: 'Makro', start: '2026-10-01', end: '2026-10-31', phase: 'x', goal: '', level: 'macro', parentId: '' }, { id: 'meso', profileId: 'b', name: 'Mezo', start: '2026-10-01', end: '2026-10-20', phase: 'x', goal: '', level: 'meso', parentId: 'macro' }, { id: 'micro', profileId: 'b', name: 'Mikro', start: '2026-10-01', end: '2026-10-07', phase: 'x', goal: '', level: 'micro', parentId: 'meso' }];
    periods.periods[0].start = 'zly-dzien'; periods.profiles[2].warmupId = 'missing-template';
    const cascade = await w.recovery.recoverState(periods);
    assert.deepEqual(cascade.state.periods, []);
    assert.deepEqual(cascade.entries.filter(e => e.collection === 'periods').map(e => e.issues[0].code), ['invalid_string', 'period_hierarchy', 'period_hierarchy']);
    assert.equal(cascade.state.profiles.find(p => p.id === 'c').warmupId, '');
    assert.equal(cascade.entries.find(e => e.resolution === 'field_cleared').issues[0].code, 'unknown_warmup');
    assert.deepEqual(cascade.blockedProfiles, []);
    // Nothing valid left / not JSON: unrecoverable.
    const none = healthyState(w.domain); none.profiles = [{ id: 'a' }];
    assert.equal((await w.recovery.recoverState(none)).health, 'corrupt');
    assert.equal((await w.recovery.recoverState({ ...healthyState(w.domain), workouts: {} })).health, 'corrupt');
  } finally { w.close(); }
});

test('logs carry rule paths and codes but never values, keys from data, notes or zod messages', async () => {
  const w = createStack();
  try {
    w.setPayload(healthyState(w.domain), 0);
    const B = await w.createAthlete('b', 'athlete.b');
    const bad = healthyState(w.domain); variants['unknown key in wellness answers'].corrupt(bad);
    bad.events.push({ ...bad.events[0], id: 'ev-x', profileId: 'a', title: SENTINEL + ' title', end: '2026-01-01' });
    w.setPayload(bad, 3);
    w.logs.length = 0;
    assert.equal((await w.call(w.routes.state, 'GET', undefined, { cookie: B.cookie })).status, 200);
    w.asCoach(); assert.equal((await w.call(w.routes.state)).status, 200);
    assert.ok(w.logs.some(l => l.includes('wellness.0.answers unrecognized_keys')), w.logs.join('\n'));
    assert.ok(w.logs.some(l => l.includes('events.1 custom')));
    for (const l of w.logs) { assert.ok(!l.includes(SENTINEL), l); assert.ok(!/Unrecognized|Koniec wydarzenia|readiness/.test(l), l); }
    w.setPayload('{"version":1,"profiles":[' + SENTINEL, 4);
    w.logs.length = 0;
    const corrupt = await w.call(w.routes.state);
    assert.equal(corrupt.status, 500); assert.equal(corrupt.data.code, 'state_corrupt');
    assert.ok(w.logs.some(l => l.includes('invalid_json'))); assert.ok(!w.logs.join('').includes(SENTINEL));
  } finally { w.close(); }
});

test('a failing backup or quarantine insert leaves the document and revision untouched', async () => {
  const w = createStack();
  try {
    w.setPayload(healthyState(w.domain), 0);
    const B = await w.createAthlete('b', 'athlete.b');
    const bad = healthyState(w.domain); variants['completed workout without actual'].corrupt(bad);
    const original = JSON.stringify(bad);
    w.setPayload(original, 5);
    for (const table of [/planner_quarantine/, /planner_state_backups/]) {
      w.faults.failStatement = table;
      const r = await w.call(w.routes.athlete, 'POST', wellnessB(w), { cookie: B.cookie });
      assert.equal(r.status, 503); assert.equal(r.data.code, 'storage_unavailable');
      assert.deepEqual(w.row(), { payload: original, revision: 5 });
      assert.equal(w.sqlite.prepare('SELECT COUNT(*) AS n FROM planner_state_backups').get().n, 0);
      assert.equal(w.sqlite.prepare('SELECT COUNT(*) AS n FROM planner_quarantine').get().n, 0);
      w.asCoach();
      const state = (await w.call(w.routes.state)).data.state;
      assert.equal((await w.call(w.routes.state, 'PUT', { state, revision: 5 })).status, 503, 'coach write fails atomically too');
      assert.deepEqual(w.row(), { payload: original, revision: 5 });
      w.asAnonymous();
    }
    w.faults.failStatement = null;
    assert.equal((await w.call(w.routes.athlete, 'POST', wellnessB(w), { cookie: B.cookie })).status, 200);
    assert.equal(w.row().revision, 6);
  } finally { w.close(); }
});

test('coach repair of an unreadable document keeps origin, role, schema and CAS checks and backs up the raw bytes', async () => {
  const w = createStack();
  try {
    const healthy = healthyState(w.domain);
    w.setPayload(healthy, 0);
    const B = await w.createAthlete('b', 'athlete.b');
    w.sqlite.prepare("INSERT INTO sheet_connections (owner, profile_id, endpoint, secret, spreadsheet_id, auto_sync) VALUES (?, 'b', 'https://script.google.com/macros/s/testDeployment/exec', ?, ?, 1)").run(OWNER, 's'.repeat(40), 'x'.repeat(30));
    const garbage = '{"version":1,"profiles":[{"id":"a"';
    w.setPayload(garbage, 5);
    // Users get a distinguishable code; only the coach gets paths and the revision.
    const athlete = await w.call(w.routes.state, 'GET', undefined, { cookie: B.cookie });
    assert.equal(athlete.status, 500); assert.equal(athlete.data.code, 'state_corrupt'); assert.equal(athlete.data.issues, undefined); assert.equal(athlete.data.revision, undefined);
    assert.equal((await w.login('athlete.b')).data.code, 'state_corrupt');
    w.asCoach();
    const coach = await w.call(w.routes.state);
    assert.equal(coach.status, 500); assert.equal(coach.data.revision, 5); assert.deepEqual(coach.data.issues, [{ path: '', code: 'invalid_json' }]);
    const diag = await w.call(w.routes.repair, 'GET', undefined, { query: '?payload=1' });
    assert.equal(diag.data.health, 'corrupt'); assert.equal(diag.data.payload, garbage);
    const body = { state: healthy, revision: 5, repair: 'replace-corrupt-state' };
    assert.equal((await w.call(w.routes.state, 'PUT', { state: healthy, revision: 5 })).data.code, 'state_corrupt', 'no silent replacement without confirmation');
    assert.equal((await w.call(w.routes.state, 'PUT', body, { origin: 'https://evil.example' })).status, 403);
    w.asAnonymous();
    assert.equal((await w.call(w.routes.state, 'PUT', body)).status, 401);
    assert.equal((await w.call(w.routes.state, 'PUT', body, { cookie: B.cookie })).status, 403);
    w.asCoach();
    assert.equal((await w.call(w.routes.state, 'PUT', { ...body, state: { ...healthy, profiles: [] } })).status, 400);
    assert.equal((await w.call(w.routes.state, 'PUT', { ...body, repair: 'yes' })).status, 400);
    const stale = await w.call(w.routes.state, 'PUT', { ...body, revision: 4 });
    assert.equal(stale.status, 409); assert.equal(stale.data.code, 'revision_conflict');
    assert.deepEqual(w.row(), { payload: garbage, revision: 5 });
    const repaired = await w.call(w.routes.state, 'PUT', body);
    assert.equal(repaired.status, 200); assert.equal(repaired.data.revision, 6);
    assert.deepEqual({ ...w.sqlite.prepare('SELECT payload, reason FROM planner_state_backups WHERE owner=? AND revision=5').get(OWNER) }, { payload: garbage, reason: 'coach_repair' });
    const sheet = w.sqlite.prepare("SELECT auto_sync, last_error FROM sheet_connections WHERE profile_id='b'").get();
    assert.equal(sheet.auto_sync, 0); assert.match(sheet.last_error, /naprawie/);
    assert.equal((await w.call(w.routes.state)).data.health, 'ok');
    assert.equal((await w.call(w.routes.repair, 'GET', undefined, { query: '?backup=5' })).data.payload, garbage);
    await w.drain(); assert.equal(w.fetchCalls.length, 0);
    // A degraded (recoverable) document is saved by the normal PUT, with backup + quarantine.
    const bad = structuredClone(healthy); bad.wellness[0].answers = { energy: 1 };
    w.setPayload(bad, 6);
    const view = await w.call(w.routes.state);
    view.data.state.profiles[1].name = 'B po zmianie';
    assert.equal((await w.call(w.routes.state, 'PUT', { state: view.data.state, revision: 6 })).status, 200);
    assert.equal(w.sqlite.prepare('SELECT reason FROM planner_state_backups WHERE revision=6').get().reason, 'coach_write');
    assert.equal(w.sqlite.prepare("SELECT record_id FROM planner_quarantine WHERE collection='wellness'").get().record_id, 'wl1');
  } finally { w.close(); }
});

test('accounts, quarantine and backups stay isolated per owner and per profile', async () => {
  const w = createStack();
  try {
    w.setPayload(healthyState(w.domain), 0);
    const A = await w.createAthlete('a', 'athlete.a'), B = await w.createAthlete('b', 'athlete.b');
    const other = 'OTHER_OWNER_' + SENTINEL;
    w.setPayload('not json ' + other, 3, 'other-owner');
    w.sqlite.prepare("INSERT INTO planner_state_backups VALUES ('other-owner', 1, ?, 'x', 'now')").run(other);
    w.sqlite.prepare("INSERT INTO planner_quarantine (owner, collection, record_key, record_id, profile_id, raw_json, rule_codes, resolution, source_revision, created_at) VALUES ('other-owner', 'profiles', ?, 'b', 'b', ?, '[]', 'removed', 1, 'now')").run('0'.repeat(64) + ':0', other);
    const bad = healthyState(w.domain); bad.wellness[0].notes = SENTINEL; bad.wellness[0].answers = { energy: 2 };
    w.setPayload(bad, 4);
    w.asCoach();
    const coach = await w.call(w.routes.state), diag = await w.call(w.routes.repair, 'GET', undefined, { query: '?payload=1' });
    assert.equal(coach.status, 200); assert.ok(!coach.text.includes('OTHER_OWNER'));
    assert.ok(!diag.text.includes('OTHER_OWNER')); assert.ok(diag.text.includes(SENTINEL), 'the owner coach can see own raw data');
    assert.equal((await w.call(w.routes.repair, 'GET', undefined, { query: '?backup=1' })).status, 404);
    // Another owner's quarantined profile "b" must not lock this owner's athlete b.
    w.asAnonymous();
    const b = await w.call(w.routes.state, 'GET', undefined, { cookie: B.cookie });
    assert.equal(b.status, 200); assert.ok(!b.text.includes(SENTINEL)); assert.ok(!b.text.includes('quarantine'));
    const a = await w.call(w.routes.state, 'GET', undefined, { cookie: A.cookie });
    assert.equal(a.status, 200); assert.ok(!a.text.includes(SENTINEL), 'own quarantined record is not shown to the athlete either');
    assert.equal((await w.call(w.routes.repair, 'GET', undefined, { cookie: B.cookie })).status, 403);
    assert.equal((await w.call(w.routes.repair, 'POST', { action: 'resolve', keys: [{ collection: 'wellness', key: '0'.repeat(64) + ':0' }] }, { cookie: B.cookie })).status, 403);
    // Broken account -> profile link: no access, never another profile.
    w.sqlite.prepare("UPDATE athlete_accounts SET profile_id='zzz' WHERE username='athlete.b'").run();
    assert.equal((await w.call(w.routes.state, 'GET', undefined, { cookie: B.cookie })).status, 401);
    assert.equal((await w.login('athlete.b')).status, 401);
  } finally { w.close(); }
});

test('Sheets export pauses for profiles with quarantined records and resumes after the coach resolves them (no network)', async () => {
  const w = createStack();
  try {
    w.setPayload(healthyState(w.domain), 0);
    const A = await w.createAthlete('a', 'athlete.a'), B = await w.createAthlete('b', 'athlete.b');
    for (const [p, id] of [['a', 'x'], ['b', 'y']]) w.sqlite.prepare("INSERT INTO sheet_connections (owner, profile_id, endpoint, secret, spreadsheet_id, auto_sync) VALUES (?, ?, 'https://script.google.com/macros/s/testDeployment/exec', ?, ?, 1)").run(OWNER, p, 's'.repeat(40), id.repeat(30));
    const bad = healthyState(w.domain); bad.wellness[0].answers = { energy: 2 };
    w.setPayload(bad, 2);
    w.asCoach();
    const manual = await w.call(w.routes.sheets, 'POST', { action: 'sync', profileId: 'a' });
    assert.equal(manual.status, 409); assert.equal(manual.data.code, 'sync_paused');
    w.asAnonymous();
    assert.equal((await w.call(w.routes.athlete, 'POST', { action: 'fatigue', date: '2026-10-03', value: 5, notes: '', revision: w.row().revision }, { cookie: A.cookie })).status, 200);
    assert.equal((await w.call(w.routes.athlete, 'POST', { action: 'fatigue', date: '2026-10-03', value: 5, notes: '', revision: w.row().revision }, { cookie: B.cookie })).status, 200);
    await w.drain();
    assert.equal(w.fetchCalls.filter(c => c.body?.profileId === 'a').length, 0, 'no truncated export of profile a');
    assert.equal(w.fetchCalls.filter(c => c.body?.profileId === 'b').length, 1, 'unaffected profile b keeps syncing (stubbed fetch)');
    assert.match(w.sqlite.prepare("SELECT last_error FROM sheet_connections WHERE profile_id='a'").get().last_error, /kwarantannie/);
    w.asCoach();
    const keys = (await w.call(w.routes.state)).data.quarantine.map(q => ({ collection: q.collection, key: q.key }));
    assert.equal(keys.length, 1);
    assert.equal((await w.call(w.routes.repair, 'POST', { action: 'resolve', keys }, { origin: 'https://evil.example' })).status, 403);
    assert.equal((await w.call(w.routes.repair, 'POST', { action: 'resolve', keys })).data.resolved, 1);
    assert.equal((await w.call(w.routes.state)).data.quarantine.length, 0);
    assert.equal(w.sqlite.prepare('SELECT COUNT(*) AS n FROM planner_quarantine WHERE resolved_at IS NOT NULL').get().n, 1, 'kept for audit');
    assert.equal((await w.call(w.routes.sheets, 'POST', { action: 'sync', profileId: 'a' })).status, 502, 'resumed: reaches the (stubbed) network');
    assert.equal(w.fetchCalls.filter(c => c.body?.profileId === 'a').length, 1);
    assert.ok(w.fetchCalls.every(c => c.url.startsWith('https://script.google.com/')));
  } finally { w.close(); }
});
