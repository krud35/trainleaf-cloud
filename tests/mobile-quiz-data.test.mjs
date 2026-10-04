// Migration 8, backup format 5 and the stored onboarding quiz, on real SQLite files.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { loadTs, root } from '../tools/load-ts.mjs';

const { createLocalRepository } = loadTs('mobile/src/data/repository.ts');
const { DATABASE_VERSION, migrateDatabase } = loadTs('mobile/src/data/database.ts');
const { exportRecoveryData } = loadTs('mobile/src/data/recovery.ts');
const { snapshotCsv } = loadTs('mobile/src/data/analytics.ts');
const { buildReserveModel } = loadTs('mobile/src/data/reserve.ts');

function openDatabase(filename, failOn = () => false) {
  const connection = new DatabaseSync(filename);
  let tail = Promise.resolve();
  const enqueue = operation => { const result = tail.then(operation); tail = result.catch(() => {}); return result; };
  const executor = {
    async execute(sql, params = []) {
      if (failOn(sql, params)) throw new Error('Simulated storage failure');
      return { changes: Number(connection.prepare(sql).run(...params).changes) };
    },
    async query(sql, params = []) { return connection.prepare(sql).all(...params); },
  };
  return {
    execute: (sql, params) => enqueue(() => executor.execute(sql, params)),
    query: (sql, params) => enqueue(() => executor.query(sql, params)),
    transaction: operation => enqueue(async () => {
      connection.exec('BEGIN IMMEDIATE');
      try { const result = await operation(executor); connection.exec('COMMIT'); return result; }
      catch (error) { connection.exec('ROLLBACK'); throw error; }
    }),
    close: () => enqueue(() => connection.close()),
  };
}
async function files(context) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'trainleaf-quiz-test-'));
  const databases = [];
  context.after(async () => { for (const database of databases.reverse()) await database.close().catch(() => {}); await rm(directory, { recursive: true, force: true }); });
  return { open(name = 'training.sqlite', failOn) { const database = openDatabase(path.join(directory, name), failOn); databases.push(database); return database; }, path: name => path.join(directory, name) };
}
const fixtureRoot = path.join(root, 'tests/support/mobile-0.4-fixture');
const provenance = JSON.parse(fs.readFileSync(path.join(fixtureRoot, 'provenance.json'), 'utf8'));
const releasedDatabase = fs.readFileSync(path.join(fixtureRoot, 'released-v7.sqlite'));
const releasedBackup = fs.readFileSync(path.join(fixtureRoot, 'backup-v4.json'), 'utf8');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const userVersion = async database => (await database.query('PRAGMA user_version'))[0].user_version;
const tableNames = async database => (await database.query("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'local_%' ORDER BY name")).map(row => row.name);
const allRows = async (database, tables) => Object.fromEntries(await Promise.all(tables.map(async name => [name, await database.query(`SELECT * FROM ${name} ORDER BY 1`)])));
const own = { profileId: 'local-profile' };
/** A restore resets revisions on purpose; everything else must be identical. */
const withoutRevision = entry => { const copy = { ...entry }; delete copy.revision; return copy; };
const profileInput = { displayName: 'Alicja', roles: ['athlete'], sportIds: ['ultimate', 'running'], modules: ['journal'] };
const answers = { experience: '2to5y', level: 'advanced', sessionsPerWeek: 4, typicalMinutes: 75,
  kinds: [{ type: 'team', intensity: 'hard' }, { type: 'strength', intensity: 'moderate' }], rhythm: 'building' };

test('the frozen 0.4.0 fixture is the released schema 7 database and backup 4', () => {
  assert.equal(provenance.app.versionName, '0.4.0'); assert.equal(provenance.database.schemaVersion, 7); assert.equal(provenance.backup.formatVersion, 4);
  assert.equal(sha256(releasedDatabase), provenance.database.sha256);
  assert.equal(sha256(releasedBackup), provenance.backup.sha256);
  assert.equal(JSON.parse(releasedBackup).version, 4);
});

test('migration 7 to 8 is atomic, adds only the quiz table and leaves every released row and reference untouched', async context => {
  const storage = await files(context); let fail = false;
  fs.writeFileSync(storage.path('training.sqlite'), releasedDatabase);
  const database = storage.open('training.sqlite', sql => fail && sql.startsWith('PRAGMA user_version = 8'));
  assert.equal(await userVersion(database), 7);
  const tables = await tableNames(database), before = await allRows(database, tables), schemaBefore = await database.query("SELECT name, sql FROM sqlite_master WHERE name LIKE 'local_%' ORDER BY name");
  assert.ok(before.local_readiness_references.length === 1 && before.local_workouts.length === 7 && before.local_wellness.length === 2);
  assert.equal(tables.includes('local_training_quiz'), false);

  // Failure after the table was created, before the version is written: nothing of the migration remains.
  fail = true;
  await assert.rejects(createLocalRepository(database), /storage failure/);
  assert.equal(await userVersion(database), 7);
  assert.deepEqual(await tableNames(database), tables);
  assert.deepEqual(await allRows(database, tables), before);
  assert.deepEqual(await database.query("SELECT name, sql FROM sqlite_master WHERE name LIKE 'local_%' ORDER BY name"), schemaBefore);

  fail = false;
  const repository = await createLocalRepository(database);
  assert.equal(DATABASE_VERSION, 8); assert.equal(await userVersion(database), 8);
  assert.deepEqual(await tableNames(database), [...tables, 'local_training_quiz'].sort());
  assert.deepEqual(await allRows(database, tables), before, 'every row of every released table is byte for byte the same');
  assert.deepEqual((await database.query("SELECT name, sql FROM sqlite_master WHERE name LIKE 'local_%' ORDER BY name")).filter(row => row.name !== 'local_training_quiz'), schemaBefore);
  assert.deepEqual(await database.query('SELECT * FROM local_training_quiz'), []);

  const original = JSON.parse(releasedBackup), snapshot = await repository.readSnapshot();
  assert.deepEqual(snapshot.trainingQuizzes, []);
  assert.deepEqual(snapshot.readinessReferences, original.readinessReferences);
  assert.equal(snapshot.readinessReferences[0].version, 'readiness-v1');
  assert.deepEqual(snapshot.readinessReferences[0].confirmedRestDays, ['2026-09-26', '2026-09-27']);
  for (const workout of original.workouts.filter(entry => !entry.deletedAt)) assert.deepEqual(snapshot.workouts.find(entry => entry.id === workout.id), workout);
  assert.deepEqual(snapshot.wellness, original.wellness); assert.deepEqual(snapshot.drafts, original.drafts);
  // Opening again is harmless.
  await migrateDatabase(database); await migrateDatabase(database);
  assert.deepEqual(await allRows(database, tables), before);
  // The new forecast works on the migrated data without any reference and without touching it.
  const model = buildReserveModel(snapshot, '2026-10-05');
  assert.equal(model.tolerance.quizSource, 'default');
  assert.ok(model.day('2026-10-06').reserve < 1);
  assert.deepEqual(await allRows(database, tables), before);
  // The export still contains the old reference rows.
  const exported = JSON.parse(await repository.exportBackup());
  assert.equal(exported.version, 5); assert.deepEqual(exported.readinessReferences, original.readinessReferences); assert.deepEqual(exported.trainingQuizzes, []);
  assert.equal(JSON.parse(await exportRecoveryData(database)).tables.local_readiness_references.rows.length, 1);
});

test('a database of a newer schema is still refused and left unchanged', async context => {
  const storage = await files(context);
  fs.writeFileSync(storage.path('training.sqlite'), releasedDatabase);
  const database = storage.open();
  await database.execute('PRAGMA user_version = 9');
  await assert.rejects(createLocalRepository(database));
  assert.equal(await userVersion(database), 9);
  assert.equal((await tableNames(database)).includes('local_training_quiz'), false);
});

test('the quiz answer is one durable row: completion and skipping survive a restart, a skip never replaces answers', async context => {
  const storage = await files(context);
  let database = storage.open(), repository = await createLocalRepository(database);
  await assert.rejects(repository.saveTrainingQuiz({ ...own, status: 'skipped', answers: null }), /profil/);
  await repository.saveProfile(profileInput);
  assert.deepEqual((await repository.readSnapshot()).trainingQuizzes, []);
  // Status and answers must agree; unknown options and extra fields are refused before writing.
  await assert.rejects(repository.saveTrainingQuiz({ ...own, status: 'completed', answers: null }));
  await assert.rejects(repository.saveTrainingQuiz({ ...own, status: 'skipped', answers }));
  await assert.rejects(repository.saveTrainingQuiz({ ...own, status: 'completed', answers: { ...answers, rhythm: 'unknown' } }));
  await assert.rejects(repository.saveTrainingQuiz({ ...own, status: 'completed', answers: { ...answers, kinds: [] } }));
  await assert.rejects(repository.saveTrainingQuiz({ ...own, status: 'completed', answers: { ...answers, weight: 80 } }));
  await assert.rejects(repository.saveTrainingQuiz({ profileId: 'other', status: 'skipped', answers: null }));
  assert.deepEqual(await database.query('SELECT * FROM local_training_quiz'), []);

  const skipped = await repository.saveTrainingQuiz({ ...own, status: 'skipped', answers: null });
  assert.equal(skipped.status, 'skipped'); assert.equal(skipped.quizVersion, 1); assert.equal(skipped.answers, null);
  await repository.close();
  database = storage.open(); repository = await createLocalRepository(database);
  assert.deepEqual((await repository.readSnapshot()).trainingQuizzes, [skipped], 'the skip is remembered after a restart');

  const completed = await repository.saveTrainingQuiz({ ...own, status: 'completed', answers });
  assert.equal(completed.id, skipped.id); assert.equal(completed.createdAt, skipped.createdAt); assert.ok(completed.revision > skipped.revision);
  assert.deepEqual(completed.answers, answers);
  assert.equal((await database.query('SELECT * FROM local_training_quiz')).length, 1);
  assert.deepEqual(await repository.saveTrainingQuiz({ ...own, status: 'skipped', answers: null }), completed, 'a later skip keeps the answers');
  const changed = await repository.saveTrainingQuiz({ ...own, status: 'completed', answers: { ...answers, sessionsPerWeek: 5 } });
  assert.equal(changed.answers.sessionsPerWeek, 5); assert.equal(changed.id, completed.id);
  await assert.rejects(repository.saveTrainingQuiz({ ...own, status: 'completed', answers }, 999999), 'a stale epoch is refused');
  await repository.close();
  database = storage.open(); repository = await createLocalRepository(database);
  const snapshot = await repository.readSnapshot();
  assert.deepEqual(snapshot.trainingQuizzes, [changed]);
  assert.ok(snapshotCsv(snapshot).includes('quiz_startowy'));
  const rescue = JSON.parse(await exportRecoveryData(database));
  assert.equal(rescue.tables.local_training_quiz.status, 'ok'); assert.equal(rescue.tables.local_training_quiz.rows.length, 1);
});

test('backup format 5 carries the raw quiz answers and its version; a new backup restores them with the same identifiers', async context => {
  const storage = await files(context);
  const source = await createLocalRepository(storage.open('source.sqlite'));
  await source.saveProfile(profileInput);
  const workout = await source.createWorkout({ ...own, sportId: 'ultimate', trainingType: 'team', date: '2026-10-01', title: 'Trening', durationMinutes: 60, status: 'completed',
    postWorkout: { aerobicFatigue: 6, muscularFatigue: 4, satisfaction: null, notes: '' } });
  const wellness = await source.createWellness({ ...own, date: '2026-10-02', slot: 'morning', answers: { fatigue: 2, soreness: 3 }, notes: '' });
  const reference = await source.createReadinessReference({ ...own, name: 'Stary punkt', source: 'example-week', weekStart: '2026-09-21', dailyLoads: [50, 0, 0, 0, 0, 0, 0], confirmedComplete: true, confirmedRestDays: ['2026-09-27'] });
  const quiz = await source.saveTrainingQuiz({ ...own, status: 'completed', answers });
  const text = await source.exportBackup(), backup = JSON.parse(text);
  assert.equal(backup.version, 5);
  assert.deepEqual(backup.trainingQuizzes, [quiz]); assert.equal(backup.trainingQuizzes[0].quizVersion, 1); assert.deepEqual(backup.trainingQuizzes[0].answers, answers);
  assert.deepEqual(backup.readinessReferences, [reference]);

  const target = await createLocalRepository(storage.open('target.sqlite'));
  const preview = target.previewBackup(text);
  assert.equal(preview.version, 5); assert.equal(preview.counts.trainingQuizzes, 1); assert.equal(preview.counts.readinessReferences, 1);
  await target.restoreBackup(text);
  const restored = await target.readSnapshot();
  assert.deepEqual(withoutRevision(restored.trainingQuizzes[0]), withoutRevision(quiz));
  assert.equal(restored.workouts[0].id, workout.id); assert.deepEqual(restored.workouts[0].loadCalculation, workout.loadCalculation);
  assert.equal(restored.wellness[0].id, wellness.id); assert.equal(restored.readinessReferences[0].id, reference.id);
  // A second export and import is stable.
  const again = JSON.parse(await target.exportBackup());
  assert.deepEqual(again.trainingQuizzes.map(withoutRevision), backup.trainingQuizzes.map(withoutRevision));
  // A "skipped" mark travels in the backup as well.
  const skipSource = await createLocalRepository(storage.open('skip.sqlite'));
  await skipSource.saveProfile(profileInput);
  const skip = await skipSource.saveTrainingQuiz({ ...own, status: 'skipped', answers: null });
  await target.restoreBackup(await skipSource.exportBackup());
  assert.deepEqual(withoutRevision((await target.readSnapshot()).trainingQuizzes[0]), withoutRevision(skip));

  // Strict preflight: malformed quiz data is refused without changing anything.
  const state = await target.readSnapshot();
  const broken = change => { const copy = JSON.parse(text); change(copy); return JSON.stringify(copy); };
  for (const bad of [
    broken(copy => { copy.trainingQuizzes.push({ ...copy.trainingQuizzes[0], id: 'second' }); }),
    broken(copy => { copy.trainingQuizzes[0].answers.extra = true; }),
    broken(copy => { copy.trainingQuizzes[0].quizVersion = 2; }),
    broken(copy => { copy.trainingQuizzes[0].status = 'skipped'; }),
    broken(copy => { copy.trainingQuizzes[0].profileId = 'other'; }),
    broken(copy => { copy.version = 6; }),
  ]) {
    assert.throws(() => target.previewBackup(bad));
    await assert.rejects(target.restoreBackup(bad));
  }
  assert.deepEqual(await target.readSnapshot(), state);
});

test('the released backup 4 imports with identifiers and references kept, and never erases the quiz answer of this device', async context => {
  const storage = await files(context);
  const original = JSON.parse(releasedBackup);
  const fresh = await createLocalRepository(storage.open('fresh.sqlite'));
  const preview = fresh.previewBackup(releasedBackup);
  assert.equal(preview.version, 4); assert.equal(preview.counts.trainingQuizzes, 0); assert.equal(preview.counts.readinessReferences, 1); assert.equal(preview.counts.workouts, 7);
  await fresh.restoreBackup(releasedBackup);
  const restored = await fresh.readSnapshot();
  assert.deepEqual(restored.trainingQuizzes, [], 'an older backup on a fresh installation: the quiz is offered once');
  assert.deepEqual(restored.readinessReferences.map(withoutRevision), original.readinessReferences.map(withoutRevision));
  assert.deepEqual(restored.workouts.map(entry => entry.id).sort(), original.workouts.filter(entry => !entry.deletedAt).map(entry => entry.id).sort());
  for (const workout of restored.workouts) assert.deepEqual(workout.loadCalculation, original.workouts.find(entry => entry.id === workout.id).loadCalculation);
  assert.deepEqual(restored.wellness.map(withoutRevision), original.wellness.map(withoutRevision));
  assert.equal(JSON.parse(await fresh.exportBackup()).readinessReferences.length, 1);

  // A device where the quiz was answered (or skipped) imports the same older backup.
  for (const status of ['completed', 'skipped']) {
    const database = storage.open(`${status}.sqlite`), repository = await createLocalRepository(database);
    await repository.saveProfile(profileInput);
    const quiz = await repository.saveTrainingQuiz({ ...own, status, answers: status === 'completed' ? answers : null });
    await repository.restoreBackup(releasedBackup);
    const after = await repository.readSnapshot();
    assert.equal(after.profile.displayName, original.profile.displayName);
    assert.deepEqual(withoutRevision(after.trainingQuizzes[0]), withoutRevision(quiz), `${status} is remembered after importing an older backup`);
    assert.ok(after.trainingQuizzes[0].revision > quiz.revision, 'stale forms are invalidated like every restored record');
    // A backup without a profile removes the profile and with it the answers.
    const empty = JSON.stringify({ ...JSON.parse(await repository.exportBackup()), profile: null, workouts: [], wellness: [], periods: [], events: [], goals: [], drafts: [], readinessReferences: [], trainingQuizzes: [], customExercises: [], exerciseNotes: [], templates: [], exerciseRoles: [], muscleTargets: [] });
    await repository.restoreBackup(empty);
    assert.deepEqual(await database.query('SELECT * FROM local_training_quiz'), []);
  }
});

test('a failed restore rolls the quiz row back together with everything else', async context => {
  const storage = await files(context); let fail = false;
  const database = storage.open('training.sqlite', sql => fail && sql.startsWith('INSERT INTO local_training_quiz'));
  const repository = await createLocalRepository(database);
  await repository.saveProfile(profileInput);
  await repository.saveTrainingQuiz({ ...own, status: 'completed', answers });
  const backup = await repository.exportBackup(), before = await repository.readSnapshot();
  await repository.saveTrainingQuiz({ ...own, status: 'completed', answers: { ...answers, typicalMinutes: 30 } });
  const changed = await repository.readSnapshot();
  fail = true;
  await assert.rejects(repository.restoreBackup(backup), /storage failure/);
  assert.deepEqual(await repository.readSnapshot(), changed);
  fail = false;
  await repository.restoreBackup(backup);
  assert.deepEqual((await repository.readSnapshot()).trainingQuizzes[0].answers, before.trainingQuizzes[0].answers);
});
