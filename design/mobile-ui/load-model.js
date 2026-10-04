/** Personal Trainleaf index. These user-chosen weights are not medical thresholds. */
export const LOAD_ALGORITHM = 'trainleaf-load-v1';
export const LOAD_PARAMETERS = Object.freeze({
  weights: Object.freeze({mental: 0, technique: 0.6, endurance: 0.8, running: 1.05, strength: 1.3, team: 1}),
  scale: Object.freeze({offset: 0.5, divisor: 10})
});

const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const absent = value => value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
const raw = value => value === undefined ? null : value;
const numeric = value => {
  if (absent(value) || !['number', 'string'].includes(typeof value)) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};
const canonicalType = type => type === 'technical' ? 'technique' : type;
const validDate = date => {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T12:00:00Z`);
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === date;
};
const freshParameters = () => ({weights: {...LOAD_PARAMETERS.weights}, scale: {...LOAD_PARAMETERS.scale}});

/**
 * Pure calculation using actual session duration and two post-session ratings.
 * The caller owns save semantics; this does not refresh an existing snapshot.
 */
export function computeTrainleafLoad(workout = {}) {
  const inputs = {
    trainingType: raw(workout.trainingType),
    duration: raw(workout.duration),
    aerobic: raw(workout.postSession?.aerobic),
    muscular: raw(workout.postSession?.muscular)
  };
  const result = {status: 'unavailable', value: null, reason: null, algorithm: LOAD_ALGORITHM, parameters: freshParameters(), inputs};
  const unavailable = reason => ({...result, reason});
  if (workout.status !== 'completed') return unavailable('not_completed');
  if (absent(inputs.trainingType)) return unavailable('missing_training_type');
  const trainingType = canonicalType(inputs.trainingType);
  if (typeof trainingType !== 'string' || !own(LOAD_PARAMETERS.weights, trainingType)) return unavailable('unknown_training_type');
  // Mental sessions deliberately contribute zero without requiring physical ratings.
  if (trainingType === 'mental') return {...result, status: 'calculated', value: 0};
  if (absent(inputs.duration)) return unavailable('missing_duration');
  const duration = numeric(inputs.duration);
  if (duration === null || duration <= 0) return unavailable('invalid_duration');
  const ratings = {};
  for (const field of ['aerobic', 'muscular']) {
    if (absent(inputs[field])) return unavailable(`missing_${field}`);
    const value = numeric(inputs[field]);
    if (value === null || value < 0 || value > 10) return unavailable(`invalid_${field}`);
    ratings[field] = value;
  }
  const {offset, divisor} = LOAD_PARAMETERS.scale;
  const value = LOAD_PARAMETERS.weights[trainingType] * duration * (offset + ratings.aerobic / divisor) * (offset + ratings.muscular / divisor);
  if (!Number.isFinite(value)) return unavailable('invalid_result');
  return {...result, status: 'calculated', value};
}

/** Capture only when the session is explicitly saved; not while rendering history. */
export function snapshotTrainleafLoad(workout) {
  return computeTrainleafLoad(workout);
}

const validCalculatedSnapshot = snapshot => snapshot?.status === 'calculated' && typeof snapshot.value === 'number' && Number.isFinite(snapshot.value) && snapshot.value >= 0 && typeof snapshot.algorithm === 'string' && snapshot.algorithm.length > 0;
const displayFormat = new Intl.NumberFormat('pl-PL', {minimumFractionDigits: 1, maximumFractionDigits: 1});
export function loadDisplay(snapshot) {
  return validCalculatedSnapshot(snapshot) ? displayFormat.format(snapshot.value) : '—';
}

/** Sum historical saved values. Never infer, migrate, or recompute missing snapshots. */
export function loadSummary(workouts = [], today) {
  if (!validDate(today)) throw new RangeError('loadSummary wymaga poprawnej daty today w formacie YYYY-MM-DD.');
  const result = {
    total: null,
    completedCount: 0,
    calculatedCount: 0,
    missingCount: 0,
    mentalCount: 0,
    mentalZeroCount: 0,
    missingByReason: {},
    algorithmCounts: {},
    mixedAlgorithms: false
  };
  for (const workout of workouts) {
    if (workout.status !== 'completed' || !validDate(workout.date) || workout.date > today) continue;
    result.completedCount++;
    const snapshot = workout.loadSnapshot;
    // Snapshot inputs remain the source for a historical result after later edits.
    const type = snapshot?.inputs && own(snapshot.inputs, 'trainingType') ? snapshot.inputs.trainingType : workout.trainingType;
    const mental = canonicalType(type) === 'mental';
    if (mental) result.mentalCount++;
    if (validCalculatedSnapshot(snapshot)) {
      result.total = (result.total ?? 0) + snapshot.value;
      result.calculatedCount++;
      if (mental && snapshot.value === 0) result.mentalZeroCount++;
      Object.defineProperty(result.algorithmCounts, snapshot.algorithm, {value: (own(result.algorithmCounts, snapshot.algorithm) ? result.algorithmCounts[snapshot.algorithm] : 0) + 1, writable: true, enumerable: true, configurable: true});
    } else {
      result.missingCount++;
      const reason = !snapshot ? 'missing_snapshot' : snapshot.status === 'unavailable' && typeof snapshot.reason === 'string' && snapshot.reason ? snapshot.reason : 'invalid_snapshot';
      Object.defineProperty(result.missingByReason, reason, {value: (own(result.missingByReason, reason) ? result.missingByReason[reason] : 0) + 1, writable: true, enumerable: true, configurable: true});
    }
  }
  result.mixedAlgorithms = Object.keys(result.algorithmCounts).length > 1;
  return result;
}
