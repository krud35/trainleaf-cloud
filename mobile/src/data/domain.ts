import { z } from 'zod';
import { assertStoredLoadCalculation, assertStoredPlannedLoadCalculation } from './load';
import { exerciseSchema as sharedExerciseSchema, doseSchema as sharedDoseSchema } from '../../../lib/domain';
import { muscles } from '../../../lib/domain';
import { wellnessFields, wellnessResponseSchema } from '../../../lib/wellness';
import { AppError, issue, type ErrorCode, type ErrorParams } from './errors';
export type { Exercise, Section, Muscle } from '../../../lib/domain';
export const SPORTS = [
  { id: 'ultimate', name: 'Ultimate frisbee', group: 'team' },
  { id: 'running', name: 'Bieganie', group: 'endurance' },
  { id: 'cycling', name: 'Kolarstwo', group: 'endurance' },
  { id: 'strength', name: 'Trening siłowy', group: 'strength' },
  { id: 'swimming', name: 'Pływanie', group: 'endurance' },
  { id: 'other', name: 'Inny sport', group: 'other' },
  { id: 'football', name: 'Piłka nożna', group: 'team' },
  { id: 'basketball', name: 'Koszykówka', group: 'team' },
  { id: 'volleyball', name: 'Siatkówka', group: 'team' },
  { id: 'handball', name: 'Piłka ręczna', group: 'team' },
  { id: 'rugby', name: 'Rugby', group: 'team' },
  { id: 'tennis', name: 'Tenis', group: 'racket' },
  { id: 'badminton', name: 'Badminton', group: 'racket' },
  { id: 'squash', name: 'Squash', group: 'racket' },
  { id: 'table-tennis', name: 'Tenis stołowy', group: 'racket' },
  { id: 'triathlon', name: 'Triathlon', group: 'endurance' },
  { id: 'rowing', name: 'Wioślarstwo', group: 'endurance' },
  { id: 'martial-arts', name: 'Sztuki walki', group: 'other' },
  { id: 'climbing', name: 'Wspinaczka', group: 'other' },
  { id: 'winter-sports', name: 'Sporty zimowe', group: 'other' },
  { id: 'calisthenics', name: 'Kalistenika', group: 'strength' },
  { id: 'yoga', name: 'Joga', group: 'strength' },
  { id: 'pilates', name: 'Pilates', group: 'strength' },
] as const;
export const SPORT_GROUPS = [{id:'team',name:'Zespołowe'},{id:'racket',name:'Rakietowe'},{id:'endurance',name:'Wytrzymałościowe'},{id:'strength',name:'Siła i ruch'},{id:'other',name:'Pozostałe'}] as const;
export const TRAINING_TYPES = [
  {id:'strength',name:'Siłowy',color:'#bd693e'}, {id:'running',name:'Biegowy',color:'#478971'},
  {id:'endurance',name:'Wydolnościowy',color:'#427c9d'}, {id:'technical',name:'Techniczny',color:'#987242'},
  {id:'team',name:'Drużynowy',color:'#8272a8'}, {id:'mental',name:'Mentalny',color:'#a55f89'},
] as const;
export type TrainingType = typeof TRAINING_TYPES[number]['id'];
export const trainingTypeSchema = z.enum(['strength','running','endurance','technical','team','mental']).nullable().default(null);
export const SHORTCUTS = ['history','library','templates','wellness','goals','periods','backup'] as const;
export type ShortcutId = typeof SHORTCUTS[number];
export const MODULES = ['journal', 'planning', 'learning'] as const;
export type ModuleId = typeof MODULES[number];
export type Role = 'athlete' | 'coach';
export type SportId = typeof SPORTS[number]['id'];
const unique = <T,>(values: T[]) => new Set(values).size === values.length;
export const idSchema = z.string().min(1).max(100).regex(/^[a-zA-Z0-9:_-]+$/);
export const sportSchema = z.enum(SPORTS.map(sport => sport.id) as [SportId, ...SportId[]]);
export const daySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return value.slice(0, 4) !== '0000' && Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, issue('dateInvalid'));
const note = z.string().max(10000);
const minutes = z.number().finite().int().min(0).max(1440).nullable();
const revisionSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const metadata = { id: idSchema, revision: revisionSchema, createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(), syncState: z.literal('local-only') };
const owned = { profileId: idSchema };
export const profileInputSchema = z.object({
  displayName: z.string().trim().min(1, issue('profileNameRequired')).max(80),
  roles: z.array(z.enum(['athlete', 'coach'])).min(1).max(2).refine(unique),
  sportIds: z.array(sportSchema).min(1, issue('sportRequired')).max(SPORTS.length).refine(unique),
  visibleShortcuts: z.array(z.enum(SHORTCUTS)).max(SHORTCUTS.length).refine(unique).default(() => [...SHORTCUTS]),
  modules: z.array(z.enum(MODULES)).min(1, issue('moduleRequired')).max(MODULES.length).refine(unique),
}).strict();
export const profileSchema = profileInputSchema.extend({ ...metadata, id: z.literal('local-profile') });
export const exerciseSchema = sharedExerciseSchema.strict();
export const doseSchema = sharedDoseSchema.extend({
  sets: sharedDoseSchema.shape.sets.nullable(), quantity: sharedDoseSchema.shape.quantity.nullable(),
  rir: z.number().finite().int().min(0).max(100).nullable().default(null),
}).strict();
export type Dose = z.infer<typeof doseSchema>;
export const emptyDose = (): Dose => ({ sets: null, quantity: null, kg: 0, rir: null });
export const muscleRoleAssignmentSchema = z.object({
  muscle: z.enum(Object.keys(muscles) as [keyof typeof muscles, ...(keyof typeof muscles)[]]),
  role: z.enum(['direct', 'indirect']),
}).strict();
export type MuscleRoleAssignment = z.infer<typeof muscleRoleAssignmentSchema>;
export const muscleRolesSchema = z.array(muscleRoleAssignmentSchema).min(1).max(20)
  .refine(roles => unique(roles.map(role => role.muscle)), issue('muscleRoleDuplicate'));
export const itemSchema = z.object({ id: idSchema, exercise: exerciseSchema, planned: doseSchema,
  supersetId: idSchema.nullable().default(null), muscleRoles: muscleRolesSchema.nullable().default(null), actual: doseSchema.nullable(), athleteNotes: z.string().max(3000).optional() }).strict();
export type Item = z.infer<typeof itemSchema>;
export const sectionsSchema = z.object({ warmup: z.array(itemSchema).max(60), main: z.array(itemSchema).max(100),
  cooldown: z.array(itemSchema).max(60) }).strict();
export type WorkoutSections = z.infer<typeof sectionsSchema>;
export const emptySections = (): WorkoutSections => ({ warmup: [], main: [], cooldown: [] });
export const supersetSchema = z.object({ id: idSchema, section: z.enum(['warmup','main','cooldown']),
  transitionRest: z.string().max(100).default(''), roundRest: z.string().max(100).default('') }).strict();
export type Superset = z.infer<typeof supersetSchema>;
const supersetsSchema = z.array(supersetSchema).max(110).default([]);
const rating = z.number().finite().int().min(0).max(10).nullable().default(null);
export const plannedFatigueSchema = z.object({ aerobicFatigue: rating, muscularFatigue: rating }).strict();
export type PlannedFatigue = z.infer<typeof plannedFatigueSchema>;
export const emptyPlannedFatigue = (): PlannedFatigue => ({ aerobicFatigue: null, muscularFatigue: null });
export const postWorkoutSchema = z.object({ aerobicFatigue: rating, muscularFatigue: rating,
  satisfaction: rating, notes: note.default('') }).strict();
export type PostWorkout = z.infer<typeof postWorkoutSchema>;
export const emptyPostWorkout = (): PostWorkout => ({ aerobicFatigue: null, muscularFatigue: null, satisfaction: null, notes: '' });
const finiteLoad = z.number().finite().min(0).max(10000000);
export const loadCalculationSchema = z.object({
  version: z.literal('trainleaf-v1'),
  inputs: z.object({ trainingType: z.enum(['strength','running','endurance','technical','team','mental']),
    durationMinutes: minutes, aerobicFatigue: rating, muscularFatigue: rating }).strict(),
  parameters: z.object({
    weights: z.object({ strength: finiteLoad, running: finiteLoad, endurance: finiteLoad,
      technical: finiteLoad, team: finiteLoad, mental: finiteLoad }).strict(),
    typeWeight: finiteLoad,
    fatigueMapping: z.object({ base: finiteLoad, perPoint: finiteLoad }).strict(),
  }).strict(), value: finiteLoad,
}).strict();
export type LoadCalculation = z.infer<typeof loadCalculationSchema>;
export const workoutInputSchema = z.object({
  ...owned, sportId: sportSchema, trainingType: trainingTypeSchema, supersets: supersetsSchema,
  plannedFatigue: plannedFatigueSchema.default(emptyPlannedFatigue), plannedLoadCalculation: loadCalculationSchema.nullable().default(null),
  postWorkout: postWorkoutSchema.default(emptyPostWorkout), loadCalculation: loadCalculationSchema.nullable().default(null), date: daySchema,
  title: z.string().trim().max(160).default(''), durationMinutes: minutes.default(null),
  rpe: z.number().int().min(0).max(10).nullable().default(null), notes: note.default(''),
  status: z.enum(['planned', 'completed', 'skipped']).default('completed'),
  wasPlanned: z.boolean().default(false), time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().default(null),
  plannedMinutes: minutes.default(null), sections: sectionsSchema.default(emptySections),
  planNotes: note.default(''), periodId: idSchema.nullable().default(null),
}).strict();
export const workoutSchema = workoutInputSchema.extend({ ...metadata, deletedAt: z.string().datetime().nullable() });
export const customExerciseInputSchema = exerciseSchema.omit({ id: true }).extend({ ...owned,
  archivedAt: z.string().datetime().nullable().default(null) }).strict();
export const customExerciseSchema = customExerciseInputSchema.extend({ ...metadata, id: exerciseSchema.shape.id });
export const exerciseNoteInputSchema = z.object({ ...owned, exerciseId: idSchema, notes: note }).strict();
export const exerciseNoteSchema = exerciseNoteInputSchema.extend(metadata);
export const templateInputSchema = z.object({ ...owned, name: z.string().trim().min(1).max(160),
  sportId: sportSchema, trainingType: trainingTypeSchema, supersets: supersetsSchema, section: z.enum(['whole', 'warmup', 'main', 'cooldown']),
  sections: sectionsSchema, notes: note.default('') }).strict();
export const templateSchema = templateInputSchema.extend(metadata);
export const periodInputSchema = z.object({ ...owned, name: z.string().trim().min(1).max(160),
  start: daySchema, end: daySchema, level: z.enum(['macro', 'meso', 'micro']).nullable().default(null),
  parentId: idSchema.nullable().default(null), description: note.default(''), goal: note.default(''),
  preset: z.string().max(100).nullable().default(null) }).strict();
export const periodSchema = periodInputSchema.extend(metadata);
export const EVENT_KINDS = ['event', 'competition', 'trip'] as const;
export const EVENT_AVAILABILITIES = ['available', 'limited', 'unavailable'] as const;
export type EventKind = typeof EVENT_KINDS[number];
export type EventAvailability = typeof EVENT_AVAILABILITIES[number];
const eventFieldsSchema = z.object({ ...owned, kind: z.enum(EVENT_KINDS),
  title: z.string().trim().min(1, issue('eventTitleRequired')).max(160), start: daySchema, end: daySchema,
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().default(null),
  location: z.string().max(300).default(''), notes: note.default(''),
  availability: z.enum(EVENT_AVAILABILITIES).nullable().default(null),
}).strict();
const eventRange = (event: { start: string; end: string }) => event.start <= event.end;
const eventRangeError = { message: issue('eventRangeInvalid'), path: ['end'] };
export const eventInputSchema = eventFieldsSchema.refine(eventRange, eventRangeError);
export const eventSchema = eventFieldsSchema.extend(metadata).refine(eventRange, eventRangeError);
export const localEventSchema = eventSchema;
export type LocalEventInput = z.input<typeof eventInputSchema>;
export type EventInput = LocalEventInput;
export type LocalEvent = z.infer<typeof eventSchema>;
export const READINESS_PARAMETERS = { lookbackDays: 21, halfLives: [1, 2, 3] } as const;
const readinessFieldsSchema = z.object({ ...owned, name: z.string().trim().min(1).max(160),
  source: z.enum(['confirmed-week', 'example-week']), weekStart: daySchema,
  dailyLoads: z.array(z.number().finite().min(0).max(10000000)).length(7),
  confirmedComplete: z.literal(true), confirmedRestDays: z.array(daySchema).max(3650).refine(unique).default([]),
}).strict();
export const readinessReferenceInputSchema = readinessFieldsSchema.refine(value => value.dailyLoads.reduce((sum, load) => sum + load, 0) > 0, issue('referenceLoadRequired'));
export const readinessReferenceSchema = readinessFieldsSchema.extend({ ...metadata,
  referenceLoad: z.number().finite().positive().max(70000000), version: z.literal('readiness-v1'),
  parameters: z.object({ lookbackDays: z.literal(21), halfLives: z.tuple([z.literal(1), z.literal(2), z.literal(3)]) }).strict(),
}).refine(value => Math.abs(value.referenceLoad - value.dailyLoads.reduce((sum, load) => sum + load, 0)) < 1e-8, issue('referenceMismatch'));
export type ReadinessReferenceInput = z.input<typeof readinessReferenceInputSchema>;
export type ReadinessReference = z.infer<typeof readinessReferenceSchema>;
/** Onboarding quiz, version 1. Raw answers are stored; plan-reserve-v2 derives its starting values from them. */
export const TRAINING_QUIZ_VERSION = 1;
export const QUIZ_EXPERIENCE = ['under6m', '6to24m', '2to5y', 'over5y'] as const;
export const QUIZ_LEVELS = ['beginner', 'intermediate', 'advanced', 'competitive'] as const;
/** 0 means fewer than one session a week, 8 means eight or more. */
export const QUIZ_SESSIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;
/** 30 means up to half an hour, 120 means two hours or more. */
export const QUIZ_MINUTES = [30, 45, 60, 75, 90, 120] as const;
export const QUIZ_KINDS = ['strength', 'running', 'endurance', 'technical', 'team'] as const;
export const QUIZ_INTENSITIES = ['light', 'moderate', 'hard'] as const;
export const QUIZ_RHYTHMS = ['steady', 'building', 'lighter', 'returning'] as const;
export const trainingQuizAnswersSchema = z.object({
  experience: z.enum(QUIZ_EXPERIENCE), level: z.enum(QUIZ_LEVELS),
  sessionsPerWeek: z.number().int().min(0).max(8), typicalMinutes: z.number().int().min(1).max(600),
  kinds: z.array(z.object({ type: z.enum(QUIZ_KINDS), intensity: z.enum(QUIZ_INTENSITIES) }).strict()).min(1).max(QUIZ_KINDS.length)
    .refine(kinds => unique(kinds.map(kind => kind.type))),
  rhythm: z.enum(QUIZ_RHYTHMS),
}).strict();
export type TrainingQuizAnswers = z.infer<typeof trainingQuizAnswersSchema>;
const trainingQuizFields = z.object({ ...owned, quizVersion: z.literal(TRAINING_QUIZ_VERSION),
  status: z.enum(['completed', 'skipped']), answers: trainingQuizAnswersSchema.nullable(), answeredAt: z.string().datetime() }).strict();
const quizAnswersMatchStatus = (quiz: { status: string; answers: unknown }) => (quiz.status === 'completed') === (quiz.answers !== null);
export const trainingQuizInputSchema = trainingQuizFields.omit({ answeredAt: true, quizVersion: true }).refine(quizAnswersMatchStatus);
export const trainingQuizSchema = trainingQuizFields.extend(metadata).refine(quizAnswersMatchStatus);
export type TrainingQuizInput = z.input<typeof trainingQuizInputSchema>;
export type TrainingQuiz = z.infer<typeof trainingQuizSchema>;
export const exerciseRolesInputSchema = z.object({ ...owned, exerciseId: idSchema, roles: muscleRolesSchema }).strict();
export const exerciseRolesSchema = exerciseRolesInputSchema.extend(metadata);
export type ExerciseRolesInput = z.input<typeof exerciseRolesInputSchema>;
export type ExerciseRoles = z.infer<typeof exerciseRolesSchema>;
const muscleTargetFields = z.object({ ...owned,
  muscle: muscleRoleAssignmentSchema.shape.muscle, unit: z.enum(['effectiveSets', 'exposures']),
  target: z.number().finite().min(0).max(100000).nullable(), start: daySchema, end: daySchema,
  provenance: z.string().trim().min(1, issue('targetProvenanceRequired')).max(1000),
}).strict();
const validMuscleTarget = (target: { start: string; end: string; unit: string; target: number | null }) =>
  target.start <= target.end && (target.unit !== 'exposures' || target.target === null || Number.isInteger(target.target));
export const muscleTargetInputSchema = muscleTargetFields.refine(validMuscleTarget, issue('muscleTargetInvalid'));
export const muscleWeekOverrideInputSchema = muscleTargetFields.omit({ start: true, end: true }).extend({ weekStart: daySchema });
export const muscleTargetSchema = muscleTargetFields.extend({ ...metadata, scope: z.enum(['period', 'week-override']),
  definitionRevision: revisionSchema, supersedesId: idSchema.nullable(),
}).refine(validMuscleTarget, issue('muscleTargetInvalid'));
export type MuscleTargetInput = z.input<typeof muscleTargetInputSchema>;
export type MuscleWeekOverrideInput = z.input<typeof muscleWeekOverrideInputSchema>;
export type MuscleTarget = z.infer<typeof muscleTargetSchema>;
export const GOAL_METRICS = ['count', 'minutes', 'activeDays', 'checkinDays', 'sleepAverageHours'] as const;
export type GoalMetric = typeof GOAL_METRICS[number];
export const isWellnessGoalMetric = (metric: GoalMetric) => metric === 'checkinDays' || metric === 'sleepAverageHours';
export const wellnessInputSchema = z.object({ ...owned, date: daySchema, ...wellnessFields, notes: note.default('') }).strict();
export const wellnessSchema = wellnessInputSchema.extend(metadata);
export const goalInputSchema = z.object({ ...owned, name: z.string().trim().min(1).max(160),
  metric: z.enum(GOAL_METRICS), cadence: z.enum(['weekly', 'range']),
  start: daySchema.nullable().default(null), end: daySchema.nullable().default(null),
  sportId: sportSchema.nullable().default(null), target: z.number().finite().positive().max(1000000) }).strict();
export const goalSchema = goalInputSchema.extend(metadata);
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
const jsonValue: z.ZodType<JsonValue> = z.lazy(() => z.union([z.string(), z.number().finite(), z.boolean(), z.null(),
  z.array(jsonValue), z.record(jsonValue)]));
export const draftInputSchema = z.object({ ...owned, kind: z.literal('workout'), entityId: idSchema.nullable().default(null),
  baseRevision: revisionSchema.nullable().default(null), epoch: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  raw: z.record(jsonValue).refine(raw => new TextEncoder().encode(JSON.stringify(raw)).byteLength <= 100000,
    issue('draftTooLarge')) }).strict();
export const draftSchema = draftInputSchema.extend(metadata);
export type ProfileInput = z.input<typeof profileInputSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type WorkoutInput = z.input<typeof workoutInputSchema>;
export type Workout = z.infer<typeof workoutSchema>;
export type CustomExerciseInput = z.input<typeof customExerciseInputSchema>;
export type CustomExercise = z.infer<typeof customExerciseSchema>;
export type ExerciseNoteInput = z.input<typeof exerciseNoteInputSchema>;
export type ExerciseNote = z.infer<typeof exerciseNoteSchema>;
export type TemplateInput = z.input<typeof templateInputSchema>;
export type TrainingTemplate = z.infer<typeof templateSchema>;
export type Template = TrainingTemplate;
export type PeriodInput = z.input<typeof periodInputSchema>;
export type Period = z.infer<typeof periodSchema>;
export type WellnessInput = z.input<typeof wellnessInputSchema>;
export type Wellness = z.infer<typeof wellnessSchema>;
export type GoalInput = z.input<typeof goalInputSchema>;
export type Goal = z.infer<typeof goalSchema>;
export type DraftInput = z.input<typeof draftInputSchema>;
export type Draft = z.infer<typeof draftSchema>;
export const snapshotSchema = z.object({ profile: profileSchema.nullable(), workouts: z.array(workoutSchema).max(100000),
  customExercises: z.array(customExerciseSchema).max(3000), exerciseNotes: z.array(exerciseNoteSchema).max(5000),
  templates: z.array(templateSchema).max(1000), periods: z.array(periodSchema).max(2000), events: z.array(eventSchema).max(30000).default([]),
  readinessReferences: z.array(readinessReferenceSchema).max(1000).default([]), exerciseRoles: z.array(exerciseRolesSchema).max(5000).default([]),
  muscleTargets: z.array(muscleTargetSchema).max(10000).default([]), trainingQuizzes: z.array(trainingQuizSchema).max(1).default([]),
  wellness: z.array(wellnessSchema).max(30000), goals: z.array(goalSchema).max(1000), drafts: z.array(draftSchema).max(200) }).strict();
export type LocalSnapshot = z.infer<typeof snapshotSchema> & { epoch: number };
export type SnapshotData = z.infer<typeof snapshotSchema>;
/** Version 5 adds only `trainingQuizzes`; every older version is read with that collection empty. */
export const backupV5Schema = snapshotSchema.extend({ format: z.literal('training-companion-backup'),
  version: z.literal(5), exportedAt: z.string().datetime() });
export const backupV4Schema = snapshotSchema.extend({ format: z.literal('training-companion-backup'),
  version: z.literal(4), exportedAt: z.string().datetime() });
export const backupV3Schema = snapshotSchema.extend({ format: z.literal('training-companion-backup'),
  version: z.literal(3), exportedAt: z.string().datetime() });
export const backupV2Schema = snapshotSchema.extend({ format: z.literal('training-companion-backup'),
  version: z.literal(2), exportedAt: z.string().datetime() });
const oldWorkoutSchema = z.object({ ...metadata, ...owned, sportId: sportSchema, date: daySchema,
  title: z.string().trim().min(1).max(160), durationMinutes: z.number().int().min(1).max(1440),
  rpe: z.number().int().min(0).max(10).nullable(), notes: note, deletedAt: z.string().datetime().nullable() }).strict();
export const backupV1Schema = z.object({ format: z.literal('training-companion-backup'), version: z.literal(1),
  exportedAt: z.string().datetime(), profile: profileSchema.nullable(), workouts: z.array(oldWorkoutSchema).max(100000) }).strict();
export const backupSchema = z.union([backupV5Schema, backupV4Schema, backupV3Schema, backupV2Schema, backupV1Schema]);

/** No web state validation: an empty completed session is valid. */
export function validateSnapshot(raw: SnapshotData, builtinExerciseIds: ReadonlySet<string>): SnapshotData {
  const snapshot = snapshotSchema.parse(raw);
  const fail = (code: ErrorCode, message: string, params?: ErrorParams): never => { throw new AppError(code, message, params); };
  for (const [key, entries] of Object.entries(snapshot)) {
    if (!Array.isArray(entries)) continue;
    if (!unique(entries.map(entry => entry.id))) fail('duplicateId', `Powtórzony identyfikator: ${key}.`, { table: key });
    for (const entry of entries) if (entry.profileId !== snapshot.profile?.id) fail('entryProfileInvalid', 'Nieprawidłowy profil wpisu.');
  }
  const exerciseIds = new Set([...builtinExerciseIds, ...snapshot.customExercises.map(e => e.id)]);
  for (const e of snapshot.customExercises) if (builtinExerciseIds.has(e.id)) fail('customExerciseIdCollision', 'Identyfikator własnego ćwiczenia koliduje z katalogiem.');
  if (!unique(snapshot.exerciseRoles.map(entry => entry.exerciseId))) fail('exerciseRolesDuplicate', 'Jedna konfiguracja ról na ćwiczenie.');
  for (const entry of snapshot.exerciseRoles) if (!exerciseIds.has(entry.exerciseId)) fail('exerciseRolesUnknownExercise', 'Nieznane ćwiczenie w konfiguracji ról.');
  if (!unique(snapshot.muscleTargets.map(target => `${target.muscle}:${target.definitionRevision}`))) fail('muscleTargetVersionDuplicate', 'Powtórzona wersja definicji celu mięśni.');
  if (!unique(snapshot.muscleTargets.flatMap(target => target.supersedesId ? [target.supersedesId] : []))) fail('muscleTargetSuccessorDuplicate', 'Definicja celu mięśni może mieć tylko jednego następcę.');
  for (const target of snapshot.muscleTargets) {
    if (target.supersedesId && !snapshot.muscleTargets.some(previous => previous.id === target.supersedesId && previous.muscle === target.muscle && previous.definitionRevision < target.definitionRevision)) fail('muscleTargetPreviousInvalid', 'Nieprawidłowa poprzednia wersja celu mięśni.');
    if (target.scope === 'week-override' && (new Date(target.start + 'T12:00:00Z').getUTCDay() !== 1 || Date.parse(target.end + 'T12:00:00Z') - Date.parse(target.start + 'T12:00:00Z') !== 6 * 86400000)) fail('muscleTargetOverrideWeek', 'Nadpisanie celu wymaga pełnego tygodnia od poniedziałku.');
  }
  if (!unique(snapshot.exerciseNotes.map(n => n.exerciseId))) fail('exerciseNoteDuplicate', 'Jedna notatka do ćwiczenia na osobę.');
  for (const n of snapshot.exerciseNotes) if (!exerciseIds.has(n.exerciseId)) fail('exerciseNoteUnknownExercise', 'Nieznane ćwiczenie w notatce.');
  if (!unique(snapshot.wellness.map(w => `${w.date}:${w.slot}`))) fail('wellnessDuplicate', 'Jeden zapis samopoczucia na porę dnia.');
  for (const w of snapshot.wellness) wellnessResponseSchema.parse(w);
  for (const p of snapshot.periods) {
    if (p.start > p.end) fail('periodRangeInvalid', 'Koniec okresu musi przypadać po początku.');
    if (!p.parentId) continue;
    const parent = snapshot.periods.find(candidate => candidate.id === p.parentId);
    const expected = p.level === 'micro' ? 'meso' : p.level === 'meso' ? 'macro' : null;
    if (!parent || !expected || parent.level !== expected || p.start < parent.start || p.end > parent.end)
      fail('periodParentInvalid', 'Cykl musi mieścić się w nadrzędnym cyklu odpowiedniego poziomu.');
  }
  for (const w of snapshot.workouts) {
    assertStoredLoadCalculation(w);
    assertStoredPlannedLoadCalculation(w);
    if (w.status === 'planned' && !w.wasPlanned) fail('plannedNeedsPlanFlag', 'Zaplanowana sesja wymaga oznaczenia planu.');
    if (!unique(Object.values(w.sections).flat().map(item => item.id))) fail('workoutItemIdDuplicate', 'Powtórzone ID pozycji w sesji.');
    if (w.periodId) {
      const period = snapshot.periods.find(p => p.id === w.periodId);
      if (!period) fail('workoutPeriodUnknown', 'Nieznany okres historycznego przypisania sesji.');
    }
  }
  for (const t of snapshot.templates) {
    if (!unique(Object.values(t.sections).flat().map(item => item.id))) fail('templateItemIdDuplicate', 'Powtórzone ID pozycji w szablonie.');
    if (t.section !== 'whole' && Object.entries(t.sections).some(([key, items]) => key !== t.section && items.length))
      fail('templateSectionMismatch', 'Szablon sekcji może zawierać tylko wybraną sekcję.');
  }
  for (const plan of [...snapshot.workouts, ...snapshot.templates]) {
    if (!unique(plan.supersets.map(group => group.id))) fail('supersetIdDuplicate', 'Powtórzone ID superserii.');
    for (const group of plan.supersets) {
      const positions = plan.sections[group.section].map((item, index) => item.supersetId === group.id ? index : -1).filter(index => index >= 0);
      if (positions.length < 2 || positions.at(-1)! - positions[0] + 1 !== positions.length)
        fail('supersetNotAdjacent', 'Superseria wymaga co najmniej dwóch sąsiadujących ćwiczeń w jednej sekcji.');
    }
    for (const [section, items] of Object.entries(plan.sections)) for (const item of items)
      if (item.supersetId && !plan.supersets.some(group => group.id === item.supersetId && group.section === section))
        fail('supersetUnknown', 'Nieznana superseria lub niezgodna sekcja.');
  }
  for (const g of snapshot.goals) {
    if (g.cadence === 'range' && (!g.start || !g.end)) fail('goalRangeRequired', 'Cel okresowy wymaga początku i końca.');
    if (g.start && g.end && g.start > g.end) fail('goalRangeInvalid', 'Nieprawidłowy zakres celu.');
    if (['count', 'activeDays', 'checkinDays'].includes(g.metric) && !Number.isInteger(g.target)) fail('goalTargetInteger', 'Docelowa liczba treningów lub dni musi być całkowita.');
    if (g.metric === 'sleepAverageHours' && g.target > 24) fail('goalSleepTooHigh', 'Cel snu nie może przekraczać 24 godzin.');
  }
  for (const d of snapshot.drafts) {
    if (Boolean(d.entityId) !== Boolean(d.baseRevision)) fail('draftNeedsEntity', 'Szkic edycji wymaga identyfikatora i wersji sesji.');
    if (d.entityId && !snapshot.workouts.some(w => w.id === d.entityId)) fail('draftUnknownWorkout', 'Szkic wskazuje nieznaną sesję.');
  }
  return snapshot;
}
export class RevisionConflictError extends AppError {
  constructor() { super('revisionConflict', 'Dane zostały zmienione. Odśwież widok przed ponownym zapisem.'); this.name = 'RevisionConflictError'; }
}
