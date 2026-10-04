import { z } from 'zod';
import type { SqlDatabase, SqlExecutor, SqlRow, SqlValue } from './database';
import { migrateDatabase } from './database';
import * as d from './domain';
import { getBuiltinExercises } from './catalog';
import { cloneTrainingPlan } from './supersets';
import { today } from './analytics';
import { assertStoredLoadCalculation, assertStoredPlannedLoadCalculation, calculateTrainingLoad, calculatePlannedTrainingLoad, sameLoadInputs, samePlannedLoadInputs } from './load';
import { addDays, monday } from '../../../lib/domain';
import { AppError } from './errors';
export type { LocalSnapshot } from './domain';
const BACKUP_MAX_BYTES = 25 * 1024 * 1024;
function assertBackupSize(text: string): void {
  if (text.length > BACKUP_MAX_BYTES || new TextEncoder().encode(text).byteLength > BACKUP_MAX_BYTES)
    throw new AppError('backupTooLarge', 'Kopia zapasowa jest zbyt duża (limit 25 MB).');
}
const tables = { customExercises: 'local_custom_exercises', exerciseNotes: 'local_exercise_notes',
  templates: 'local_templates', periods: 'local_periods', wellness: 'local_wellness', goals: 'local_goals', drafts: 'local_drafts', events: 'local_events', readinessReferences: 'local_readiness_references', exerciseRoles: 'local_exercise_roles', muscleTargets: 'local_muscle_targets', trainingQuizzes: 'local_training_quiz' } as const;
type EntityKey = keyof typeof tables;
const entityKeys = Object.keys(tables) as EntityKey[];
const schemas = { customExercises: d.customExerciseSchema, exerciseNotes: d.exerciseNoteSchema,
  templates: d.templateSchema, periods: d.periodSchema, wellness: d.wellnessSchema, goals: d.goalSchema, drafts: d.draftSchema, events: d.eventSchema, readinessReferences: d.readinessReferenceSchema, exerciseRoles: d.exerciseRolesSchema, muscleTargets: d.muscleTargetSchema, trainingQuizzes: d.trainingQuizSchema };
type Entity = d.SnapshotData[EntityKey][number];
const isoNow = () => new Date().toISOString();
function nextRevision(revision: number): number {
  if (!Number.isSafeInteger(revision) || revision < 0 || revision >= Number.MAX_SAFE_INTEGER)
    throw new AppError('revisionLimit', 'Przekroczono limit wersji wpisów.');
  return revision + 1;
}
function assertRevision(actual: number, expected: number | undefined): void {
  if (!Number.isSafeInteger(expected) || actual !== expected) throw new d.RevisionConflictError();
  nextRevision(actual);
}
async function revisionFloor(tx: SqlExecutor): Promise<number> {
  const rows = await tx.query<{ revision_floor: number }>('SELECT revision_floor FROM local_revision_state WHERE id = 1');
  const value = rows[0]?.revision_floor;
  if (!Number.isSafeInteger(value) || value < 0) throw new AppError('dataVersionUnreadable', 'Nie można odczytać wersji danych lokalnych.');
  return value;
}
async function assertEpoch(tx: SqlExecutor, expected: number | undefined): Promise<void> {
  if (expected !== undefined && (!Number.isSafeInteger(expected) || expected !== await dataEpoch(tx)))
    throw new d.RevisionConflictError();
}
async function dataEpoch(tx: SqlExecutor): Promise<number> {
  const rows = await tx.query<{ epoch: number }>('SELECT epoch FROM local_revision_state WHERE id = 1');
  const epoch = rows[0]?.epoch;
  if (!Number.isSafeInteger(epoch) || epoch < 0) throw new AppError('dataVersionUnreadable', 'Nie można odczytać wersji danych lokalnych.');
  return epoch;
}
/** Physical deletions must retain a high-water mark without invalidating unrelated open forms. */
async function retainDeletedRevision(tx: SqlExecutor, revision: number): Promise<void> {
  await tx.execute('UPDATE local_revision_state SET revision_floor = MAX(revision_floor, ?) WHERE id = 1', [nextRevision(revision)]);
}
export type DraftCommitRef = { id: string; revision: number };
async function removeCommittedDraft(tx: SqlExecutor, draft: DraftCommitRef | undefined): Promise<void> {
  if (!draft) return;
  const result = await tx.execute('DELETE FROM local_drafts WHERE id = ? AND revision = ?', [draft.id, draft.revision]);
  if (result.changes !== 1) throw new d.RevisionConflictError();
  await retainDeletedRevision(tx, draft.revision);
}
function profileFromRow(row: SqlRow): d.Profile {
  return d.profileSchema.parse({ id: row.id, displayName: row.display_name, roles: JSON.parse(String(row.roles)),
    visibleShortcuts: JSON.parse(String(row.visible_shortcuts)), sportIds: JSON.parse(String(row.sport_ids)), modules: JSON.parse(String(row.modules)), revision: row.revision,
    createdAt: row.created_at, updatedAt: row.updated_at, syncState: row.sync_state });
}
function workoutFromRow(row: SqlRow): d.Workout {
  const workout = d.workoutSchema.parse({ id: row.id, profileId: row.profile_id, sportId: row.sport_id,
    plannedFatigue: JSON.parse(String(row.planned_fatigue)), plannedLoadCalculation: row.planned_load_calculation === null ? null : JSON.parse(String(row.planned_load_calculation)),
    loadCalculation: row.load_calculation === null ? null : JSON.parse(String(row.load_calculation)),
    trainingType: row.training_type, supersets: JSON.parse(String(row.supersets)), postWorkout: JSON.parse(String(row.post_workout)),
    date: row.date, title: row.title, durationMinutes: row.duration_minutes, rpe: row.rpe, notes: row.notes,
    revision: row.revision, createdAt: row.created_at, updatedAt: row.updated_at, syncState: row.sync_state,
    deletedAt: row.deleted_at, status: row.status, wasPlanned: row.was_planned === 1, time: row.time,
    plannedMinutes: row.planned_minutes, sections: JSON.parse(String(row.sections)), planNotes: row.plan_notes, periodId: row.period_id });
  assertStoredLoadCalculation(workout);
  assertStoredPlannedLoadCalculation(workout);
  return workout;
}
async function getProfile(tx: SqlExecutor): Promise<d.Profile | null> {
  const rows = await tx.query('SELECT * FROM local_profiles WHERE id = ?', ['local-profile']);
  return rows[0] ? profileFromRow(rows[0]) : null;
}
async function insertProfile(tx: SqlExecutor, p: d.Profile): Promise<void> {
  await tx.execute(`INSERT INTO local_profiles (id, display_name, roles, sport_ids, modules, revision, created_at, updated_at, sync_state, visible_shortcuts)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [p.id, p.displayName, JSON.stringify(p.roles), JSON.stringify(p.sportIds),
    JSON.stringify(p.modules), p.revision, p.createdAt, p.updatedAt, p.syncState, JSON.stringify(p.visibleShortcuts)]);
}
const workoutColumns = ['id', 'profile_id', 'sport_id', 'date', 'title', 'duration_minutes', 'rpe', 'notes', 'revision',
  'created_at', 'updated_at', 'sync_state', 'deleted_at', 'status', 'was_planned', 'time', 'planned_minutes', 'sections', 'plan_notes', 'period_id', 'training_type', 'supersets', 'post_workout', 'load_calculation', 'planned_fatigue', 'planned_load_calculation'];
function workoutValues(w: d.Workout): SqlValue[] {
  return [w.id, w.profileId, w.sportId, w.date, w.title, w.durationMinutes, w.rpe, w.notes, w.revision,
    w.createdAt, w.updatedAt, w.syncState, w.deletedAt, w.status, Number(w.wasPlanned), w.time, w.plannedMinutes,
    JSON.stringify(w.sections), w.planNotes, w.periodId, w.trainingType, JSON.stringify(w.supersets), JSON.stringify(w.postWorkout), w.loadCalculation === null ? null : JSON.stringify(w.loadCalculation), JSON.stringify(w.plannedFatigue), w.plannedLoadCalculation === null ? null : JSON.stringify(w.plannedLoadCalculation)];
}
async function insertWorkout(tx: SqlExecutor, w: d.Workout): Promise<void> {
  await tx.execute(`INSERT INTO local_workouts (${workoutColumns.join(', ')}) VALUES (${workoutColumns.map(() => '?').join(', ')})`, workoutValues(w));
}
async function writeWorkout(tx: SqlExecutor, w: d.Workout, expectedRevision: number): Promise<void> {
  const result = await tx.execute(`UPDATE local_workouts SET ${workoutColumns.slice(1).map(column => `${column} = ?`).join(', ')}
    WHERE id = ? AND revision = ?`, [...workoutValues(w).slice(1), w.id, expectedRevision]);
  if (result.changes !== 1) throw new d.RevisionConflictError();
}
async function insertEntity(tx: SqlExecutor, key: EntityKey, entity: Entity): Promise<void> {
  await tx.execute(`INSERT INTO ${tables[key]} (id, profile_id, revision, created_at, updated_at, sync_state, payload)
    VALUES (?, ?, ?, ?, ?, ?, ?)`, [entity.id, entity.profileId, entity.revision, entity.createdAt, entity.updatedAt, entity.syncState, JSON.stringify(entity)]);
}
async function writeEntity(tx: SqlExecutor, key: EntityKey, entity: Entity, expectedRevision: number): Promise<void> {
  const result = await tx.execute(`UPDATE ${tables[key]} SET payload = ?, revision = ?, updated_at = ? WHERE id = ? AND revision = ?`,
    [JSON.stringify(entity), entity.revision, entity.updatedAt, entity.id, expectedRevision]);
  if (result.changes !== 1) throw new d.RevisionConflictError();
}
async function readData(tx: SqlExecutor): Promise<d.SnapshotData> {
  const profile = await getProfile(tx);
  const workouts = (await tx.query('SELECT * FROM local_workouts ORDER BY date DESC, created_at DESC, id DESC')).map(workoutFromRow);
  const entities: Record<string, Entity[]> = {};
  for (const key of entityKeys) {
    entities[key] = (await tx.query(`SELECT * FROM ${tables[key]} ORDER BY created_at, id`)).map(row => {
      // SQL identity/revision columns are authoritative; malformed payloads are never silently accepted.
      const payload = JSON.parse(String(row.payload));
      return schemas[key].parse({ ...payload, id: row.id, profileId: row.profile_id, revision: row.revision,
        createdAt: row.created_at, updatedAt: row.updated_at, syncState: row.sync_state });
    });
  }
  return { profile, workouts, ...entities } as d.SnapshotData;
}
const emptyEntities = () => ({ customExercises: [], exerciseNotes: [], templates: [], periods: [], wellness: [], goals: [], drafts: [], events: [], readinessReferences: [], exerciseRoles: [], muscleTargets: [], trainingQuizzes: [] });
export type BackupPreview = { version: 1 | 2 | 3 | 4 | 5; profileName: string | null; exportedAt: string; counts: Record<'workouts' | EntityKey, number> };

export async function createLocalRepository(database: SqlDatabase) {
  await migrateDatabase(database);
  const builtinIds = new Set(getBuiltinExercises().map(exercise => exercise.id));
  const validate = (state: d.SnapshotData) => d.validateSnapshot(state, builtinIds);
  function parseBackup(text: string) {
    assertBackupSize(text);
    const parsed = d.backupSchema.parse(JSON.parse(text));
    const state = parsed.version === 1
      ? { ...emptyEntities(), profile: parsed.profile, workouts: parsed.workouts.map(workout => d.workoutSchema.parse(workout)) }
      : { profile: parsed.profile, workouts: parsed.workouts, customExercises: parsed.customExercises,
        exerciseNotes: parsed.exerciseNotes, templates: parsed.templates, periods: parsed.periods,
        wellness: parsed.wellness, goals: parsed.goals, drafts: parsed.drafts, events: parsed.events, readinessReferences: parsed.readinessReferences, exerciseRoles: parsed.exerciseRoles, muscleTargets: parsed.muscleTargets, trainingQuizzes: parsed.trainingQuizzes };
    return { parsed, state: validate(state) };
  }
  function entityMethods<K extends EntityKey, S extends z.ZodTypeAny>(key: K, inputSchema: S) {
    type Output = d.SnapshotData[K][number];
    const parseInput = (input: z.input<S>) => {
      const parsed = inputSchema.parse(input);
      // Normalize writes only; old imported fields remain available for a lossless export.
      if (key === 'goals' && d.isWellnessGoalMetric(parsed.metric)) parsed.sportId = null;
      if (key === 'goals' && (parsed.metric === 'activeDays' || parsed.metric === 'checkinDays')) {
        const availableDays = parsed.cadence === 'weekly' ? 7 : Math.round((Date.parse(`${parsed.end}T12:00:00Z`) - Date.parse(`${parsed.start}T12:00:00Z`)) / 86400000) + 1;
        if (parsed.target > availableDays) throw new AppError('goalDaysExceedPeriod', 'Cel liczby dni nie może przekraczać liczby dni w wybranym okresie.');
      }
      if (key === 'readinessReferences') Object.assign(parsed, { referenceLoad: parsed.dailyLoads.reduce((sum: number, value: number) => sum + value, 0), version: 'readiness-v1', parameters: structuredClone(d.READINESS_PARAMETERS) });
      return parsed;
    };
    return {
      async create(input: z.input<S>, expectedEpoch?: number): Promise<Output> {
        const parsed = parseInput(input);
        return database.transaction(async tx => {
          await assertEpoch(tx, expectedEpoch);
          if (key === 'drafts') await assertEpoch(tx, parsed.epoch);
          const state = await readData(tx);
          if (!state.profile || parsed.profileId !== state.profile.id) throw new AppError('profileRequired', 'Najpierw utwórz profil lokalny.');
          const now = isoNow();
          const entity = schemas[key].parse({ ...parsed, id: crypto.randomUUID(), revision: nextRevision(await revisionFloor(tx)),
            createdAt: now, updatedAt: now, syncState: 'local-only' }) as Output;
          (state[key] as Entity[]).push(entity);
          validate(state);
          await insertEntity(tx, key, entity);
          return entity;
        });
      },
      async update(id: string, expectedRevision: number, input: z.input<S>, expectedEpoch?: number): Promise<Output> {
        const parsed = parseInput(input);
        return database.transaction(async tx => {
          await assertEpoch(tx, expectedEpoch);
          if (key === 'drafts') await assertEpoch(tx, parsed.epoch);
          const state = await readData(tx);
          const entries = state[key] as Entity[];
          const index = entries.findIndex(entity => entity.id === id);
          if (index < 0) throw new d.RevisionConflictError();
          const previous = entries[index];
          assertRevision(previous.revision, expectedRevision);
          if (parsed.profileId !== previous.profileId) throw new AppError('entryProfileMove', 'Nie można przenieść wpisu do innego profilu.');
          const entity = schemas[key].parse({ ...previous, ...parsed, revision: nextRevision(previous.revision), updatedAt: isoNow() }) as Output;
          entries[index] = entity;
          validate(state);
          await writeEntity(tx, key, entity, expectedRevision);
          return entity;
        });
      },
      async remove(id: string, expectedRevision: number, expectedEpoch?: number): Promise<void> {
        await database.transaction(async tx => {
          await assertEpoch(tx, expectedEpoch);
          const state = await readData(tx);
          const entries = state[key] as Entity[];
          const index = entries.findIndex(entity => entity.id === id);
          if (index < 0) throw new d.RevisionConflictError();
          const previous = entries[index];
          assertRevision(previous.revision, expectedRevision);
          if (key === 'customExercises') {
            const archived = { ...previous, archivedAt: isoNow(), updatedAt: isoNow(), revision: nextRevision(previous.revision) } as d.CustomExercise;
            entries[index] = archived;
            validate(state);
            await writeEntity(tx, key, archived, expectedRevision);
            return;
          }
          entries.splice(index, 1);
          if (key === 'periods') {
            for (const period of state.periods.filter(p => p.parentId === id)) {
              const revision = period.revision;
              period.parentId = null; period.revision = nextRevision(revision); period.updatedAt = isoNow();
              await writeEntity(tx, 'periods', period, revision);
            }
            for (const workout of state.workouts.filter(w => w.periodId === id)) {
              const revision = workout.revision;
              workout.periodId = null; workout.revision = nextRevision(revision); workout.updatedAt = isoNow();
              await writeWorkout(tx, workout, revision);
            }
          }
          validate(state);
          const result = await tx.execute(`DELETE FROM ${tables[key]} WHERE id = ? AND revision = ?`, [id, expectedRevision]);
          if (result.changes !== 1) throw new d.RevisionConflictError();
          await retainDeletedRevision(tx, expectedRevision);
        });
      },
    };
  }
  const exercise = entityMethods('customExercises', d.customExerciseInputSchema);
  const exerciseNote = entityMethods('exerciseNotes', d.exerciseNoteInputSchema);
  const template = entityMethods('templates', d.templateInputSchema);
  const period = entityMethods('periods', d.periodInputSchema);
  const wellness = entityMethods('wellness', d.wellnessInputSchema);
  const goal = entityMethods('goals', d.goalInputSchema);
  const event = entityMethods('events', d.eventInputSchema);
  const readinessReference = entityMethods('readinessReferences', d.readinessReferenceInputSchema);
  const exerciseRoles = entityMethods('exerciseRoles', d.exerciseRolesInputSchema);
  const draft = entityMethods('drafts', d.draftInputSchema);
  function workoutFromInput(input: d.WorkoutInput, previous?: d.Workout) {
    const parsed = d.workoutInputSchema.parse(input);
    if (parsed.status === 'completed' && parsed.date > today()) throw new AppError('completedInFuture', 'Nie można zapisać ukończonego treningu z przyszłą datą.');
    const normalized = { ...parsed, wasPlanned: parsed.status === 'planned' || parsed.wasPlanned || previous?.wasPlanned || false };
    return { ...normalized, loadCalculation: previous && sameLoadInputs(previous, normalized) ? previous.loadCalculation : calculateTrainingLoad(normalized),
      plannedLoadCalculation: previous && samePlannedLoadInputs(previous, normalized) ? previous.plannedLoadCalculation : calculatePlannedTrainingLoad(normalized),
      title: parsed.title || SPORTS_NAME(parsed.sportId) };
  }
  function assertWorkoutSport(state: d.SnapshotData, input: d.WorkoutInput, previous?: d.Workout) {
    if (!state.profile || input.profileId !== state.profile.id) throw new AppError('profileRequired', 'Najpierw utwórz profil lokalny.');
    if (previous && previous.profileId !== input.profileId) throw new AppError('workoutProfileMove', 'Nie można przenieść treningu do innego profilu.');
    if ((!previous || previous.sportId !== input.sportId) && !state.profile.sportIds.includes(input.sportId))
      throw new AppError('sportNotInProfile', 'Wybierz sport dodany do profilu.');
  }
  async function copyInTransaction(tx: SqlExecutor, state: d.SnapshotData, sources: d.Workout[], shift: number) {
    const now = isoNow();
    const revision = nextRevision(await revisionFloor(tx));
    const copies = sources.map(source => {
      const date = addDays(source.date, shift);
      const period = state.periods.find(p => p.id === source.periodId);
      const copy = d.workoutSchema.parse({ ...source, id: crypto.randomUUID(), date, status: 'planned', wasPlanned: true,
        durationMinutes: null, rpe: null, notes: '', postWorkout: d.emptyPostWorkout(), loadCalculation: null, ...cloneTrainingPlan(source),
        periodId: period && date >= period.start && date <= period.end ? period.id : null,
        revision, createdAt: now, updatedAt: now, deletedAt: null });
      copy.plannedLoadCalculation ??= calculatePlannedTrainingLoad(copy);
      return copy;
    });
    state.workouts.push(...copies);
    validate(state);
    for (const copy of copies) await insertWorkout(tx, copy);
    return copies;
  }
  async function appendMuscleTarget(tx: SqlExecutor, state: d.SnapshotData, input: d.MuscleTargetInput, scope: d.MuscleTarget['scope'], previous?: d.MuscleTarget) {
    const parsed = d.muscleTargetInputSchema.parse(input);
    if (scope === 'period' && parsed.start < monday(today())) throw new AppError('muscleTargetStartsInPast', 'Zmiana celu okresowego może zaczynać się najwcześniej w obecny poniedziałek. Dla korekty historii wybierz jawne nadpisanie tygodnia.');
    if (state.profile?.id !== parsed.profileId) throw new AppError('muscleTargetProfileInvalid', 'Nieprawidłowy profil celu.');
    if (previous && (previous.profileId !== parsed.profileId || previous.muscle !== parsed.muscle)) throw new AppError('muscleTargetVersionMismatch', 'Nowa wersja musi dotyczyć tego samego mięśnia i profilu.');
    const definitionRevision = nextRevision(Math.max(0, ...state.muscleTargets.filter(target => target.muscle === parsed.muscle).map(target => target.definitionRevision)));
    const now = isoNow();
    const target = d.muscleTargetSchema.parse({ ...parsed, scope, definitionRevision, supersedesId: previous?.id ?? null,
      id: crypto.randomUUID(), revision: nextRevision(await revisionFloor(tx)), createdAt: now, updatedAt: now, syncState: 'local-only' });
    if (previous) {
      const expectedRevision = previous.revision;
      previous.revision = nextRevision(previous.revision); previous.updatedAt = now;
      await writeEntity(tx, 'muscleTargets', previous, expectedRevision);
    }
    state.muscleTargets.push(target); validate(state);
    await insertEntity(tx, 'muscleTargets', target);
    return target;
  }
  return {
    getProfile: () => getProfile(database),
    async readSnapshot(): Promise<d.LocalSnapshot> {
      return database.transaction(async tx => {
        const state = validate(await readData(tx));
        return { ...state, workouts: state.workouts.filter(w => !w.deletedAt), epoch: await dataEpoch(tx) };
      });
    },
    async saveProfile(input: d.ProfileInput, expectedRevision?: number, expectedEpoch?: number): Promise<d.Profile> {
      const parsed = d.profileInputSchema.parse(input);
      return database.transaction(async tx => {
        await assertEpoch(tx, expectedEpoch);
        const previous = await getProfile(tx);
        if (previous) assertRevision(previous.revision, expectedRevision);
        else if (expectedRevision !== undefined) throw new d.RevisionConflictError();
        const now = isoNow();
        const profile: d.Profile = { ...parsed, id: 'local-profile', revision: nextRevision(previous?.revision ?? await revisionFloor(tx)),
          createdAt: previous?.createdAt ?? now, updatedAt: now, syncState: 'local-only' };
        if (previous) {
          const result = await tx.execute(`UPDATE local_profiles SET display_name = ?, roles = ?, sport_ids = ?,
            modules = ?, visible_shortcuts = ?, revision = ?, updated_at = ? WHERE id = ? AND revision = ?`, [profile.displayName,
            JSON.stringify(profile.roles), JSON.stringify(profile.sportIds), JSON.stringify(profile.modules), JSON.stringify(profile.visibleShortcuts), profile.revision, now, profile.id, previous.revision]);
          if (result.changes !== 1) throw new d.RevisionConflictError();
        } else await insertProfile(tx, profile);
        return profile;
      });
    },
    async listWorkouts(profileId: string): Promise<d.Workout[]> {
      return (await database.query(`SELECT * FROM local_workouts WHERE profile_id = ? AND deleted_at IS NULL
        ORDER BY date DESC, created_at DESC, id DESC`, [profileId])).map(workoutFromRow);
    },
    async createWorkout(input: d.WorkoutInput, expectedEpoch?: number, draftRef?: DraftCommitRef): Promise<d.Workout> {
      const parsed = workoutFromInput(input);
      return database.transaction(async tx => {
        await assertEpoch(tx, expectedEpoch);
        const state = await readData(tx);
        assertWorkoutSport(state, parsed);
        const now = isoNow();
        const workout: d.Workout = { ...parsed, id: crypto.randomUUID(), revision: nextRevision(await revisionFloor(tx)),
          createdAt: now, updatedAt: now, syncState: 'local-only', deletedAt: null };
        state.workouts.push(workout); validate(state);
        await insertWorkout(tx, workout);
        await removeCommittedDraft(tx, draftRef);
        return workout;
      });
    },
    async updateWorkout(id: string, expectedRevision: number, input: d.WorkoutInput, expectedEpoch?: number, draftRef?: DraftCommitRef): Promise<d.Workout> {
      return database.transaction(async tx => {
        await assertEpoch(tx, expectedEpoch);
        const state = await readData(tx);
        const index = state.workouts.findIndex(w => w.id === id && !w.deletedAt);
        if (index < 0) throw new d.RevisionConflictError();
        const previous = state.workouts[index]; assertRevision(previous.revision, expectedRevision);
        const parsed = workoutFromInput(input, previous); assertWorkoutSport(state, parsed, previous);
        const workout: d.Workout = { ...previous, ...parsed, revision: nextRevision(previous.revision), updatedAt: isoNow() };
        state.workouts[index] = workout; validate(state);
        await writeWorkout(tx, workout, expectedRevision);
        await removeCommittedDraft(tx, draftRef);
        return workout;
      });
    },
    async deleteWorkout(id: string, expectedRevision: number, expectedEpoch?: number): Promise<void> {
      await database.transaction(async tx => {
        await assertEpoch(tx, expectedEpoch);
        const rows = await tx.query('SELECT * FROM local_workouts WHERE id = ? AND deleted_at IS NULL', [id]);
        if (!rows[0]) throw new d.RevisionConflictError();
        const workout = workoutFromRow(rows[0]); assertRevision(workout.revision, expectedRevision);
        workout.deletedAt = workout.updatedAt = isoNow(); workout.revision = nextRevision(workout.revision);
        await writeWorkout(tx, workout, expectedRevision);
        for (const row of await tx.query('SELECT id, revision, payload FROM local_drafts')) {
          if (JSON.parse(String(row.payload)).entityId === id) {
            await tx.execute('DELETE FROM local_drafts WHERE id = ?', [row.id]);
            await retainDeletedRevision(tx, Number(row.revision));
          }
        }
      });
    },
    async copyWorkout(id: string, date: string, expectedEpoch?: number, expectedRevision?: number): Promise<d.Workout> {
      d.daySchema.parse(date);
      return database.transaction(async tx => {
        await assertEpoch(tx, expectedEpoch);
        const state = await readData(tx); const source = state.workouts.find(w => w.id === id && !w.deletedAt);
        if (!source) throw new d.RevisionConflictError();
        if (expectedRevision !== undefined) assertRevision(source.revision, expectedRevision);
        const shift = Math.round((Date.parse(date + 'T12:00:00Z') - Date.parse(source.date + 'T12:00:00Z')) / 86400000);
        return (await copyInTransaction(tx, state, [source], shift))[0];
      });
    },
    async copyWeek(profileId: string, from: string, to: string, expectedEpoch?: number): Promise<d.Workout[]> {
      d.daySchema.parse(from); d.daySchema.parse(to);
      const start = monday(from), target = monday(to);
      if (start === target) throw new AppError('copyWeekSameTarget', 'Wybierz inny tydzień docelowy.');
      return database.transaction(async tx => {
        await assertEpoch(tx, expectedEpoch);
        const state = await readData(tx);
        if (state.profile?.id !== profileId) throw new AppError('profileInvalid', 'Nieprawidłowy profil.');
        const sources = state.workouts.filter(w => !w.deletedAt && w.profileId === profileId && w.date >= start && w.date <= addDays(start, 6));
        return copyInTransaction(tx, state, sources, Math.round((Date.parse(target + 'T12:00:00Z') - Date.parse(start + 'T12:00:00Z')) / 86400000));
      });
    },
    createExercise: exercise.create, updateExercise: exercise.update, deleteExercise: exercise.remove,
    createExerciseNote: exerciseNote.create, updateExerciseNote: exerciseNote.update, deleteExerciseNote: exerciseNote.remove,
    createTemplate: template.create, updateTemplate: template.update, deleteTemplate: template.remove,
    createPeriod: period.create, updatePeriod: period.update, deletePeriod: period.remove,
    createWellness: wellness.create, updateWellness: wellness.update, deleteWellness: wellness.remove,
    createGoal: goal.create, updateGoal: goal.update, deleteGoal: goal.remove,
    createEvent: event.create, updateEvent: event.update, deleteEvent: event.remove,
    createReadinessReference: readinessReference.create, updateReadinessReference: readinessReference.update, deleteReadinessReference: readinessReference.remove,
    createExerciseRoles: exerciseRoles.create, updateExerciseRoles: exerciseRoles.update, deleteExerciseRoles: exerciseRoles.remove,
    async createMuscleTarget(input: d.MuscleTargetInput, expectedEpoch?: number): Promise<d.MuscleTarget> {
      return database.transaction(async tx => { await assertEpoch(tx, expectedEpoch); return appendMuscleTarget(tx, await readData(tx), input, 'period'); });
    },
    async reviseMuscleTarget(id: string, expectedRevision: number, input: d.MuscleTargetInput, expectedEpoch?: number): Promise<d.MuscleTarget> {
      return database.transaction(async tx => {
        await assertEpoch(tx, expectedEpoch); const state = await readData(tx);
        const previous = state.muscleTargets.find(target => target.id === id);
        if (!previous) throw new d.RevisionConflictError(); assertRevision(previous.revision, expectedRevision);
        if (state.muscleTargets.some(target => target.supersedesId === id)) throw new d.RevisionConflictError();
        return appendMuscleTarget(tx, state, input, 'period', previous);
      });
    },
    async createMuscleWeekOverride(input: d.MuscleWeekOverrideInput, expectedEpoch?: number): Promise<d.MuscleTarget> {
      const parsed = d.muscleWeekOverrideInputSchema.parse(input);
      if (monday(parsed.weekStart) !== parsed.weekStart) throw new AppError('overrideNotMonday', 'Wybierz poniedziałek nadpisywanego tygodnia.');
      const { weekStart, ...fields } = parsed;
      return database.transaction(async tx => { await assertEpoch(tx, expectedEpoch);
        return appendMuscleTarget(tx, await readData(tx), { ...fields, start: weekStart, end: addDays(weekStart, 6) }, 'week-override'); });
    },
    /** One row per profile. A finished quiz is never replaced by a later "skip". */
    async saveTrainingQuiz(input: d.TrainingQuizInput, expectedEpoch?: number): Promise<d.TrainingQuiz> {
      const parsed = d.trainingQuizInputSchema.parse(input);
      return database.transaction(async tx => {
        await assertEpoch(tx, expectedEpoch);
        const state = await readData(tx);
        if (!state.profile || parsed.profileId !== state.profile.id) throw new AppError('profileRequired', 'Najpierw utwórz profil lokalny.');
        const previous = state.trainingQuizzes[0], now = isoNow();
        if (previous && previous.status === 'completed' && parsed.status === 'skipped') return previous;
        const quiz = d.trainingQuizSchema.parse({ ...parsed, quizVersion: d.TRAINING_QUIZ_VERSION, answeredAt: now, id: previous?.id ?? crypto.randomUUID(),
          revision: nextRevision(previous?.revision ?? await revisionFloor(tx)), createdAt: previous?.createdAt ?? now, updatedAt: now, syncState: 'local-only' });
        state.trainingQuizzes = [quiz]; validate(state);
        if (previous) await writeEntity(tx, 'trainingQuizzes', quiz, previous.revision); else await insertEntity(tx, 'trainingQuizzes', quiz);
        return quiz;
      });
    },
    createDraft: draft.create, updateDraft: draft.update, deleteDraft: draft.remove,
    async exportBackup(): Promise<string> {
      return database.transaction(async tx => {
        const state = validate(await readData(tx));
        const text = JSON.stringify(d.backupV5Schema.parse({ ...state, format: 'training-companion-backup', version: 5, exportedAt: isoNow() }), null, 2);
        assertBackupSize(text); return text;
      });
    },
    previewBackup(text: string): BackupPreview {
      const { parsed, state } = parseBackup(text);
      return { version: parsed.version, exportedAt: parsed.exportedAt, profileName: state.profile?.displayName ?? null,
        counts: Object.fromEntries(['workouts', ...entityKeys].map(key => [key, state[key as 'workouts' | EntityKey].length])) as BackupPreview['counts'] };
    },
    /** Caller presents preview and obtains an explicit replace action. */
    async restoreBackup(text: string): Promise<void> {
      const { state } = parseBackup(text);
      await database.transaction(async tx => {
        const current = await readData(tx);
        let highest = await revisionFloor(tx);
        for (const snapshot of [current, state]) {
          highest = Math.max(highest, snapshot.profile?.revision ?? 0);
          for (const entry of snapshot.workouts) highest = Math.max(highest, entry.revision);
          for (const key of entityKeys) for (const entry of snapshot[key]) highest = Math.max(highest, entry.revision);
          // Raw drafts can outlive a branch of imported history. Their captured
          // tokens must never accidentally match the freshly restored records.
          for (const draft of snapshot.drafts) highest = Math.max(highest, draft.epoch, draft.baseRevision ?? 0);
        }
        // A backup without quiz answers (formats 1-4, or exported before answering) keeps the answer or the
        // "skipped" mark of this device, so the one-time quiz does not return after an import.
        if (state.profile && !state.trainingQuizzes.length) state.trainingQuizzes = current.trainingQuizzes.filter(quiz => quiz.profileId === state.profile!.id);
        const revision = nextRevision(highest);
        await tx.execute('UPDATE local_revision_state SET revision_floor = ?, epoch = ? WHERE id = 1', [revision, revision]);
        for (const key of entityKeys) await tx.execute(`DELETE FROM ${tables[key]}`);
        await tx.execute('DELETE FROM local_workouts'); await tx.execute('DELETE FROM local_profiles');
        if (state.profile) await insertProfile(tx, { ...state.profile, revision });
        for (const workout of state.workouts) await insertWorkout(tx, { ...workout, revision });
        for (const key of entityKeys) for (const entity of state[key]) await insertEntity(tx, key, { ...entity, revision });
      });
    },
    close: () => database.close(),
  };
}
const SPORTS_NAME = (id: d.SportId) => d.SPORTS.find(sport => sport.id === id)?.name ?? 'Trening';
export type LocalRepository = Awaited<ReturnType<typeof createLocalRepository>>;
