/**
 * Stable codes for errors shown to the user. The interface translates the code;
 * `message` is a diagnostic text for logs and tests and is never matched or displayed.
 */
export const ERROR_CODES = [
  // Validation of single fields (Zod issues).
  'dateInvalid', 'profileNameRequired', 'sportRequired', 'moduleRequired', 'muscleRoleDuplicate', 'eventTitleRequired', 'eventRangeInvalid',
  'referenceLoadRequired', 'referenceMismatch', 'targetProvenanceRequired', 'muscleTargetInvalid', 'draftTooLarge',
  // Shared catalog schemas (lib/); see docs/mobile-localization.md.
  'videoLinkInvalid', 'muscleSharesInvalid', 'wellnessAnswerRequired', 'wellnessQuestionSlot',
  // Consistency of the stored snapshot and of imported backups.
  'duplicateId', 'entryProfileInvalid', 'customExerciseIdCollision', 'exerciseRolesDuplicate', 'exerciseRolesUnknownExercise',
  'muscleTargetVersionDuplicate', 'muscleTargetSuccessorDuplicate', 'muscleTargetPreviousInvalid', 'muscleTargetOverrideWeek',
  'exerciseNoteDuplicate', 'exerciseNoteUnknownExercise', 'wellnessDuplicate', 'periodRangeInvalid', 'periodParentInvalid',
  'plannedNeedsPlanFlag', 'workoutItemIdDuplicate', 'workoutPeriodUnknown', 'templateItemIdDuplicate', 'templateSectionMismatch',
  'supersetIdDuplicate', 'supersetNotAdjacent', 'supersetUnknown', 'goalRangeRequired', 'goalRangeInvalid', 'goalTargetInteger',
  'goalSleepTooHigh', 'draftNeedsEntity', 'draftUnknownWorkout',
  // Repository rules.
  'revisionConflict', 'backupTooLarge', 'revisionLimit', 'dataVersionUnreadable', 'goalDaysExceedPeriod', 'profileRequired',
  'entryProfileMove', 'completedInFuture', 'workoutProfileMove', 'sportNotInProfile', 'muscleTargetStartsInPast',
  'muscleTargetProfileInvalid', 'muscleTargetVersionMismatch', 'copyWeekSameTarget', 'profileInvalid', 'overrideNotMonday',
  'fatigueRatingRange', 'storedLoadMismatch', 'plannedEstimateNeedsPlan', 'supersetNumberInvalid', 'recoveryTooLarge',
  // Storage and platform.
  'databaseNewer', 'closeOtherTabs', 'localReadFailed', 'localWriteFailed', 'browserUnsupported', 'databaseClosed',
  'platformUnsupported', 'fileNameInvalid',
  // Form checks made by the screens before saving.
  'fieldRequired', 'fieldInteger', 'fieldNumber', 'futureAsPlan', 'sportDetailsRequired', 'kindRequired', 'draftKept',
  'backupFileTooLarge', 'wellnessExists', 'wellnessValueRange', 'wellnessSleepStep',
  'referenceConfirmRequired', 'referenceWeekNotFinished', 'referenceDayMissing', 'referenceValuesInvalid',
  // Fallbacks for errors without a code.
  'checkInput', 'saveFailed',
] as const;
export type ErrorCode = typeof ERROR_CODES[number];
export type ErrorParams = Record<string, string | number>;
export class AppError extends Error {
  constructor(readonly code: ErrorCode, message: string = code, readonly params: ErrorParams = {}) {
    super(message);
    this.name = 'AppError';
  }
}
const ISSUE_PREFIX = 'error:';
/** Zod accepts only a text for an issue; the text carries the code. */
export const issue = (code: ErrorCode) => `${ISSUE_PREFIX}${code}`;
export function issueCode(message: unknown): ErrorCode | null {
  if (typeof message !== 'string' || !message.startsWith(ISSUE_PREFIX)) return null;
  const code = message.slice(ISSUE_PREFIX.length);
  return (ERROR_CODES as readonly string[]).includes(code) ? code as ErrorCode : null;
}
