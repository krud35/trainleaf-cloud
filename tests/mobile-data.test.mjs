import { test, mock } from 'node:test';
// Existing historical fixtures stay deterministic as the calendar advances.
mock.timers.enable({ apis: ['Date'], now: new Date('2026-12-31T12:00:00Z') });
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtemp, rm } from 'node:fs/promises';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { createHash } from 'node:crypto';

const root = path.resolve(import.meta.dirname, '..');
const require = createRequire(import.meta.url);
const modules = new Map();
function loadTs(file) {
  const absolute = path.resolve(root, file);
  if (modules.has(absolute)) return modules.get(absolute).exports;
  const compiledModule = { exports: {} };
  modules.set(absolute, compiledModule);
  const js = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const localRequire = name => name.startsWith('.')
    ? loadTs(path.relative(root, path.resolve(path.dirname(absolute), `${name}.ts`)))
    : require(name);
  new Function('require', 'module', 'exports', js)(localRequire, compiledModule, compiledModule.exports);
  return compiledModule.exports;
}
const { createLocalRepository } = loadTs('mobile/src/data/repository.ts');
const { DATABASE_VERSION, migrateDatabase } = loadTs('mobile/src/data/database.ts');
const { RevisionConflictError } = loadTs('mobile/src/data/domain.ts');

/** Real SQLite with a file on disk; no in-memory mock of SQL semantics. */
function openDatabase(filename, failOn = () => false) {
  const connection = new DatabaseSync(filename);
  let tail = Promise.resolve();
  const enqueue = operation => {
    const result = tail.then(operation);
    tail = result.catch(() => {});
    return result;
  };
  const executor = {
    async execute(sql, params = []) {
      if (failOn(sql, params)) throw new Error('Simulated storage failure');
      const result = connection.prepare(sql).run(...params);
      return { changes: Number(result.changes) };
    },
    async query(sql, params = []) {
      return connection.prepare(sql).all(...params);
    },
  };
  return {
    execute: (sql, params) => enqueue(() => executor.execute(sql, params)),
    query: (sql, params) => enqueue(() => executor.query(sql, params)),
    transaction: operation => enqueue(async () => {
      connection.exec('BEGIN IMMEDIATE');
      try {
        const result = await operation(executor);
        connection.exec('COMMIT');
        return result;
      } catch (error) {
        connection.exec('ROLLBACK');
        throw error;
      }
    }),
    close: () => enqueue(() => connection.close()),
  };
}

async function fixture(context) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'training-local-test-'));
  const filename = path.join(directory, 'training.sqlite');
  const databases = [];
  context.after(async () => {
    for (const database of databases.reverse()) {
      await database.close().catch(() => {});
    }
    await rm(directory, { recursive: true, force: true });
  });
  return {
    filename,
    open(failOn) {
      const database = openDatabase(filename, failOn);
      databases.push(database);
      return database;
    },
  };
}

const profileInput = {
  displayName: 'Alicja', roles: ['athlete'], sportIds: ['ultimate', 'running'], modules: ['journal'],
};
const workoutInput = {
  profileId: 'local-profile', sportId: 'ultimate', date: '2026-10-03',
  title: 'Trening podań', durationMinutes: 65, rpe: 0, notes: 'Bez internetu. Zażółć gęślą jaźń.',
};

for (const variant of ['released-v5','preview-events-only-v6']) test(`real frozen 0.2.0 SQLite fixture ${variant} upgrades losslessly and atomically to v7`, async context => {
  const fixtureRoot=path.join(root,'tests/support/mobile-0.2-fixture');
  const provenance=JSON.parse(fs.readFileSync(path.join(fixtureRoot,'provenance.json'),'utf8'));
  const dbBytes=fs.readFileSync(path.join(fixtureRoot,'released-v5.sqlite'));
  const backupV3=fs.readFileSync(path.join(fixtureRoot,'backup-v3.json'),'utf8');
  assert.equal(provenance.app.versionName,'0.2.0'); assert.equal(provenance.database.schemaVersion,5);
  assert.equal(createHash('sha256').update(dbBytes).digest('hex'),provenance.database.sha256);
  assert.equal(createHash('sha256').update(backupV3).digest('hex'),provenance.backup.sha256);
  const original=JSON.parse(backupV3), measured=original.workouts.find(w=>w.loadCalculation), created={draft:original.drafts[0]};
  assert.equal(original.version,3); assert.ok(measured); assert.ok(created.draft);
  const files=await fixture(context); let fail=false;
  fs.writeFileSync(files.filename,dbBytes);
  const database=files.open(sql=>fail && sql.startsWith('CREATE TABLE IF NOT EXISTS local_muscle_targets'));
  assert.equal((await database.query('PRAGMA user_version'))[0].user_version,5);
  if (variant==='preview-events-only-v6') {
    await database.execute(`CREATE TABLE local_events (id TEXT PRIMARY KEY NOT NULL, profile_id TEXT NOT NULL REFERENCES local_profiles(id), revision INTEGER NOT NULL CHECK (revision > 0), created_at TEXT NOT NULL, updated_at TEXT NOT NULL, sync_state TEXT NOT NULL CHECK (sync_state = 'local-only'), payload TEXT NOT NULL)`);
    const event={id:'preview-event',profileId:'local-profile',revision:1,createdAt:measured.createdAt,updatedAt:measured.updatedAt,syncState:'local-only',kind:'trip',title:'Wcześniej zapisany wyjazd',start:'2027-01-01',end:'2027-01-03',time:null,location:'Polska',notes:'Zachowaj bez zmian',availability:null};
    await database.execute('INSERT INTO local_events VALUES (?,?,?,?,?,?,?)',[event.id,event.profileId,event.revision,event.createdAt,event.updatedAt,event.syncState,JSON.stringify(event)]);
    await database.execute('PRAGMA user_version = 6');
  }
  const versionBefore=variant==='released-v5'?5:6;
  const tables=(await database.query("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'local_%' ORDER BY name")).map(row=>row.name);
  const before=Object.fromEntries(await Promise.all(tables.map(async name=>[name,await database.query(`SELECT * FROM ${name} ORDER BY id`)])));
  fail=true; await assert.rejects(createLocalRepository(database),/storage failure/);
  assert.equal((await database.query('PRAGMA user_version'))[0].user_version,versionBefore);
  for (const name of tables) assert.deepEqual(await database.query(`SELECT * FROM ${name} ORDER BY id`),before[name]);
  assert.equal((await database.query('PRAGMA table_info(local_workouts)')).some(column=>column.name==='planned_fatigue'),false);
  fail=false; const upgraded=await createLocalRepository(database); const snapshot=await upgraded.readSnapshot();
  assert.equal((await database.query('PRAGMA user_version'))[0].user_version,DATABASE_VERSION);
  for (const name of tables) {
    const rows=await database.query(`SELECT * FROM ${name} ORDER BY id`);
    if (name==='local_workouts') for (const row of rows) { delete row.planned_fatigue; delete row.planned_load_calculation; }
    assert.deepEqual(rows,before[name]);
  }
  assert.deepEqual(snapshot.workouts.find(w=>w.id===measured.id).loadCalculation,measured.loadCalculation);
  assert.deepEqual(snapshot.drafts.find(d=>d.id===created.draft.id).raw,created.draft.raw);
  assert.equal(snapshot.events.length,variant==='preview-events-only-v6'?1:0);
  await migrateDatabase(database); assert.deepEqual(await upgraded.readSnapshot(),snapshot);
  assert.equal(upgraded.previewBackup(backupV3).version,3); assert.equal(JSON.parse(await upgraded.exportBackup()).version,5);
  await upgraded.close();
  const reopened=await createLocalRepository(files.open()); assert.deepEqual(await reopened.readSnapshot(),snapshot);
});

test('repair migration seven is a no-op for full version six with saved new collections and planned load', async context => {
  const files=await fixture(context); const database=files.open(); const repository=await createLocalRepository(database);
  await repository.saveProfile(profileInput);
  await repository.createWorkout({...workoutInput,wasPlanned:true,trainingType:'team',plannedMinutes:30,plannedFatigue:{aerobicFatigue:5,muscularFatigue:5}});
  await repository.createReadinessReference({...own,name:'Zapisane odniesienie',source:'example-week',weekStart:'2026-12-21',dailyLoads:[10,0,20,0,0,0,0],confirmedComplete:true});
  await repository.createExerciseRoles({...own,exerciseId:getBuiltinExercises()[0].id,roles:[{muscle:'quads',role:'direct'}]});
  await repository.createMuscleTarget({...own,muscle:'quads',unit:'effectiveSets',target:0,start:'2026-12-28',end:'2027-01-31',provenance:'własny'});
  const before=await repository.readSnapshot(); const workoutRows=await database.query('SELECT * FROM local_workouts');
  await database.execute('DROP TABLE local_training_quiz'); await database.execute('PRAGMA user_version = 6');
  await migrateDatabase(database); await migrateDatabase(database);
  assert.equal((await database.query('PRAGMA user_version'))[0].user_version,DATABASE_VERSION);
  assert.deepEqual(await repository.readSnapshot(),before); assert.deepEqual(await database.query('SELECT * FROM local_workouts'),workoutRows);
});

test('day-count goal limits apply only to new writes, with inclusive ranges and lossless old backup reads', async context => {
  const files=await fixture(context); const repository=await createLocalRepository(files.open()); await repository.saveProfile(profileInput);
  for (const metric of ['activeDays','checkinDays']) {
    const input={...own,name:'Cel dni',metric,cadence:'weekly',target:7};
    const goal=await repository.createGoal(input);
    await assert.rejects(repository.createGoal({...input,target:8}),/liczby dni/);
    await assert.rejects(repository.updateGoal(goal.id,goal.revision,{...input,target:8}),/liczby dni/);
    await repository.createGoal({...input,cadence:'range',start:'2026-12-30',end:'2027-01-01',target:3});
    await assert.rejects(repository.createGoal({...input,cadence:'range',start:'2026-12-30',end:'2027-01-01',target:4}),/liczby dni/);
  }
  const backup=JSON.parse(await repository.exportBackup()); backup.goals[0].target=20;
  await repository.restoreBackup(JSON.stringify(backup));
  assert.equal((await repository.readSnapshot()).goals.find(g=>g.id===backup.goals[0].id).target,20);
});

test('version five migrates atomically through six to seven without rewriting history, saved load, template payload or raw draft bytes', async context => {
  const files=await fixture(context); let fail=false;
  const database=files.open(sql=>fail && sql.includes('CREATE TABLE local_muscle_targets'));
  const repository=await createLocalRepository(database); await completeFixture(repository);
  await repository.createWorkout({...workoutInput,trainingType:'strength',postWorkout:{aerobicFatigue:5,muscularFatigue:5}});
  for (const column of ['planned_fatigue','planned_load_calculation']) await database.execute(`ALTER TABLE local_workouts DROP COLUMN ${column}`);
  for (const table of ['events','readiness_references','exercise_roles','muscle_targets']) await database.execute(`DROP TABLE local_${table}`);
  await database.execute('DROP TABLE local_training_quiz'); await database.execute('PRAGMA user_version = 5');
  const rows=await database.query('SELECT * FROM local_workouts'), drafts=await database.query('SELECT * FROM local_drafts'), templates=await database.query('SELECT * FROM local_templates');
  fail=true; await assert.rejects(createLocalRepository(database),/storage failure/);
  assert.equal((await database.query('PRAGMA user_version'))[0].user_version,5);
  assert.deepEqual(await database.query('SELECT * FROM local_workouts'),rows);
  fail=false; const upgraded=await createLocalRepository(database); const state=await upgraded.readSnapshot();
  assert.equal((await database.query('PRAGMA user_version'))[0].user_version,DATABASE_VERSION);
  for (const row of await database.query('SELECT * FROM local_workouts')) { delete row.planned_fatigue; delete row.planned_load_calculation; assert.deepEqual(row,rows.find(old=>old.id===row.id)); }
  assert.deepEqual(await database.query('SELECT * FROM local_drafts'),drafts); assert.deepEqual(await database.query('SELECT * FROM local_templates'),templates);
  assert.ok(state.workouts.every(w=>w.plannedLoadCalculation===null && w.plannedFatigue.aerobicFatigue===null));
  assert.deepEqual(state.events,[]); assert.deepEqual(state.muscleTargets,[]); assert.deepEqual(state.readinessReferences,[]);
});

test('planned load snapshots preserve old parameters and actual load through notes, copies and backup; changed assumptions recompute only plan', async context => {
  const files=await fixture(context); const repository=await createLocalRepository(files.open()); await repository.saveProfile(profileInput);
  const input={...workoutInput,wasPlanned:true,trainingType:'strength',plannedMinutes:60,plannedFatigue:{aerobicFatigue:5,muscularFatigue:5},postWorkout:{aerobicFatigue:5,muscularFatigue:5}};
  const original=await repository.createWorkout(input); assert.equal(original.plannedLoadCalculation.value,78);
  const changed=await repository.updateWorkout(original.id,original.revision,{...input,plannedFatigue:{aerobicFatigue:0,muscularFatigue:0}});
  assert.equal(changed.plannedLoadCalculation.value,19.5); assert.deepEqual(changed.loadCalculation,original.loadCalculation);
  const backup=JSON.parse(await repository.exportBackup()); const entry=backup.workouts[0];
  entry.plannedLoadCalculation.parameters.weights.strength=2; entry.plannedLoadCalculation.parameters.typeWeight=2; entry.plannedLoadCalculation.value=30;
  await repository.restoreBackup(JSON.stringify(backup)); const imported=(await repository.readSnapshot()).workouts[0];
  const notes=await repository.updateWorkout(imported.id,imported.revision,{...input,plannedFatigue:{aerobicFatigue:0,muscularFatigue:0},notes:'tylko notatka'});
  assert.deepEqual(notes.plannedLoadCalculation,entry.plannedLoadCalculation); assert.deepEqual(notes.loadCalculation,original.loadCalculation);
  const corrupt=JSON.parse(await repository.exportBackup()); corrupt.workouts[0].plannedLoadCalculation.value=31;
  assert.throws(()=>repository.previewBackup(JSON.stringify(corrupt)),/obciąż|load|wynik/i);
  assert.deepEqual((await repository.readSnapshot()).workouts[0],notes);
  const copied=await repository.copyWorkout(notes.id,'2027-01-04');
  assert.deepEqual(copied.plannedLoadCalculation,notes.plannedLoadCalculation); assert.equal(copied.loadCalculation,null);
  assert.deepEqual(copied.plannedFatigue,notes.plannedFatigue);
});

test('forecast references, explicit exercise roles and append-only muscle targets round-trip with revisions, recovery and no history rewrites', async context => {
  const files=await fixture(context); let failRestore=false; const database=files.open(sql=>failRestore && sql.startsWith('INSERT INTO local_muscle_targets')); const repository=await createLocalRepository(database); await repository.saveProfile(profileInput);
  const state=await repository.readSnapshot();
  const referenceInput={...own,name:'Mój tydzień',source:'example-week',weekStart:'2026-12-21',dailyLoads:[60,0,30,0,0,10,0],confirmedComplete:true,confirmedRestDays:['2026-12-30']};
  const reference=await repository.createReadinessReference(referenceInput,state.epoch); assert.equal(reference.referenceLoad,100);
  await assert.rejects(repository.createReadinessReference({...referenceInput,dailyLoads:[0,0,0,0,0,0,0]}));
  const exerciseId=getBuiltinExercises()[0].id; const roles=await repository.createExerciseRoles({...own,exerciseId,roles:[{muscle:'quads',role:'direct'}]},state.epoch);
  await assert.rejects(repository.createExerciseRoles({...own,exerciseId,roles:[{muscle:'quads',role:'indirect'}]}),/konfiguracja/);
  const targetInput={...own,muscle:'quads',unit:'effectiveSets',target:8,start:'2026-12-28',end:'2027-03-31',provenance:'własny cel'};
  const target=await repository.createMuscleTarget(targetInput,state.epoch);
  await assert.rejects(repository.createMuscleTarget({...targetInput,start:'2026-12-21'}),/poniedział|przeszło|aktual/i);
  const next=await repository.reviseMuscleTarget(target.id,target.revision,{...targetInput,start:'2027-01-04',target:12},state.epoch);
  assert.equal(next.supersedesId,target.id); assert.equal(next.definitionRevision,2);
  await assert.rejects(repository.reviseMuscleTarget(target.id,target.revision,targetInput,state.epoch),RevisionConflictError);
  const refreshedOld=(await repository.readSnapshot()).muscleTargets.find(t=>t.id===target.id);
  await assert.rejects(repository.reviseMuscleTarget(target.id,refreshedOld.revision,targetInput,state.epoch),RevisionConflictError);
  const {muscleTargetForWeek}=loadTs('mobile/src/data/analytics.ts');
  assert.equal(muscleTargetForWeek((await repository.readSnapshot()).muscleTargets,'quads','2026-12-28').target,8);
  assert.equal(muscleTargetForWeek((await repository.readSnapshot()).muscleTargets,'quads','2027-01-04').target,12);
  const override=await repository.createMuscleWeekOverride({...own,muscle:'quads',unit:'effectiveSets',target:0,weekStart:'2026-10-05',provenance:'jawna korekta historycznego tygodnia'},state.epoch);
  assert.equal(override.end,'2026-10-11');
  await assert.rejects(repository.createMuscleWeekOverride({...own,muscle:'quads',unit:'exposures',target:1.5,weekStart:'2026-10-05',provenance:'własny'}));
  const before=await repository.readSnapshot(); assert.equal(before.muscleTargets.find(t=>t.id===target.id).target,8);
  const backup=await repository.exportBackup(); assert.equal(repository.previewBackup(backup).counts.readinessReferences,1); assert.equal(repository.previewBackup(backup).counts.muscleTargets,3);
  failRestore=true; await assert.rejects(repository.restoreBackup(backup),/storage failure/); failRestore=false;
  assert.deepEqual(await repository.readSnapshot(),before);
  const {snapshotCsv}=loadTs('mobile/src/data/analytics.ts'); const csv=snapshotCsv(before); for (const type of ['odniesienie_prognozy','role_miesni','cel_miesnia']) assert.ok(csv.includes(type));
  await repository.restoreBackup(backup); const restored=await repository.readSnapshot();
  assert.equal(restored.readinessReferences[0].referenceLoad,100); assert.deepEqual(restored.exerciseRoles[0].roles,roles.roles); assert.equal(restored.muscleTargets.length,3);
  await assert.rejects(repository.updateReadinessReference(reference.id,reference.revision,referenceInput,state.epoch),RevisionConflictError);
  const bad=JSON.parse(backup); bad.readinessReferences[0].referenceLoad=999; assert.throws(()=>repository.previewBackup(JSON.stringify(bad)));
  const duplicate=JSON.parse(backup); duplicate.muscleTargets[1].definitionRevision=duplicate.muscleTargets[0].definitionRevision;
  assert.throws(()=>repository.previewBackup(JSON.stringify(duplicate)),/wersja/);
  const {exportRecoveryData}=loadTs('mobile/src/data/recovery.ts'); const rescue=JSON.parse(await exportRecoveryData(database));
  for (const table of ['local_readiness_references','local_exercise_roles','local_muscle_targets']) { assert.equal(rescue.tables[table].status,'ok'); assert.ok(rescue.tables[table].rows.length); }
});

test('profile and training survive closing and reopening the physical SQLite file without network', async context => {
  const files = await fixture(context);
  const repository = await createLocalRepository(files.open());
  assert.equal(await repository.getProfile(), null);
  const profile = await repository.saveProfile(profileInput);
  const workout = await repository.createWorkout(workoutInput);
  assert.equal(workout.rpe, 0);
  assert.equal(workout.syncState, 'local-only');
  await repository.close();
  assert.ok(fs.statSync(files.filename).size > 0);

  const reopened = await createLocalRepository(files.open());
  assert.deepEqual(await reopened.getProfile(), profile);
  assert.deepEqual(await reopened.listWorkouts(profile.id), [workout]);
  assert.deepEqual(await reopened.listWorkouts('a-different-person'), []);
});

test('profile preferences can change without removing historical sports or workouts', async context => {
  const files = await fixture(context);
  const repository = await createLocalRepository(files.open());
  const first = await repository.saveProfile(profileInput);
  const workout = await repository.createWorkout(workoutInput);
  const updated = await repository.saveProfile({ ...profileInput,
    roles: ['athlete', 'coach'], sportIds: ['running'], modules: ['journal', 'planning', 'learning'],
  }, first.revision);
  assert.equal(updated.revision, 2);
  assert.deepEqual(updated.roles, ['athlete', 'coach']);
  assert.equal(updated.createdAt, first.createdAt);
  assert.deepEqual(await repository.listWorkouts(first.id), [workout]);
  await assert.rejects(repository.createWorkout(workoutInput), /sport dodany/);
  const historyEdit = await repository.updateWorkout(workout.id, workout.revision, {
    ...workoutInput, notes: 'Korekta dawnego treningu',
  });
  assert.equal(historyEdit.notes, 'Korekta dawnego treningu');
  await assert.rejects(repository.saveProfile(profileInput, first.revision), RevisionConflictError);
  await assert.rejects(repository.saveProfile(profileInput), RevisionConflictError);
});

test('invalid dates, nonfinite measurements and mismatched profile are rejected before writing', async context => {
  const files = await fixture(context);
  const repository = await createLocalRepository(files.open());
  await assert.rejects(repository.createWorkout(workoutInput), /utwórz profil/);
  await repository.saveProfile(profileInput);
  for (const patch of [
    { date: '2026-02-29' }, { date: '2026-02-30' }, { date: '0000-01-01' },
    { date: '2026-1-01' }, { durationMinutes: Infinity }, { durationMinutes: NaN },
    { durationMinutes: -1 }, { durationMinutes: 1441 }, { durationMinutes: 1.5 },
    { rpe: -1 }, { rpe: 11 }, { rpe: 3.5 },
    { notes: 'x'.repeat(10001) }, { sportId: 'unknown' },
    { profileId: 'someone-else' },
  ]) {
    await assert.rejects(repository.createWorkout({ ...workoutInput, ...patch }));
  }
  assert.deepEqual(await repository.listWorkouts('local-profile'), []);
  const leap = await repository.createWorkout({ ...workoutInput, date: '2028-02-29', rpe: null, status: 'planned' });
  assert.equal(leap.date, '2028-02-29');
  assert.equal(leap.rpe, null);
  await assert.rejects(repository.saveProfile({ ...profileInput, sportIds: ['running', 'running'] }, 1));
});

test('entity revisions prevent stale edits and deletions, retaining a local tombstone', async context => {
  const files = await fixture(context);
  const database = files.open();
  const repository = await createLocalRepository(database);
  await repository.saveProfile(profileInput);
  const original = await repository.createWorkout(workoutInput);
  const edits = await Promise.allSettled([
    repository.updateWorkout(original.id, 1, { ...workoutInput, title: 'Pierwsza zmiana' }),
    repository.updateWorkout(original.id, 1, { ...workoutInput, title: 'Nieaktualna zmiana' }),
  ]);
  assert.equal(edits.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(edits[1].reason instanceof RevisionConflictError, true);
  const current = (await repository.listWorkouts(original.profileId))[0];
  assert.equal(current.title, 'Pierwsza zmiana');
  assert.equal(current.revision, 2);
  await assert.rejects(repository.deleteWorkout(current.id, 1), RevisionConflictError);
  await repository.deleteWorkout(current.id, 2);
  assert.deepEqual(await repository.listWorkouts(current.profileId), []);
  const tombstone = (await database.query('SELECT * FROM local_workouts WHERE id = ?', [current.id]))[0];
  assert.equal(tombstone.revision, 3);
  assert.ok(tombstone.deleted_at);
  assert.equal(tombstone.sync_state, 'local-only');
  await assert.rejects(repository.deleteWorkout(current.id, 2), RevisionConflictError);
});

test('version one database migrates existing history, and repeated migration is harmless', async context => {
  const files = await fixture(context);
  const database = files.open();
  // Fixture representing the released version-one shape (before deletion metadata/index).
  await database.execute(`CREATE TABLE local_profiles (id TEXT PRIMARY KEY, display_name TEXT,
    roles TEXT, sport_ids TEXT, modules TEXT, revision INTEGER, created_at TEXT, updated_at TEXT, sync_state TEXT)`);
  await database.execute(`CREATE TABLE local_workouts (id TEXT PRIMARY KEY, profile_id TEXT,
    sport_id TEXT, date TEXT, title TEXT, duration_minutes INTEGER, rpe INTEGER, notes TEXT,
    revision INTEGER, created_at TEXT, updated_at TEXT, sync_state TEXT)`);
  await database.execute('PRAGMA user_version = 1');
  const timestamp = '2026-10-03T08:00:00.000Z';
  await database.execute('INSERT INTO local_profiles VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [
    'local-profile', 'Alicja', '["athlete"]', '["ultimate"]', '["journal"]', 1, timestamp, timestamp, 'local-only',
  ]);
  await database.execute('INSERT INTO local_workouts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
    'previous-workout', 'local-profile', 'ultimate', '2026-10-03', 'Historia', 40, 7, '', 1, timestamp, timestamp, 'local-only',
  ]);
  const repository = await createLocalRepository(database);
  await migrateDatabase(database);
  assert.equal((await database.query('PRAGMA user_version'))[0].user_version, DATABASE_VERSION);
  const workout = (await repository.listWorkouts('local-profile'))[0];
  assert.equal(workout.id, 'previous-workout');
  assert.equal(workout.deletedAt, null);
  assert.equal(workout.durationMinutes, 40);
  assert.equal((await database.query('SELECT revision_floor FROM local_revision_state WHERE id = 1'))[0].revision_floor, 0);
});

test('unsupported schema and failed migrations leave existing database unchanged', async context => {
  const files = await fixture(context);
  const database = files.open();
  await database.execute('PRAGMA user_version = 999');
  await assert.rejects(createLocalRepository(database), /nowszej/);
  assert.equal((await database.query('PRAGMA user_version'))[0].user_version, 999);
  assert.equal((await database.query("SELECT name FROM sqlite_master WHERE name = 'local_profiles'")).length, 0);
  await database.execute('PRAGMA user_version = 0');
  await database.close();
  const failing = files.open(sql => sql.includes('CREATE INDEX local_workouts_profile_date'));
  await assert.rejects(createLocalRepository(failing), /storage failure/);
  assert.equal((await failing.query('PRAGMA user_version'))[0].user_version, 0);
  assert.equal((await failing.query("SELECT name FROM sqlite_master WHERE name = 'local_profiles'")).length, 0);
});

test('version two gains a durable revision floor without changing existing profiles or tombstones', async context => {
  const files = await fixture(context);
  const database = files.open();
  const repository = await createLocalRepository(database);
  const profile = await repository.saveProfile(profileInput);
  const workout = await repository.createWorkout(workoutInput);
  await repository.deleteWorkout(workout.id, workout.revision);
  const tombstone = (await database.query('SELECT * FROM local_workouts WHERE id = ?', [workout.id]))[0];
  await database.execute('ALTER TABLE local_profiles DROP COLUMN visible_shortcuts');
  // Exact version-two shape: the revision-state table was introduced only in version three.
  for (const table of ['custom_exercises', 'exercise_notes', 'templates', 'periods', 'wellness', 'goals', 'drafts', 'events', 'readiness_references', 'exercise_roles', 'muscle_targets']) {
    await database.execute(`DROP TABLE local_${table}`);
  }
  await database.execute(`CREATE TABLE local_workouts_v2 AS SELECT id, profile_id, sport_id, date, title,
    duration_minutes, rpe, notes, revision, created_at, updated_at, sync_state, deleted_at FROM local_workouts`);
  await database.execute('DROP TABLE local_workouts');
  await database.execute('ALTER TABLE local_workouts_v2 RENAME TO local_workouts');
  await database.execute('DROP TABLE local_revision_state');
  await database.execute('DROP TABLE local_training_quiz'); await database.execute('PRAGMA user_version = 2');
  await repository.close();

  const reopenedDatabase = files.open();
  const reopened = await createLocalRepository(reopenedDatabase);
  assert.deepEqual(await reopened.getProfile(), profile);
  assert.deepEqual((await reopenedDatabase.query('SELECT * FROM local_workouts WHERE id = ?', [workout.id]))[0], tombstone);
  assert.equal((await reopenedDatabase.query('PRAGMA user_version'))[0].user_version, DATABASE_VERSION);
  assert.equal((await reopenedDatabase.query('SELECT revision_floor FROM local_revision_state WHERE id = 1'))[0].revision_floor, 0);
  await reopened.restoreBackup(await reopened.exportBackup());
  assert.equal((await reopened.getProfile()).revision, tombstone.revision + 1);
});

test('validated backup restores the whole database atomically and rejects malformed or unrelated records', async context => {
  const files = await fixture(context);
  let failInserts = false;
  const database = files.open(sql => failInserts && sql.includes('INSERT INTO local_workouts'));
  const repository = await createLocalRepository(database);
  const profile = await repository.saveProfile(profileInput);
  const workout = await repository.createWorkout(workoutInput);
  const backup = await repository.exportBackup();
  const changed = await repository.updateWorkout(workout.id, 1, { ...workoutInput, title: 'Nowsze dane' });

  for (const corrupt of [
    'not JSON',
    JSON.stringify({ ...JSON.parse(backup), version: 55 }),
    JSON.stringify({ ...JSON.parse(backup), workouts: [{ ...workout, profileId: 'stranger' }] }),
    JSON.stringify({ ...JSON.parse(backup), workouts: [workout, workout] }),
    JSON.stringify({ ...JSON.parse(backup), workouts: [{ ...workout, syncState: 'shared' }] }),
  ]) await assert.rejects(repository.restoreBackup(corrupt));
  assert.deepEqual(await repository.listWorkouts(profile.id), [changed]);

  failInserts = true;
  await assert.rejects(repository.restoreBackup(backup), /storage failure/);
  assert.deepEqual(await repository.getProfile(), profile);
  assert.deepEqual(await repository.listWorkouts(profile.id), [changed]);

  failInserts = false;
  await repository.restoreBackup(backup);
  await repository.close();
  const reopened = await createLocalRepository(files.open());
  assert.deepEqual(await reopened.getProfile(), { ...profile, revision: changed.revision + 1 });
  assert.deepEqual(await reopened.listWorkouts(profile.id), [{ ...workout, revision: changed.revision + 1 }]);
});

test('restore invalidates stale profiles and workouts, including revisions from removed and imported history', async context => {
  const files = await fixture(context);
  const database = files.open();
  const repository = await createLocalRepository(database);
  const staleProfile = await repository.saveProfile(profileInput);
  const staleWorkout = await repository.createWorkout(workoutInput);
  const removed = await repository.createWorkout({ ...workoutInput, title: 'Usunięta historia' });
  await repository.deleteWorkout(removed.id, removed.revision);
  // A local tombstone can be newer than every record retained by an imported backup.
  await database.execute('UPDATE local_workouts SET revision = 12 WHERE id = ?', [removed.id]);
  const backup = {
    ...JSON.parse(await repository.exportBackup()),
    profile: { ...staleProfile, displayName: 'Profil z drugiego urządzenia' },
    workouts: [{ ...staleWorkout, title: 'Inna gałąź historii' }],
  };
  await repository.restoreBackup(JSON.stringify(backup));
  const restoredProfile = await repository.getProfile();
  const restoredWorkout = (await repository.listWorkouts(staleProfile.id))[0];
  assert.equal(restoredProfile.revision, 13);
  assert.equal(restoredWorkout.revision, 13);
  assert.equal(restoredWorkout.title, 'Inna gałąź historii');
  await assert.rejects(repository.saveProfile(profileInput, staleProfile.revision), RevisionConflictError);
  await assert.rejects(repository.updateWorkout(staleWorkout.id, staleWorkout.revision, workoutInput), RevisionConflictError);
  await assert.rejects(repository.deleteWorkout(staleWorkout.id, staleWorkout.revision), RevisionConflictError);
  assert.deepEqual(await repository.getProfile(), restoredProfile);
  assert.deepEqual(await repository.listWorkouts(staleProfile.id), [restoredWorkout]);

  // Imported tombstones participate in the same global maximum.
  backup.workouts.push({ ...removed, revision: 30, deletedAt: '2026-10-03T10:00:00.000Z' });
  await repository.restoreBackup(JSON.stringify(backup));
  assert.equal((await repository.getProfile()).revision, 31);
  assert.equal((await database.query('SELECT revision FROM local_workouts WHERE id = ?', [removed.id]))[0].revision, 31);
  await assert.rejects(repository.updateWorkout(restoredWorkout.id, restoredWorkout.revision, workoutInput), RevisionConflictError);
});

test('empty restore retains its revision floor across reopening and recreation of the fixed local profile', async context => {
  const files = await fixture(context);
  const database = files.open();
  const repository = await createLocalRepository(database);
  const staleProfile = await repository.saveProfile(profileInput);
  const emptyBackup = JSON.stringify({ format: 'training-companion-backup', version: 1,
    exportedAt: '2026-10-03T10:00:00.000Z', profile: null, workouts: [] });
  await repository.restoreBackup(emptyBackup);
  assert.equal(await repository.getProfile(), null);
  assert.deepEqual(await repository.listWorkouts(staleProfile.id), []);
  assert.equal((await database.query('SELECT revision_floor FROM local_revision_state WHERE id = 1'))[0].revision_floor, 2);
  await repository.close();

  const reopenedDatabase = files.open();
  const reopened = await createLocalRepository(reopenedDatabase);
  await reopened.restoreBackup(emptyBackup);
  const recreated = await reopened.saveProfile({ ...profileInput, displayName: 'Nowy profil' });
  assert.equal(recreated.revision, 4);
  await assert.rejects(reopened.saveProfile(profileInput, staleProfile.revision), RevisionConflictError);
  assert.deepEqual(await reopened.getProfile(), recreated);
});

test('restore refuses revision overflow before deleting data or advancing the revision floor', async context => {
  const files = await fixture(context);
  const database = files.open();
  const repository = await createLocalRepository(database);
  const profile = await repository.saveProfile(profileInput);
  const workout = await repository.createWorkout(workoutInput);
  const backup = JSON.parse(await repository.exportBackup());
  for (const imported of [
    { ...backup, profile: { ...profile, revision: Number.MAX_SAFE_INTEGER } },
    { ...backup, workouts: [{ ...workout, revision: Number.MAX_SAFE_INTEGER }] },
  ]) {
    await assert.rejects(repository.restoreBackup(JSON.stringify(imported)), /limit wersji/);
    assert.deepEqual(await repository.getProfile(), profile);
    assert.deepEqual(await repository.listWorkouts(profile.id), [workout]);
    assert.equal((await database.query('SELECT revision_floor FROM local_revision_state WHERE id = 1'))[0].revision_floor, 0);
  }
  await database.execute('UPDATE local_workouts SET revision = ? WHERE id = ?', [Number.MAX_SAFE_INTEGER, workout.id]);
  await assert.rejects(repository.restoreBackup(JSON.stringify(backup)), /limit wersji/);
  assert.equal((await repository.listWorkouts(profile.id))[0].revision, Number.MAX_SAFE_INTEGER);
  await database.execute('UPDATE local_workouts SET revision = 1 WHERE id = ?', [workout.id]);
  await database.execute('UPDATE local_revision_state SET revision_floor = ? WHERE id = 1', [Number.MAX_SAFE_INTEGER]);
  await assert.rejects(repository.restoreBackup(JSON.stringify(backup)), /limit wersji/);
  assert.deepEqual(await repository.getProfile(), profile);
  assert.deepEqual(await repository.listWorkouts(profile.id), [workout]);
});

test('failed restore rolls back the revision floor together with the data', async context => {
  const files = await fixture(context);
  let failInserts = false;
  const database = files.open(sql => failInserts && sql.includes('INSERT INTO local_workouts'));
  const repository = await createLocalRepository(database);
  const profile = await repository.saveProfile(profileInput);
  const workout = await repository.createWorkout(workoutInput);
  const backup = await repository.exportBackup();
  failInserts = true;
  await assert.rejects(repository.restoreBackup(backup), /storage failure/);
  assert.equal((await database.query('SELECT revision_floor FROM local_revision_state WHERE id = 1'))[0].revision_floor, 0);
  assert.deepEqual(await repository.getProfile(), profile);
  assert.deepEqual(await repository.listWorkouts(profile.id), [workout]);
});

test('export and restore enforce the same UTF-8 byte limit without changing existing data', async context => {
  const files = await fixture(context);
  const database = files.open();
  const repository = await createLocalRepository(database);
  const profile = await repository.saveProfile(profileInput);
  const workout = await repository.createWorkout({ ...workoutInput, notes: '界'.repeat(10000) });
  const backup = { ...JSON.parse(await repository.exportBackup()),
    workouts: Array.from({ length: 900 }, (_, index) => ({ ...workout, id: `large-backup-${index}` })),
  };
  const text = JSON.stringify(backup, null, 2);
  assert.ok(text.length < 25 * 1024 * 1024, 'The character count alone would accept this oversized UTF-8 file.');
  assert.ok(Buffer.byteLength(text, 'utf8') > 25 * 1024 * 1024);
  await assert.rejects(repository.restoreBackup(text), /limit 25 MB/);
  assert.deepEqual(await repository.listWorkouts(profile.id), [workout]);
  await database.execute(`WITH RECURSIVE copies(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM copies WHERE n < 900)
    INSERT INTO local_workouts (id, profile_id, sport_id, date, title, duration_minutes, rpe, notes, revision,
      created_at, updated_at, sync_state, deleted_at) SELECT 'large-local-' || n, profile_id, sport_id, date, title,
    duration_minutes, rpe, notes, revision, created_at, updated_at, sync_state, deleted_at
    FROM copies CROSS JOIN local_workouts WHERE local_workouts.id = ?`, [workout.id]);
  await assert.rejects(repository.exportBackup(), /limit 25 MB/);
  assert.equal((await database.query('SELECT COUNT(*) AS count FROM local_workouts'))[0].count, 901);
  assert.deepEqual(await repository.getProfile(), profile);
});

const { getBuiltinExercises, getBuiltinTemplates, cloneTemplateSections } = loadTs('mobile/src/data/catalog.ts');
const { emptySections } = loadTs('mobile/src/data/domain.ts');
const own = { profileId: 'local-profile' };
function inputOf(entity) {
  const { id, revision, createdAt, updatedAt, syncState, deletedAt, ...input } = entity;
  return input;
}
function exerciseInput(name = 'Własny ruch') {
  return { ...own, name, category: 'strength', metric: 'kg', shares: [{ muscle: 'quads', weight: 1 }], video: '', notes: 'Wskazówka' };
}
function sampleSections(exercise = getBuiltinExercises()[0]) {
  return { warmup: [], main: [{ id: crypto.randomUUID(), exercise,
    planned: { sets: 3, quantity: 8, kg: 20, prescription: 'Kontrola', tempo: '3010', rest: '90 s', effort: 'RIR 2' },
    actual: { sets: 2, quantity: 8, kg: 18 }, athleteNotes: 'Zrobione' }], cooldown: [] };
}

test('completed empty sessions accept missing measurements and a default title; zero remains distinct from null', async context => {
  const files = await fixture(context);
  const repository = await createLocalRepository(files.open());
  await repository.saveProfile(profileInput);
  const unmeasured = await repository.createWorkout({ ...own, sportId: 'running', date: '2026-10-03' });
  assert.equal(unmeasured.title, 'Bieganie');
  assert.equal(unmeasured.status, 'completed');
  assert.equal(unmeasured.wasPlanned, false);
  assert.equal(unmeasured.durationMinutes, null);
  assert.equal(unmeasured.rpe, null);
  assert.deepEqual(unmeasured.sections, emptySections());
  const zero = await repository.createWorkout({ ...own, sportId: 'running', date: '2026-10-03', title: ' ', durationMinutes: 0, rpe: 0 });
  assert.equal(zero.durationMinutes, 0);
  assert.equal(zero.rpe, 0);
  const plan = await repository.createWorkout({ ...own, sportId: 'ultimate', date: '2026-10-04', status: 'planned', plannedMinutes: 90 });
  assert.equal(plan.wasPlanned, true);
  const completed = await repository.updateWorkout(plan.id, plan.revision, { ...inputOf(plan), wasPlanned: false, status: 'completed' });
  assert.equal(completed.wasPlanned, true, 'Completion retains the fact that the session was planned.');
  await repository.close();
  const reopened = await createLocalRepository(files.open());
  assert.deepEqual((await reopened.listWorkouts('local-profile')).find(w => w.id === unmeasured.id), unmeasured);
});

test('version one portable backups upgrade to completed journal entries with all historical data preserved', async context => {
  const files = await fixture(context);
  const repository = await createLocalRepository(files.open());
  const profile = await repository.saveProfile(profileInput);
  const oldWorkout = { ...workoutInput, id: 'legacy-portable', revision: 3, createdAt: '2026-10-03T10:00:00.000Z',
    updatedAt: '2026-10-03T10:00:00.000Z', syncState: 'local-only', deletedAt: null };
  const backup = JSON.stringify({ format: 'training-companion-backup', version: 1,
    exportedAt: '2026-10-03T10:00:00.000Z', profile, workouts: [oldWorkout] });
  assert.equal(repository.previewBackup(backup).version, 1);
  await repository.restoreBackup(backup);
  const state = await repository.readSnapshot();
  assert.equal(state.workouts[0].status, 'completed');
  assert.equal(state.workouts[0].wasPlanned, false);
  assert.equal(state.workouts[0].durationMinutes, oldWorkout.durationMinutes);
  assert.equal(state.workouts[0].notes, oldWorkout.notes);
  assert.equal(state.workouts[0].plannedMinutes, null);
  assert.deepEqual(state.workouts[0].sections, emptySections());
  assert.equal(state.epoch, 4);
  assert.equal(state.customExercises.length, 0);
});

async function completeFixture(repository) {
  const profile = await repository.saveProfile(profileInput);
  const exercise = await repository.createExercise(exerciseInput());
  const note = await repository.createExerciseNote({ ...own, exerciseId: exercise.id, notes: 'Moja notatka' });
  const builtinNote = await repository.createExerciseNote({ ...own, exerciseId: getBuiltinExercises()[0].id, notes: 'Lokalna wskazówka' });
  const period = await repository.createPeriod({ ...own, name: 'Sezon', level: 'macro', start: '2026-10-01', end: '2026-12-31', description: 'Opis', goal: 'Cel', preset: 'base' });
  const template = await repository.createTemplate({ ...own, name: 'Pełna sesja', sportId: 'ultimate', section: 'whole', sections: sampleSections(), notes: 'Plan szablonu' });
  const workout = await repository.createWorkout({ ...workoutInput, periodId: period.id, sections: sampleSections(), plannedMinutes: 60, planNotes: 'Założenia', wasPlanned: true });
  const wellness = await repository.createWellness({ ...own, date: '2026-10-03', slot: 'morning', answers: { sleepHours: 7.25, sleepQuality: 4, fatigue: 0 }, notes: 'Wyspana' });
  const goal = await repository.createGoal({ ...own, name: 'Regularnie', metric: 'count', cadence: 'weekly', target: 3, sportId: 'ultimate' });
  const draft = await repository.createDraft({ ...own, kind: 'workout', entityId: workout.id, baseRevision: workout.revision, epoch: 0,
    raw: { title: 'Jeszcze nie zapisano', duration: '1,5', sections: { main: [{ quantity: '' }] } } });
  return { profile, exercise, note, builtinNote, period, template, workout, wellness, goal, draft };
}

test('all domain entities survive SQLite reopening and a complete version four backup; restore invalidates every stale form', async context => {
  const files = await fixture(context);
  const repository = await createLocalRepository(files.open());
  const records = await completeFixture(repository);
  const original = await repository.readSnapshot();
  assert.equal(original.workouts.length, 1, 'No demo history is inserted.');
  const backup = await repository.exportBackup();
  const preview = repository.previewBackup(backup);
  assert.equal(preview.version, 5);
  assert.deepEqual(preview.counts, { workouts: 1, customExercises: 1, exerciseNotes: 2, templates: 1, periods: 1, wellness: 1, goals: 1, drafts: 1, events: 0, readinessReferences: 0, exerciseRoles: 0, muscleTargets: 0, trainingQuizzes: 0 });
  await repository.close();
  const reopened = await createLocalRepository(files.open());
  assert.deepEqual(await reopened.readSnapshot(), original);
  await reopened.restoreBackup(backup);
  const restored = await reopened.readSnapshot();
  assert.equal(restored.epoch, 2);
  for (const key of Object.keys(preview.counts)) {
    assert.deepEqual(restored[key], original[key].map(record => ({ ...record, revision: 2 })));
  }
  await assert.rejects(reopened.createWorkout(workoutInput, original.epoch), RevisionConflictError);
  await assert.rejects(reopened.createGoal(inputOf(records.goal), original.epoch), RevisionConflictError);
  await assert.rejects(reopened.updateExercise(records.exercise.id, 1, inputOf(records.exercise)), RevisionConflictError);
  await assert.rejects(reopened.deleteTemplate(records.template.id, 1), RevisionConflictError);
  await assert.rejects(reopened.updateDraft(records.draft.id, 2, inputOf(records.draft)), RevisionConflictError);
  const rebasedDraft = await reopened.updateDraft(records.draft.id, 2, { ...inputOf(records.draft), epoch: restored.epoch });
  assert.equal(rebasedDraft.baseRevision, 1, 'Reopening raw input does not silently authorize overwriting a restored workout.');
  await assert.rejects(reopened.updateWorkout(records.workout.id, rebasedDraft.baseRevision, inputOf(records.workout)), RevisionConflictError);
});

test('complete restore rolls back every table, all revisions and epoch on a late entity insert failure', async context => {
  const files = await fixture(context);
  let fail = false;
  const database = files.open(sql => fail && sql.includes('INSERT INTO local_drafts'));
  const repository = await createLocalRepository(database);
  await completeFixture(repository);
  const backup = await repository.exportBackup();
  const before = await repository.readSnapshot();
  fail = true;
  await assert.rejects(repository.restoreBackup(backup), /storage failure/);
  assert.deepEqual(await repository.readSnapshot(), before);
  fail = false;
  await repository.restoreBackup(backup);
  assert.equal((await repository.readSnapshot()).epoch, before.epoch + 2);
});

test('period hierarchy remains validated and historical assignment does not restrict session dates; deleting a parent detaches relationships without deleting sessions', async context => {
  const files = await fixture(context);
  const repository = await createLocalRepository(files.open());
  await repository.saveProfile(profileInput);
  const macro = await repository.createPeriod({ ...own, name: 'Jesień', level: 'macro', start: '2026-10-01', end: '2026-12-31' });
  const meso = await repository.createPeriod({ ...own, name: 'Październik', level: 'meso', parentId: macro.id, start: '2026-10-01', end: '2026-10-31' });
  const micro = await repository.createPeriod({ ...own, name: 'Tydzień', level: 'micro', parentId: meso.id, start: '2026-10-01', end: '2026-10-07' });
  await assert.rejects(repository.createPeriod({ ...own, name: 'Błędna hierarchia', level: 'micro', parentId: macro.id, start: '2026-10-01', end: '2026-10-07' }), /Cykl/);
  await assert.rejects(repository.updatePeriod(macro.id, 1, { ...inputOf(macro), start: '2026-10-04' }), /Cykl/);
  const workout = await repository.createWorkout({ ...workoutInput, periodId: micro.id });
  const moved = await repository.updateWorkout(workout.id, 1, { ...inputOf(workout), date: '2026-11-03' });
  assert.equal(moved.periodId, micro.id);
  assert.equal(moved.date, '2026-11-03');
  const independent = await repository.createPeriod({ ...own, name: 'Prosty okres', start: '2026-10-01', end: '2026-10-10' });
  assert.equal(independent.level, null);
  await repository.deletePeriod(meso.id, 1);
  const state = await repository.readSnapshot();
  assert.equal(state.periods.find(p => p.id === micro.id).parentId, null);
  assert.equal(state.periods.find(p => p.id === micro.id).revision, 2);
  await repository.deletePeriod(micro.id, 2);
  const detached = (await repository.readSnapshot()).workouts.find(w => w.id === workout.id);
  assert.equal(detached.periodId, null);
  assert.equal(detached.revision, 3);
  assert.equal(detached.durationMinutes, workout.durationMinutes);
  await assert.rejects(repository.updateWorkout(workout.id, workout.revision, inputOf(workout)), RevisionConflictError);
});

test('session and week copies reset execution, keep independent prescriptions and survive DST date shifts', async context => {
  const files = await fixture(context);
  const repository = await createLocalRepository(files.open());
  await repository.saveProfile(profileInput);
  const period = await repository.createPeriod({ ...own, name: 'Tydzień', start: '2026-10-19', end: '2026-10-25' });
  const original = await repository.createWorkout({ ...workoutInput, date: '2026-10-25', periodId: period.id, sections: sampleSections(), planNotes: 'Wspólne założenia', plannedMinutes: 70 });
  const copy = await repository.copyWorkout(original.id, '2026-10-26', 0, 1);
  assert.notEqual(copy.id, original.id);
  assert.equal(copy.status, 'planned'); assert.equal(copy.wasPlanned, true);
  assert.equal(copy.durationMinutes, null); assert.equal(copy.rpe, null); assert.equal(copy.notes, '');
  assert.equal(copy.periodId, null); assert.equal(copy.planNotes, original.planNotes);
  assert.equal(copy.plannedMinutes, 70);
  assert.equal(copy.sections.main[0].actual, null); assert.equal(copy.sections.main[0].athleteNotes, '');
  assert.notEqual(copy.sections.main[0].id, original.sections.main[0].id);
  assert.deepEqual(copy.sections.main[0].planned, original.sections.main[0].planned);
  const weekly = await repository.copyWeek('local-profile', '2026-10-25', '2026-11-01', 0);
  assert.equal(weekly.length, 1); assert.equal(weekly[0].date, '2026-11-01');
  copy.sections.main[0].planned.kg = 999;
  assert.equal((await repository.readSnapshot()).workouts.find(w => w.id === original.id).sections.main[0].planned.kg, 20);
  await assert.rejects(repository.copyWeek('local-profile', '2026-10-20', '2026-10-25'), /inny tydzień/);
  await repository.updateWorkout(original.id, 1, { ...inputOf(original), title: 'Aktualizacja' });
  await assert.rejects(repository.copyWorkout(original.id, '2026-10-26', 0, 1), RevisionConflictError);
});

test('archiving custom exercises preserves snapshots and notes; templates instantiate independent clean sections', async context => {
  const files = await fixture(context);
  const repository = await createLocalRepository(files.open());
  await repository.saveProfile(profileInput);
  const exercise = await repository.createExercise(exerciseInput());
  const { profileId, archivedAt, revision, createdAt, updatedAt, syncState, ...snapshot } = exercise;
  const workout = await repository.createWorkout({ ...workoutInput, sections: sampleSections(snapshot) });
  const note = await repository.createExerciseNote({ ...own, exerciseId: exercise.id, notes: 'Zachowaj' });
  await repository.deleteExercise(exercise.id, 1);
  const state = await repository.readSnapshot();
  assert.ok(state.customExercises[0].archivedAt);
  assert.deepEqual(state.exerciseNotes[0], note);
  assert.deepEqual(state.workouts[0].sections, workout.sections);
  const builtin = getBuiltinTemplates()[0];
  const sectionsA = cloneTemplateSections(builtin), sectionsB = cloneTemplateSections(builtin);
  assert.notEqual(Object.values(sectionsA).flat()[0].id, Object.values(sectionsB).flat()[0].id);
  const template = await repository.createTemplate({ ...own, name: 'Moja sekcja', sportId: 'ultimate', section: 'main', sections: sampleSections(snapshot) });
  const applied = cloneTemplateSections(template);
  assert.equal(applied.main[0].actual, null);
  await repository.updateExercise(exercise.id, 2, { ...inputOf(state.customExercises[0]), archivedAt: null, name: 'Nowa nazwa' });
  assert.equal((await repository.readSnapshot()).workouts[0].sections.main[0].exercise.name, 'Własny ruch');
  assert.equal(getBuiltinExercises().some(e => e.id === exercise.id), false);
});

test('strict backup preflight rejects duplicate IDs, broken references, invalid answers and nested unknown fields without mutation', async context => {
  const files = await fixture(context);
  const repository = await createLocalRepository(files.open());
  await completeFixture(repository);
  const before = await repository.readSnapshot();
  const backup = JSON.parse(await repository.exportBackup());
  const corruptions = [
    b => b.customExercises.push(b.customExercises[0]),
    b => { b.exerciseNotes[0].exerciseId = 'missing-exercise'; },
    b => { b.workouts[0].periodId = 'missing-period'; },
    b => { b.goals[0].profileId = 'stranger'; },
    b => { b.wellness[0].answers = { energy: 4 }; },
    b => { b.templates[0].sections.main[0].planned.injection = 'unknown'; },
    b => { b.drafts[0].entityId = 'unknown'; },
    b => { b.periods[0].start = '2026-02-30'; },
    b => { b.workouts[0].sections.main.push(b.workouts[0].sections.main[0]); },
  ];
  for (const corrupt of corruptions) {
    const candidate = structuredClone(backup); corrupt(candidate);
    assert.throws(() => repository.previewBackup(JSON.stringify(candidate)));
    await assert.rejects(repository.restoreBackup(JSON.stringify(candidate)));
    assert.deepEqual(await repository.readSnapshot(), before);
  }
  await assert.rejects(repository.createWellness({ ...own, date: '2026-10-03', slot: 'morning', answers: { fatigue: 5 } }), /Jeden zapis/);
  await assert.rejects(repository.createGoal({ ...own, name: 'Cel', metric: 'count', cadence: 'range', target: 2 }), /początku/);
  await assert.rejects(repository.createGoal({ ...own, name: 'Cel', metric: 'count', cadence: 'weekly', target: 1.5 }), /całkowita/);
  await assert.rejects(repository.createDraft({ ...own, kind: 'workout', epoch: before.epoch,
    raw: { notes: '界'.repeat(34000) } }), /draftTooLarge/);
});

test('workout deletion removes dependent raw drafts in the same transaction', async context => {
  const files = await fixture(context);
  let fail = false;
  const repository = await createLocalRepository(files.open(sql => fail && sql.includes('DELETE FROM local_drafts WHERE')));
  const records = await completeFixture(repository);
  const before = await repository.readSnapshot();
  fail = true;
  await assert.rejects(repository.deleteWorkout(records.workout.id, 1), /storage failure/);
  assert.deepEqual(await repository.readSnapshot(), before);
  fail = false;
  await repository.deleteWorkout(records.workout.id, 1);
  const after = await repository.readSnapshot();
  assert.equal(after.workouts.length, 0);
  assert.equal(after.drafts.length, 0);
  const backup = JSON.parse(await repository.exportBackup());
  assert.ok(backup.workouts[0].deletedAt);
  assert.equal(backup.drafts.length, 0);
});

test('physical deletion retains the revision floor without changing the restore epoch or accepting resurrected stale forms', async context => {
  const files = await fixture(context);
  const database = files.open();
  const repository = await createLocalRepository(database);
  await repository.saveProfile(profileInput);
  const goal = await repository.createGoal({ ...own, name: 'Cel', cadence: 'weekly', metric: 'count', target: 3 });
  const backup = await repository.exportBackup();
  const stale = await repository.updateGoal(goal.id, goal.revision, { ...inputOf(goal), target: 4 });
  const final = await repository.updateGoal(goal.id, stale.revision, { ...inputOf(goal), target: 5 });
  await repository.deleteGoal(goal.id, final.revision);
  assert.equal((await database.query('SELECT revision_floor FROM local_revision_state'))[0].revision_floor, 4);
  assert.equal((await repository.readSnapshot()).epoch, 0, 'Deleting an entity does not invalidate unrelated forms.');
  await repository.restoreBackup(backup);
  const restored = await repository.readSnapshot();
  assert.equal(restored.goals[0].revision, 5);
  assert.equal(restored.epoch, 5);
  await assert.rejects(repository.updateGoal(goal.id, stale.revision, inputOf(stale)), RevisionConflictError);
});

test('committing a workout atomically consumes its exact raw draft and rolls both back on cleanup failure', async context => {
  const files = await fixture(context);
  let fail = false;
  const repository = await createLocalRepository(files.open(sql => fail && sql.includes('DELETE FROM local_drafts WHERE')));
  await repository.saveProfile(profileInput);
  const draft = await repository.createDraft({ ...own, kind: 'workout', epoch: 0, raw: { title: 'Nowy trening', duration: '' } });
  const reference = { id: draft.id, revision: draft.revision };
  const before = await repository.readSnapshot();
  fail = true;
  await assert.rejects(repository.createWorkout(workoutInput, 0, reference), /storage failure/);
  assert.deepEqual(await repository.readSnapshot(), before);
  fail = false;
  await assert.rejects(repository.createWorkout(workoutInput, 0, { ...reference, revision: 99 }), RevisionConflictError);
  assert.deepEqual(await repository.readSnapshot(), before);
  const workout = await repository.createWorkout(workoutInput, 0, reference);
  const committed = await repository.readSnapshot();
  assert.equal(committed.workouts.length, 1);
  assert.equal(committed.drafts.length, 0);
  assert.equal(committed.epoch, 0);
  const editDraft = await repository.createDraft({ ...own, kind: 'workout', entityId: workout.id, baseRevision: workout.revision,
    epoch: 0, raw: { title: 'Zmieniony trening' } });
  fail = true;
  await assert.rejects(repository.updateWorkout(workout.id, workout.revision, { ...inputOf(workout), title: 'Zmieniony trening' }, 0,
    { id: editDraft.id, revision: editDraft.revision }), /storage failure/);
  assert.equal((await repository.readSnapshot()).workouts[0].title, workout.title);
  fail = false;
  const updated = await repository.updateWorkout(workout.id, workout.revision, { ...inputOf(workout), title: 'Zmieniony trening' }, 0,
    { id: editDraft.id, revision: editDraft.revision });
  assert.equal(updated.title, 'Zmieniony trening');
  assert.equal((await repository.readSnapshot()).drafts.length, 0);
});

test('raw recovery exports malformed domain rows and intact records without migrating or changing the database', async context => {
  const { exportRecoveryData } = loadTs('mobile/src/data/recovery.ts');
  const files = await fixture(context);
  const database = files.open();
  const repository = await createLocalRepository(database);
  const records = await completeFixture(repository);
  const brokenProfile = '["athlete", invalid-json';
  const brokenSections = '{"main":"broken original value"';
  await database.execute('UPDATE local_profiles SET roles = ? WHERE id = ?', [brokenProfile, records.profile.id]);
  await database.execute('UPDATE local_workouts SET sections = ? WHERE id = ?', [brokenSections, records.workout.id]);
  await assert.rejects(repository.readSnapshot());
  await assert.rejects(repository.exportBackup());
  const beforeProfile = await database.query('SELECT * FROM local_profiles');
  const beforeWorkout = await database.query('SELECT * FROM local_workouts');
  const beforeVersion = await database.query('PRAGMA user_version');
  const rescue = JSON.parse(await exportRecoveryData(database));
  assert.equal(rescue.format, 'training-companion-recovery');
  assert.equal(rescue.complete, true, 'Malformed domain text is preserved as raw data, not falsely reported as a SQL read failure.');
  assert.equal(rescue.tables.local_profiles.rows[0].roles, brokenProfile);
  assert.equal(rescue.tables.local_workouts.rows[0].sections, brokenSections);
  assert.equal(rescue.tables.local_wellness.rows.length, 1);
  assert.equal(rescue.tables.local_drafts.rows.length, 1);
  assert.deepEqual(await database.query('SELECT * FROM local_profiles'), beforeProfile);
  assert.deepEqual(await database.query('SELECT * FROM local_workouts'), beforeWorkout);
  assert.deepEqual(await database.query('PRAGMA user_version'), beforeVersion);
  await assert.rejects(repository.restoreBackup(JSON.stringify(rescue)));
  await database.execute('PRAGMA user_version = 999');
  await assert.rejects(createLocalRepository(database), /nowszej/);
  const newerRescue = JSON.parse(await exportRecoveryData(database));
  assert.equal(newerRescue.databaseVersion[0].user_version, 999);
  assert.equal(newerRescue.tables.local_profiles.rows[0].roles, brokenProfile);
  assert.equal((await database.query('PRAGMA user_version'))[0].user_version, 999);
});

test('raw recovery reports unreadable tables explicitly and exports the other tables', async context => {
  const { exportRecoveryData } = loadTs('mobile/src/data/recovery.ts');
  const files = await fixture(context);
  const database = files.open();
  const repository = await createLocalRepository(database);
  await completeFixture(repository);
  const guarded = { ...database, transaction: operation => database.transaction(tx => operation({ ...tx,
    query: (sql, params) => sql.startsWith('SELECT * FROM "local_goals" ') ? Promise.reject(new Error('Damaged goal table')) : tx.query(sql, params),
  })) };
  const rescue = JSON.parse(await exportRecoveryData(guarded));
  assert.equal(rescue.complete, false);
  assert.equal(rescue.tables.local_goals.status, 'error');
  assert.match(rescue.tables.local_goals.error, /Damaged goal table/);
  assert.equal(rescue.tables.local_workouts.rows.length, 1);
  assert.deepEqual(rescue.errors, [{ source: 'local_goals', message: 'Damaged goal table' }]);
  assert.equal((await repository.readSnapshot()).goals.length, 1);
});

test('raw recovery size limit fails explicitly rather than exporting a truncated prefix', async context => {
  const { exportRecoveryData } = loadTs('mobile/src/data/recovery.ts');
  const files = await fixture(context);
  const database = files.open();
  const repository = await createLocalRepository(database);
  await repository.saveProfile(profileInput);
  await database.execute('UPDATE local_profiles SET display_name = ?', ['界'.repeat(9 * 1024 * 1024)]);
  await assert.rejects(exportRecoveryData(database), /limit 25 MB.*uciętego/s);
  assert.equal((await database.query('SELECT length(display_name) AS length FROM local_profiles'))[0].length, 9 * 1024 * 1024);
});

test('exact version three duration constraint is rebuilt atomically and accepts unmeasured history after reopening', async context => {
  const files = await fixture(context);
  let fail = false;
  const database = files.open(sql => fail && sql.includes('CREATE TABLE local_goals'));
  await database.execute(`CREATE TABLE local_profiles (id TEXT PRIMARY KEY NOT NULL CHECK (id = 'local-profile'),
    display_name TEXT NOT NULL, roles TEXT NOT NULL, sport_ids TEXT NOT NULL, modules TEXT NOT NULL,
    revision INTEGER NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, sync_state TEXT NOT NULL)`);
  await database.execute(`CREATE TABLE local_workouts (id TEXT PRIMARY KEY NOT NULL, profile_id TEXT NOT NULL REFERENCES local_profiles(id),
    sport_id TEXT NOT NULL, date TEXT NOT NULL, title TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes BETWEEN 1 AND 1440), rpe INTEGER, notes TEXT NOT NULL,
    revision INTEGER NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, sync_state TEXT NOT NULL, deleted_at TEXT)`);
  await database.execute('CREATE INDEX local_workouts_profile_date ON local_workouts(profile_id, deleted_at, date DESC, created_at DESC)');
  await database.execute('CREATE TABLE local_revision_state (id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1), revision_floor INTEGER NOT NULL)');
  await database.execute('INSERT INTO local_revision_state VALUES (1, 7)');
  await database.execute('PRAGMA user_version = 3');
  const timestamp = '2026-10-03T10:00:00.000Z';
  await database.execute('INSERT INTO local_profiles VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', ['local-profile', 'Alicja', '["athlete"]', '["ultimate","running"]', '["journal"]', 8, timestamp, timestamp, 'local-only']);
  await database.execute('INSERT INTO local_workouts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ['real-v3', 'local-profile', 'ultimate', '2026-10-03', 'Stary trening', 65, 0, 'Zachowane', 9, timestamp, timestamp, 'local-only', null]);
  fail = true;
  await assert.rejects(createLocalRepository(database), /storage failure/);
  assert.equal((await database.query('PRAGMA user_version'))[0].user_version, 3);
  assert.equal((await database.query('PRAGMA table_info(local_revision_state)')).some(column => column.name === 'epoch'), false);
  assert.equal((await database.query("SELECT name FROM sqlite_master WHERE name = 'local_custom_exercises'")).length, 0);
  assert.equal((await database.query('SELECT * FROM local_workouts'))[0].notes, 'Zachowane');
  fail = false;
  const repository = await createLocalRepository(database);
  const workout = (await repository.readSnapshot()).workouts[0];
  assert.equal(workout.status, 'completed'); assert.equal(workout.wasPlanned, false);
  assert.equal(workout.revision, 9); assert.equal(workout.rpe, 0); assert.equal(workout.durationMinutes, 65);
  await repository.updateWorkout(workout.id, workout.revision, { ...inputOf(workout), durationMinutes: null });
  await repository.close();
  const reopened = await createLocalRepository(files.open());
  assert.equal((await reopened.readSnapshot()).workouts[0].durationMinutes, null);
});

test('restoring captured draft tokens cannot alias the new workout revision or restore epoch', async context => {
  const files = await fixture(context);
  const repository = await createLocalRepository(files.open());
  await completeFixture(repository);
  const backup = JSON.parse(await repository.exportBackup());
  backup.drafts[0].baseRevision = 40;
  backup.drafts[0].epoch = 50;
  await repository.restoreBackup(JSON.stringify(backup));
  const restored = await repository.readSnapshot();
  assert.equal(restored.epoch, 51);
  assert.equal(restored.workouts[0].revision, 51);
  await assert.rejects(repository.updateWorkout(restored.workouts[0].id, 40, inputOf(restored.workouts[0]), 50), RevisionConflictError);
});

test('raw recovery preserves future-version user tables with safely quoted names and no database mutation', async context => {
  const { exportRecoveryData } = loadTs('mobile/src/data/recovery.ts');
  const files = await fixture(context);
  const database = files.open();
  const repository = await createLocalRepository(database);
  await repository.saveProfile(profileInput);
  const names = ['future"; DROP TABLE local_profiles; --', '__proto__', 'sqliteXfuture'];
  const quote = name => '"' + name.replaceAll('"', '""') + '"';
  for (const name of names) {
    await database.execute(`CREATE TABLE ${quote(name)} (id INTEGER PRIMARY KEY, original_text TEXT NOT NULL)`);
    await database.execute(`INSERT INTO ${quote(name)} VALUES (?, ?)`, [1, `Przyszłe dane: ${name}`]);
  }
  await database.execute('PRAGMA user_version = 999');
  const beforeSchema = await database.query('SELECT * FROM sqlite_master ORDER BY type, name');
  const beforeProfile = await database.query('SELECT * FROM local_profiles');
  const beforeRows = await Promise.all(names.map(name => database.query(`SELECT * FROM ${quote(name)}`)));
  const rescue = JSON.parse(await exportRecoveryData(database));
  assert.equal(rescue.complete, true);
  assert.equal(rescue.databaseVersion[0].user_version, 999);
  for (const [index, name] of names.entries()) {
    assert.equal(Object.hasOwn(rescue.tables, name), true);
    assert.equal(rescue.tables[name].status, 'ok');
    assert.deepEqual(rescue.tables[name].rows, JSON.parse(JSON.stringify(beforeRows[index])));
    assert.deepEqual(await database.query(`SELECT * FROM ${quote(name)}`), beforeRows[index]);
  }
  assert.deepEqual(await database.query('SELECT * FROM local_profiles'), beforeProfile);
  assert.deepEqual(await database.query('SELECT * FROM sqlite_master ORDER BY type, name'), beforeSchema);
  assert.equal((await database.query('PRAGMA user_version'))[0].user_version, 999);
});


test('v4 to v5 migration is atomic and preserves kg, tempo, history, raw drafts and template doses without inferring training types', async context => {
  const files = await fixture(context); let fail = false;
  const database = files.open(sql => fail && sql.includes('ADD COLUMN post_workout'));
  const repository = await createLocalRepository(database);
  await completeFixture(repository);
  const original = await repository.readSnapshot();
  const stripItem = item => { const copy = structuredClone(item); delete copy.supersetId; delete copy.planned.rir; if (copy.actual) delete copy.actual.rir; return copy; };
  const oldSections = sections => Object.fromEntries(Object.entries(sections).map(([key, items]) => [key, items.map(stripItem)]));
  const oldWorkout = original.workouts[0];
  const sections = oldSections(oldWorkout.sections);
  sections.main[0].planned.tempo = '3-1-X-0'; sections.main[0].planned.kg = 47.5;
  sections.main[0].actual.kg = 51;
  await database.execute('UPDATE local_workouts SET sections = ?', [JSON.stringify(sections)]);
  const oldTemplate = structuredClone(original.templates[0]); delete oldTemplate.trainingType; delete oldTemplate.supersets; oldTemplate.sections = oldSections(oldTemplate.sections);
  await database.execute('UPDATE local_templates SET payload = ?', [JSON.stringify(oldTemplate)]);
  for (const column of ['training_type', 'supersets', 'post_workout', 'load_calculation', 'planned_fatigue', 'planned_load_calculation']) await database.execute(`ALTER TABLE local_workouts DROP COLUMN ${column}`);
  await database.execute('ALTER TABLE local_profiles DROP COLUMN visible_shortcuts');
  await database.execute('DROP TABLE local_events');
  for (const table of ['readiness_references', 'exercise_roles', 'muscle_targets']) await database.execute(`DROP TABLE local_${table}`);
  await database.execute('DROP TABLE local_training_quiz'); await database.execute('PRAGMA user_version = 4');
  const before = await database.query('SELECT * FROM local_workouts');
  fail = true;
  await assert.rejects(createLocalRepository(database), /storage failure/);
  assert.equal((await database.query('PRAGMA user_version'))[0].user_version, 4);
  assert.equal((await database.query('PRAGMA table_info(local_profiles)')).some(column => column.name === 'visible_shortcuts'), false);
  assert.deepEqual(await database.query('SELECT * FROM local_workouts'), before);
  fail = false;
  const upgraded = await createLocalRepository(database);
  const state = await upgraded.readSnapshot();
  assert.equal((await database.query('PRAGMA user_version'))[0].user_version, DATABASE_VERSION);
  assert.equal(state.workouts[0].trainingType, null); assert.equal(state.templates[0].trainingType, null);
  assert.equal(state.workouts[0].sections.main[0].planned.kg, 47.5);
  assert.equal(state.workouts[0].sections.main[0].planned.rir, null);
  assert.equal(state.workouts[0].sections.main[0].planned.tempo, '3-1-X-0');
  assert.equal(state.workouts[0].sections.main[0].actual.kg, 51);
  assert.equal(state.workouts[0].revision, oldWorkout.revision);
  assert.deepEqual(state.drafts, original.drafts);
  assert.deepEqual(state.templates[0].sections.main[0].planned, { ...oldTemplate.sections.main[0].planned, rir: null });
  assert.deepEqual(state.profile.visibleShortcuts, ['history','library','templates','wellness','goals','periods','backup']);
  await upgraded.close();
  const reopened = await createLocalRepository(files.open());
  assert.deepEqual(await reopened.readSnapshot(), state);
});

test('future completed creates, edits and draft completion reject atomically while plans, raw drafts and legacy backup imports remain readable', async context => {
  const { today, addDays, trainingTotals } = loadTs('mobile/src/data/analytics.ts');
  const files = await fixture(context); const repository = await createLocalRepository(files.open());
  await repository.saveProfile(profileInput);
  const tomorrow = addDays(today(), 1);
  await assert.rejects(repository.createWorkout({ ...workoutInput, date: tomorrow }), /przyszłą/);
  const completed = await repository.createWorkout({ ...workoutInput, date: today() });
  await assert.rejects(repository.updateWorkout(completed.id, completed.revision, { ...inputOf(completed), date: tomorrow }), /przyszłą/);
  const plan = await repository.createWorkout({ ...workoutInput, date: tomorrow, status: 'planned' });
  const draft = await repository.createDraft({ ...own, kind: 'workout', entityId: plan.id, baseRevision: plan.revision, epoch: 0, raw: { date: tomorrow, status: 'completed', partial: '1,' } });
  const before = await repository.readSnapshot();
  await assert.rejects(repository.updateWorkout(plan.id, plan.revision, { ...inputOf(plan), status: 'completed' }, 0, { id: draft.id, revision: draft.revision }), /przyszłą/);
  assert.deepEqual(await repository.readSnapshot(), before);
  const backup = JSON.parse(await repository.exportBackup()); backup.workouts.find(workout => workout.id === plan.id).status = 'completed';
  await repository.restoreBackup(JSON.stringify(backup));
  const restored = await repository.readSnapshot();
  assert.equal(restored.workouts.find(workout => workout.id === plan.id).date, tomorrow);
  assert.equal(restored.workouts.find(workout => workout.id === plan.id).status, 'completed');
  assert.equal(trainingTotals(restored.workouts, today(), tomorrow).count, 1);
});

test('version two backups default new fields without changing original historical values or raw draft content', async context => {
  const files = await fixture(context); const repository = await createLocalRepository(files.open());
  await completeFixture(repository);
  const backup = JSON.parse(await repository.exportBackup()); backup.version = 2;
  for (const key of ['events','readinessReferences','exerciseRoles','muscleTargets']) delete backup[key];
  delete backup.profile.visibleShortcuts;
  for (const plan of [...backup.workouts, ...backup.templates]) {
    delete plan.trainingType; delete plan.supersets; delete plan.postWorkout; delete plan.loadCalculation; delete plan.plannedFatigue; delete plan.plannedLoadCalculation;
    for (const item of Object.values(plan.sections).flat()) {
      delete item.supersetId; delete item.muscleRoles; delete item.planned.rir; if (item.actual) delete item.actual.rir;
    }
  }
  const originals = structuredClone(backup);
  assert.equal(repository.previewBackup(JSON.stringify(backup)).version, 2);
  await repository.restoreBackup(JSON.stringify(backup));
  const exported = JSON.parse(await repository.exportBackup());
  assert.equal(exported.version, 5);
  assert.deepEqual(exported.drafts[0].raw, originals.drafts[0].raw);
  for (const key of ['workouts', 'templates']) {
    assert.equal(exported[key][0].trainingType, null);
    assert.deepEqual(exported[key][0].supersets, []);
    const oldItem = originals[key][0].sections.main[0]; const newItem = exported[key][0].sections.main[0];
    assert.deepEqual(newItem.exercise, oldItem.exercise);
    assert.deepEqual(newItem.planned, { ...oldItem.planned, rir: null });
    assert.deepEqual(newItem.actual, oldItem.actual && { ...oldItem.actual, rir: null });
  }
});

test('supersets, RIR, survey zero/null, training types and hidden shortcuts survive backup and copies remap groups and reset execution', async context => {
  const files = await fixture(context); const repository = await createLocalRepository(files.open());
  await repository.saveProfile({ ...profileInput, visibleShortcuts: [] });
  const base = sampleSections().main[0];
  const sections = { warmup: [], main: [3, 2, 1].map((sets, index) => ({ ...structuredClone(base), id: `group-member-${index}`, supersetId: 'group-original', planned: { ...base.planned, sets, kg: 72.5, rir: index }, actual: { ...base.actual, kg: 80, rir: 0 } })), cooldown: [] };
  const supersets = [{ id: 'group-original', section: 'main', transitionRest: '15 s', roundRest: '2 min' }];
  const workout = await repository.createWorkout({ ...workoutInput, trainingType: 'mental', sections, supersets, postWorkout: { aerobicFatigue: 0, muscularFatigue: null, satisfaction: 10, notes: 'Osobna ocena' } });
  const template = await repository.createTemplate({ ...own, name: 'Trzy ćwiczenia', sportId: 'ultimate', trainingType: 'strength', section: 'whole', sections, supersets });
  const copy = await repository.copyWorkout(workout.id, '2027-01-02');
  assert.equal(copy.trainingType, 'mental'); assert.equal(copy.sections.main.length, 3);
  assert.notEqual(copy.supersets[0].id, supersets[0].id);
  assert.deepEqual(copy.supersets[0], { ...supersets[0], id: copy.supersets[0].id });
  assert.deepEqual(copy.sections.main.map(item => item.exercise.id), sections.main.map(item => item.exercise.id));
  for (let index = 0; index < 3; index++) {
    assert.equal(copy.sections.main[index].supersetId, copy.supersets[0].id);
    assert.notEqual(copy.sections.main[index].id, sections.main[index].id);
    assert.deepEqual(copy.sections.main[index].planned, sections.main[index].planned);
    assert.equal(copy.sections.main[index].actual, null);
  }
  assert.deepEqual(copy.postWorkout, { aerobicFatigue: null, muscularFatigue: null, satisfaction: null, notes: '' });
  const backup = await repository.exportBackup(); await repository.restoreBackup(backup);
  const restored = await repository.readSnapshot();
  assert.deepEqual(restored.profile.visibleShortcuts, []);
  assert.deepEqual(restored.workouts.find(value => value.id === workout.id).postWorkout, workout.postWorkout);
  assert.deepEqual(restored.templates.find(value => value.id === template.id).supersets, supersets);
  const invalid = JSON.parse(backup); invalid.workouts[0].sections.main.splice(1, 0, { ...structuredClone(base), id: 'break-group' });
  await assert.rejects(repository.restoreBackup(JSON.stringify(invalid)), /sąsiadujących/);
  const invalidScale = JSON.parse(backup); invalidScale.workouts[0].postWorkout.aerobicFatigue = 11;
  await assert.rejects(repository.restoreBackup(JSON.stringify(invalidScale)));
});


test('load v1 is versioned, survives backup and notes-only edits, and recalculates only when physical inputs change', async context => {
  const files = await fixture(context); const repository = await createLocalRepository(files.open());
  await repository.saveProfile(profileInput);
  const record = await repository.createWorkout({ ...workoutInput, trainingType: 'strength', durationMinutes: 60,
    postWorkout: { aerobicFatigue: 5, muscularFatigue: 5, satisfaction: 10, notes: 'Ocena' } });
  assert.equal(record.loadCalculation.value, 78);
  const legacy = await repository.createWorkout({ ...workoutInput, trainingType: null, durationMinutes: 60 });
  assert.equal(legacy.loadCalculation, null);
  const backup = JSON.parse(await repository.exportBackup());
  // Represents a saved parameter snapshot which differs from the currently active constants.
  const saved = backup.workouts.find(workout => workout.id === record.id).loadCalculation;
  saved.parameters.typeWeight = 1.5; saved.parameters.weights.strength = 1.5; saved.value = 90;
  await repository.restoreBackup(JSON.stringify(backup));
  let restored = (await repository.readSnapshot()).workouts.find(workout => workout.id === record.id);
  assert.deepEqual(restored.loadCalculation, saved);
  restored = await repository.updateWorkout(restored.id, restored.revision, { ...inputOf(restored), notes: 'Inna notatka', date: '2026-10-02', postWorkout: { ...restored.postWorkout, satisfaction: 0, notes: 'Nowe odczucia' } });
  assert.deepEqual(restored.loadCalculation, saved);
  const changed = await repository.updateWorkout(restored.id, restored.revision, { ...inputOf(restored), durationMinutes: 30 });
  assert.equal(changed.loadCalculation.value, 39); assert.equal(changed.loadCalculation.parameters.typeWeight, 1.3);
  assert.equal(changed.loadCalculation.inputs.durationMinutes, 30);
  const cleared = await repository.updateWorkout(changed.id, changed.revision, { ...inputOf(changed), postWorkout: { ...changed.postWorkout, muscularFatigue: null } });
  assert.equal(cleared.loadCalculation, null);
  const mental = await repository.createWorkout({ ...workoutInput, trainingType: 'mental', durationMinutes: null });
  assert.equal(mental.loadCalculation.value, 0);
  const copied = await repository.copyWorkout(mental.id, '2027-01-02'); assert.equal(copied.loadCalculation, null);
  const planned = await repository.createWorkout({ ...workoutInput, trainingType: 'team', status: 'planned', durationMinutes: 60, postWorkout: { aerobicFatigue: 5, muscularFatigue: 5 } });
  assert.equal(planned.loadCalculation, null);
  const completed = await repository.updateWorkout(planned.id, planned.revision, { ...inputOf(planned), status: 'completed' });
  assert.equal(completed.loadCalculation.value, 60);
  await repository.close();
  const reopened = await createLocalRepository(files.open());
  assert.deepEqual((await reopened.readSnapshot()).workouts.find(workout => workout.id === completed.id).loadCalculation, completed.loadCalculation);
});


test('correcting an imported future completed date calculates a missing load without silently recalculating older null history on notes edits', async context => {
  const { today, addDays } = loadTs('mobile/src/data/analytics.ts');
  const files = await fixture(context); const repository = await createLocalRepository(files.open());
  await repository.saveProfile(profileInput);
  const source = await repository.createWorkout({ ...workoutInput, trainingType: 'running', durationMinutes: 60, postWorkout: { aerobicFatigue: 5, muscularFatigue: 5 } });
  const backup = JSON.parse(await repository.exportBackup());
  backup.workouts[0].date = addDays(today(), 1); backup.workouts[0].loadCalculation = null;
  await repository.restoreBackup(JSON.stringify(backup));
  const future = (await repository.readSnapshot()).workouts[0];
  assert.equal(future.loadCalculation, null);
  const corrected = await repository.updateWorkout(future.id, future.revision, { ...inputOf(future), date: today() });
  assert.equal(corrected.loadCalculation.value, 63);
  assert.equal(corrected.loadCalculation.inputs.trainingType, 'running');
  const old = JSON.parse(await repository.exportBackup()); old.workouts[0].loadCalculation = null;
  await repository.restoreBackup(JSON.stringify(old));
  const restored = (await repository.readSnapshot()).workouts[0];
  const notesOnly = await repository.updateWorkout(restored.id, restored.revision, { ...inputOf(restored), notes: 'Tylko notatka historyczna' });
  assert.equal(notesOnly.loadCalculation, null);
  assert.equal(notesOnly.id, source.id);
});

test('backup preview and restore reject mismatched saved load inputs, arithmetic and statuses atomically', async context => {
  const files = await fixture(context); const repository = await createLocalRepository(files.open());
  await repository.saveProfile(profileInput);
  await repository.createWorkout({ ...workoutInput, trainingType: 'strength', durationMinutes: 60, postWorkout: { aerobicFatigue: 5, muscularFatigue: 5 } });
  const backup = JSON.parse(await repository.exportBackup());
  const before = await repository.readSnapshot();
  const corruptions = [
    workout => { workout.loadCalculation.value = 0; },
    workout => { workout.loadCalculation.inputs.durationMinutes = 30; },
    workout => { workout.postWorkout.aerobicFatigue = 7; },
    workout => { workout.loadCalculation.parameters.typeWeight = 2; },
    workout => { workout.loadCalculation.parameters.weights.strength = 2; },
    workout => { workout.status = 'planned'; workout.wasPlanned = true; },
    workout => { workout.status = 'skipped'; },
    workout => { workout.trainingType = 'future-unknown-type'; },
    workout => { workout.postWorkout.muscularFatigue = 1.5; },
  ];
  for (const corrupt of corruptions) {
    const changed = structuredClone(backup); corrupt(changed.workouts[0]);
    assert.throws(() => repository.previewBackup(JSON.stringify(changed)));
    await assert.rejects(repository.restoreBackup(JSON.stringify(changed)));
    assert.deepEqual(await repository.readSnapshot(), before);
  }
  const future = structuredClone(backup); future.workouts[0].date = '2027-01-01';
  await repository.restoreBackup(JSON.stringify(future));
  assert.deepEqual((await repository.readSnapshot()).workouts[0].loadCalculation, backup.workouts[0].loadCalculation, 'valid imported future snapshots remain lossless');
});

test('raw database load corruption is reported by snapshot reads, history reads and normal export without overwriting the row', async context => {
  const files = await fixture(context); const database = files.open(); const repository = await createLocalRepository(database);
  await repository.saveProfile(profileInput);
  const workout = await repository.createWorkout({ ...workoutInput, trainingType: 'team', durationMinutes: 60, postWorkout: { aerobicFatigue: 5, muscularFatigue: 5 } });
  const invalid = { ...workout.loadCalculation, value: 0 };
  await database.execute('UPDATE local_workouts SET load_calculation = ? WHERE id = ?', [JSON.stringify(invalid), workout.id]);
  const before = await database.query('SELECT * FROM local_workouts');
  await assert.rejects(repository.readSnapshot(), /obciążenie/);
  await assert.rejects(repository.listWorkouts('local-profile'), /obciążenie/);
  await assert.rejects(repository.exportBackup(), /obciążenie/);
  assert.deepEqual(await database.query('SELECT * FROM local_workouts'), before);
});

test('historical period links do not block boundary changes while macro-meso-micro containment remains enforced', async context => {
  const files = await fixture(context); const repository = await createLocalRepository(files.open());
  await repository.saveProfile(profileInput);
  const period = await repository.createPeriod({ ...own, name: 'Samodzielny', start: '2026-10-01', end: '2026-10-10' });
  const workout = await repository.createWorkout({ ...workoutInput, periodId: period.id });
  const changed = await repository.updatePeriod(period.id, period.revision, { ...inputOf(period), start: '2026-11-01', end: '2026-11-10' });
  assert.equal(changed.start, '2026-11-01');
  assert.equal((await repository.readSnapshot()).workouts[0].periodId, workout.periodId);
});


test('local events use inclusive dates, independent availability, revisions, epoch, backup and physical deletion without creating workouts', async context => {
  const files = await fixture(context); const repository = await createLocalRepository(files.open());
  await repository.saveProfile(profileInput);
  const event = await repository.createEvent({ ...own, kind: 'trip', title: 'Wyjazd', start: '2027-01-01', end: '2027-01-03', time: '07:05', location: 'Góry', notes: 'Moja informacja' }, 0);
  assert.equal(event.availability, null); assert.equal((await repository.readSnapshot()).workouts.length, 0);
  await assert.rejects(repository.createEvent({ ...own, kind: 'event', title: 'Złe daty', start: '2026-10-04', end: '2026-10-03' }));
  await assert.rejects(repository.createEvent({ ...own, kind: 'competition', title: 'Zła godzina', start: '2026-10-03', end: '2026-10-03', time: '24:00' }));
  const updated = await repository.updateEvent(event.id, event.revision, { ...inputOf(event), availability: 'limited' }, 0);
  await assert.rejects(repository.updateEvent(event.id, event.revision, inputOf(event), 0), RevisionConflictError);
  const backup = await repository.exportBackup(); assert.equal(JSON.parse(backup).version, 5);
  assert.equal(repository.previewBackup(backup).counts.events, 1);
  await repository.restoreBackup(backup);
  const state = await repository.readSnapshot(); assert.equal(state.events[0].availability, 'limited');
  await assert.rejects(repository.deleteEvent(updated.id, updated.revision, 0), RevisionConflictError);
  const restored = state.events[0]; await repository.deleteEvent(restored.id, restored.revision, state.epoch);
  assert.deepEqual((await repository.readSnapshot()).events, []);
  const next = await repository.createEvent({ ...own, kind: 'event', title: 'Nowe', start: '2026-10-03', end: '2026-10-03' });
  assert.ok(next.revision > restored.revision);
});

test('wellness goal writes normalize sport while imported records remain lossless and all new goal targets validate', async context => {
  const files = await fixture(context); const repository = await createLocalRepository(files.open());
  await repository.saveProfile(profileInput);
  const base = { ...own, name: 'Mój cel', cadence: 'weekly', sportId: 'running' };
  const sleep = await repository.createGoal({ ...base, metric: 'sleepAverageHours', target: 7.5 });
  assert.equal(sleep.sportId, null);
  const checkin = await repository.createGoal({ ...base, metric: 'checkinDays', target: 4 }); assert.equal(checkin.sportId, null);
  const active = await repository.createGoal({ ...base, metric: 'activeDays', target: 3 }); assert.equal(active.sportId, 'running');
  for (const input of [{ metric: 'sleepAverageHours', target: 24.5 }, { metric: 'checkinDays', target: 1.5 }, { metric: 'activeDays', target: 2.2 }])
    await assert.rejects(repository.createGoal({ ...base, ...input }));
  const backup = JSON.parse(await repository.exportBackup()); backup.goals.find(goal => goal.id === sleep.id).sportId = 'running';
  await repository.restoreBackup(JSON.stringify(backup));
  const restored = (await repository.readSnapshot()).goals.find(goal => goal.id === sleep.id);
  assert.equal(restored.sportId, 'running');
  assert.equal(JSON.parse(await repository.exportBackup()).goals.find(goal => goal.id === sleep.id).sportId, 'running');
  const edited = await repository.updateGoal(restored.id, restored.revision, inputOf(restored)); assert.equal(edited.sportId, null);
});

test('version three backup supplies an empty event collection without modifying historical load or raw drafts', async context => {
  const files = await fixture(context); const repository = await createLocalRepository(files.open());
  await completeFixture(repository);
  const measured = await repository.createWorkout({ ...workoutInput, trainingType: 'strength', postWorkout: { aerobicFatigue: 5, muscularFatigue: 5 } });
  const backup = JSON.parse(await repository.exportBackup()); backup.version = 3; delete backup.events;
  for (const key of ['readinessReferences','exerciseRoles','muscleTargets']) delete backup[key];
  for (const plan of [...backup.workouts,...backup.templates]) {
    delete plan.plannedFatigue; delete plan.plannedLoadCalculation;
    for (const item of Object.values(plan.sections).flat()) delete item.muscleRoles;
  }
  const originalDraft = structuredClone(backup.drafts[0]);
  await repository.restoreBackup(JSON.stringify(backup));
  const state = await repository.readSnapshot(); assert.deepEqual(state.events, []);
  assert.deepEqual(state.readinessReferences,[]); assert.deepEqual(state.exerciseRoles,[]); assert.deepEqual(state.muscleTargets,[]);
  assert.ok(state.workouts.every(workout=>workout.plannedFatigue.aerobicFatigue===null && workout.plannedLoadCalculation===null));
  assert.deepEqual(state.drafts[0].raw, originalDraft.raw);
  assert.deepEqual(state.workouts.find(workout => workout.id === measured.id).loadCalculation, measured.loadCalculation);
});
