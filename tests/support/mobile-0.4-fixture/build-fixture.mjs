// Builds the frozen 0.4.0 (schema 7, backup 4) fixture. Run ONLY on the base commit named in
// provenance.json: the point of the fixture is that it was written by the released code, not by
// the code under test. Usage: node tests/support/mobile-0.4-fixture/build-fixture.mjs <git-commit>
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { loadTs } from '../../../tools/load-ts.mjs';

const commit = process.argv[2];
if (!commit) throw new Error('Pass the git commit of the released sources.');
const directory = import.meta.dirname;
const filename = path.join(directory, 'released-v7.sqlite');
fs.rmSync(filename, { force: true });
const { createLocalRepository } = loadTs('mobile/src/data/repository.ts');
const { DATABASE_VERSION } = loadTs('mobile/src/data/database.ts');
if (DATABASE_VERSION !== 7) throw new Error(`Expected the released schema 7, found ${DATABASE_VERSION}.`);

const connection = new DatabaseSync(filename);
const executor = {
  async execute(sql, params = []) { return { changes: Number(connection.prepare(sql).run(...params).changes) }; },
  async query(sql, params = []) { return connection.prepare(sql).all(...params); },
};
const database = { ...executor, close: async () => connection.close(),
  async transaction(operation) {
    connection.exec('BEGIN IMMEDIATE');
    try { const result = await operation(executor); connection.exec('COMMIT'); return result; }
    catch (error) { connection.exec('ROLLBACK'); throw error; }
  } };

const own = { profileId: 'local-profile' };
const repository = await createLocalRepository(database);
await repository.saveProfile({ displayName: 'Zażółć 0.4.0', roles: ['athlete'], sportIds: ['ultimate', 'strength', 'running'], modules: ['journal'] });
const done = (date, sportId, trainingType, durationMinutes, aerobicFatigue, muscularFatigue, title) => repository.createWorkout({ ...own, sportId, trainingType, date, title,
  durationMinutes, status: 'completed', postWorkout: { aerobicFatigue, muscularFatigue, satisfaction: 7, notes: '' } });
await done('2026-09-28', 'strength', 'strength', 60, 6, 7, 'Siła A');
await done('2026-09-30', 'ultimate', 'team', 90, 5, 5, 'Trening drużyny');
await repository.createWorkout({ ...own, sportId: 'running', trainingType: 'running', date: '2026-10-01', title: 'Bieg bez ankiety', durationMinutes: 40, status: 'completed' });
await repository.createWorkout({ ...own, sportId: 'strength', trainingType: 'strength', date: '2026-09-29', title: 'Pominięta siła', status: 'skipped', wasPlanned: true, plannedMinutes: 50 });
await repository.createWorkout({ ...own, sportId: 'strength', trainingType: 'strength', date: '2026-10-06', title: 'Plan z ocenami', status: 'planned', plannedMinutes: 50,
  plannedFatigue: { aerobicFatigue: 4, muscularFatigue: 6 } });
await repository.createWorkout({ ...own, sportId: 'running', trainingType: 'running', date: '2026-10-08', title: 'Plan bez ocen', status: 'planned', plannedMinutes: 35 });
const removed = await done('2026-09-27', 'ultimate', 'technical', 30, 2, 2, 'Usunięty wpis');
await repository.deleteWorkout(removed.id, removed.revision);
await repository.createWellness({ ...own, date: '2026-09-29', slot: 'morning', answers: { sleepHours: 7.5, sleepQuality: 4, fatigue: 3, soreness: 5 }, notes: 'Po sile' });
await repository.createWellness({ ...own, date: '2026-10-01', slot: 'evening', answers: { fatigue: 6, soreness: 4, stress: 2, recovery: 3 }, notes: '' });
await repository.createReadinessReference({ ...own, name: 'Mój typowy tydzień', source: 'example-week', weekStart: '2026-09-21',
  dailyLoads: [80, 0, 60, 0, 45.5, 0, 0], confirmedComplete: true, confirmedRestDays: ['2026-09-26', '2026-09-27'] });
const period = await repository.createPeriod({ ...own, name: 'Sezon halowy', start: '2026-09-01', end: '2026-12-20', level: 'macro' });
await repository.createEvent({ ...own, kind: 'competition', title: 'Turniej', start: '2026-10-10', end: '2026-10-11' });
await repository.createGoal({ ...own, name: 'Trzy treningi', metric: 'count', cadence: 'weekly', target: 3 });
const epoch = (await repository.readSnapshot()).epoch;
await repository.createDraft({ ...own, kind: 'workout', epoch, raw: { form: { title: 'Surowy szkic  ', plannedMinutes: '4o' } } });
const backup = await repository.exportBackup();
if (JSON.parse(backup).version !== 4) throw new Error('Expected the released backup format 4.');
await repository.close();
fs.writeFileSync(path.join(directory, 'backup-v4.json'), backup);
const sha256 = file => createHash('sha256').update(fs.readFileSync(path.join(directory, file))).digest('hex');
fs.writeFileSync(path.join(directory, 'provenance.json'), JSON.stringify({
  purpose: 'Database and backup written by the released 0.4.0 sources, used to test migration 7 -> 8 and the import of older backups.',
  app: { versionName: '0.4.0', versionCode: 4, sourceCommit: commit }, generatedAt: new Date().toISOString(), generator: 'tests/support/mobile-0.4-fixture/build-fixture.mjs',
  database: { file: 'released-v7.sqlite', schemaVersion: 7, sha256: sha256('released-v7.sqlite') },
  backup: { file: 'backup-v4.json', formatVersion: 4, sha256: sha256('backup-v4.json') }, periodId: period.id,
}, null, 2) + '\n');
console.log('fixture written');
