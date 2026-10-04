import type { LoadCalculation, TrainingType, Workout, WorkoutInput } from './domain';
import { localDay } from '../../../lib/domain';
import { AppError } from './errors';
/** Frozen parameters for new v1 calculations. Saved calculations carry their own copy. */
export const LOAD_WEIGHTS_V1: Readonly<Record<TrainingType, number>> = Object.freeze({
  mental: 0, technical: 0.6, endurance: 0.8, running: 1.05, strength: 1.3, team: 1,
});
export const LOAD_FATIGUE_MAPPING_V1 = Object.freeze({ base: 0.5, perPoint: 0.1 });
export function fatigueMultiplier(value: number | null): number | null {
  if (value === null) return null;
  if (!Number.isInteger(value) || value < 0 || value > 10) throw new AppError('fatigueRatingRange', 'Ocena zmęczenia musi mieścić się od 0 do 10.');
  return LOAD_FATIGUE_MAPPING_V1.base + value / 10;
}
/** No rounding is applied to stored values; display precision is a presentation concern. */
export function calculateTrainingLoad(workout: WorkoutInput): LoadCalculation | null {
  if (workout.status !== 'completed' || workout.date > localDay() || !workout.trainingType
    || !Object.hasOwn(LOAD_WEIGHTS_V1, workout.trainingType)) return null;
  const trainingType = workout.trainingType;
  const durationMinutes = workout.durationMinutes ?? null;
  const aerobicFatigue = workout.postWorkout?.aerobicFatigue ?? null;
  const muscularFatigue = workout.postWorkout?.muscularFatigue ?? null;
  const aerobic = fatigueMultiplier(aerobicFatigue), muscular = fatigueMultiplier(muscularFatigue);
  if (trainingType !== 'mental' && (durationMinutes === null || aerobic === null || muscular === null)) return null;
  const value = trainingType === 'mental' ? 0 : durationMinutes! * LOAD_WEIGHTS_V1[trainingType] * aerobic! * muscular!;
  return { version: 'trainleaf-v1', inputs: { trainingType, durationMinutes, aerobicFatigue, muscularFatigue },
    parameters: { weights: { ...LOAD_WEIGHTS_V1 }, typeWeight: LOAD_WEIGHTS_V1[trainingType], fatigueMapping: { ...LOAD_FATIGUE_MAPPING_V1 } }, value };
}
export function sameLoadInputs(previous: Workout, next: WorkoutInput): boolean {
  // A date correction can make an imported, uncalculated future record eligible.
  // Existing parameter snapshots remain untouched by a date-only correction.
  return (previous.loadCalculation !== null || previous.date === next.date)
    && previous.status === next.status && previous.trainingType === next.trainingType
    && previous.durationMinutes === next.durationMinutes
    && previous.postWorkout.aerobicFatigue === next.postWorkout?.aerobicFatigue
    && previous.postWorkout.muscularFatigue === next.postWorkout?.muscularFatigue;
}
/** Read the saved result, never recalculate history with today's parameters. */
export function trainingLoad(workout: Workout, asOf = localDay()): number | null {
  return workout.deletedAt || workout.status !== 'completed' || workout.date > asOf ? null : workout.loadCalculation?.value ?? null;
}

/** Check stored inputs and arithmetic using the saved parameters, never today's weights.
 * Future completed records are accepted here so backup reads remain lossless.
 */
export function assertStoredLoadCalculation(workout: Workout): void {
  const calculation = workout.loadCalculation;
  if (!calculation) return;
  const fail = (): never => { throw new AppError('storedLoadMismatch', 'Zapisane obciążenie nie jest zgodne z danymi treningu lub parametrami obliczenia.'); };
  const { inputs, parameters, value } = calculation;
  if (workout.status !== 'completed' || inputs.trainingType !== workout.trainingType
    || inputs.durationMinutes !== workout.durationMinutes
    || inputs.aerobicFatigue !== workout.postWorkout.aerobicFatigue
    || inputs.muscularFatigue !== workout.postWorkout.muscularFatigue
    || parameters.typeWeight !== parameters.weights[inputs.trainingType]) fail();
  let expected: number;
  if (inputs.trainingType === 'mental') {
    if (parameters.typeWeight !== 0) fail();
    expected = 0;
  } else {
    if (inputs.durationMinutes === null || inputs.aerobicFatigue === null || inputs.muscularFatigue === null) fail();
    const aerobic = parameters.fatigueMapping.base + inputs.aerobicFatigue! * parameters.fatigueMapping.perPoint;
    const muscular = parameters.fatigueMapping.base + inputs.muscularFatigue! * parameters.fatigueMapping.perPoint;
    expected = inputs.durationMinutes! * parameters.typeWeight * aerobic * muscular;
  }
  if (!Number.isFinite(expected) || Math.abs(value - expected) > Math.max(1, Math.abs(expected)) * 1e-10) fail();
}

/** Separate planned estimate. No actual survey answers enter this calculation. */
export function calculatePlannedTrainingLoad(workout: WorkoutInput): LoadCalculation | null {
  if (!workout.wasPlanned && workout.status !== 'planned') return null;
  return calculateTrainingLoad({ ...workout, date: localDay(), status: 'completed',
    durationMinutes: workout.plannedMinutes ?? null, postWorkout: { ...workout.plannedFatigue, satisfaction: null, notes: '' } });
}
export function samePlannedLoadInputs(previous: Workout, next: WorkoutInput): boolean {
  return previous.wasPlanned === next.wasPlanned && previous.trainingType === next.trainingType
    && previous.plannedMinutes === next.plannedMinutes
    && previous.plannedFatigue.aerobicFatigue === next.plannedFatigue?.aerobicFatigue
    && previous.plannedFatigue.muscularFatigue === next.plannedFatigue?.muscularFatigue;
}
export function assertStoredPlannedLoadCalculation(workout: Workout): void {
  if (!workout.plannedLoadCalculation) return;
  if (!workout.wasPlanned) throw new AppError('plannedEstimateNeedsPlan', 'Szacunek planu wymaga oznaczonego planu.');
  assertStoredLoadCalculation({ ...workout, status: 'completed', durationMinutes: workout.plannedMinutes,
    postWorkout: { ...workout.plannedFatigue, satisfaction: null, notes: '' }, loadCalculation: workout.plannedLoadCalculation });
}
