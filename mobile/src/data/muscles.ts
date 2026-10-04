import { muscles, type Muscle } from '../../../lib/domain';
import { inferExerciseTypes } from '../../../lib/exercise-types';
import type { ExerciseRoles, MuscleRoleAssignment, MuscleTarget, Workout } from './domain';
import { addDays, monday, today } from './analytics';

export function muscleRolesForExercise(configs: ExerciseRoles[], exerciseId: string): MuscleRoleAssignment[]|null {
  const config = configs.find(entry => entry.exerciseId === exerciseId);
  return config ? structuredClone(config.roles) : null;
}
export function muscleTargetForWeek(targets: MuscleTarget[], muscle: Muscle, anchor: string): MuscleTarget|null {
  const start = monday(anchor), end = addDays(start,6);
  return targets.filter(target => target.muscle === muscle && target.start <= end && target.end >= start)
    .sort((a,b) => Number(b.scope === 'week-override') - Number(a.scope === 'week-override') || b.definitionRevision-a.definitionRevision || b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))[0] ?? null;
}
export function muscleWorkSummary(workouts: Workout[], start: string, end: string, mode: 'planned'|'actual') {
  const rows = (Object.entries(muscles) as [Muscle,string][]).map(([muscle,name]) => ({muscle,name,directSets:0,indirectSets:0,complete:true,sessions:new Set<string>()}));
  let unknownRolesCount = 0, unknownSetsCount = 0, missingActualCount = 0, positions = 0;
  const incompleteWorkoutIds = new Set<string>();
  const unique = [...new Map(workouts.map(w => [w.id,w])).values()];
  for (const workout of unique) {
    if (workout.deletedAt || workout.status === 'skipped' || workout.date < start || workout.date > end) continue;
    if (mode === 'planned' ? !workout.wasPlanned : workout.status !== 'completed' || workout.date > today()) continue;
    const seen = new Set<string>();
    for (const item of [...workout.sections.main,...workout.sections.cooldown]) {
      if (seen.has(item.id) || item.exercise.category !== 'strength' || !inferExerciseTypes(item.exercise).includes('strength')) continue;
      seen.add(item.id); positions++;
      const dose = item[mode], roles = item.muscleRoles;
      if (!roles?.length || dose?.sets == null) incompleteWorkoutIds.add(workout.id);
      if (!roles?.length) { unknownRolesCount++; rows.forEach(row => { row.complete = false; }); }
      if (!dose && mode === 'actual') missingActualCount++;
      else if (dose?.sets == null) unknownSetsCount++;
      for (const assignment of roles ?? []) {
        const row = rows.find(entry => entry.muscle === assignment.muscle)!;
        if (dose?.sets == null) { row.complete = false; continue; }
        if (assignment.role === 'direct') row.directSets += dose.sets;
        else row.indirectSets += dose.sets;
        if (dose.sets > 0) row.sessions.add(workout.id);
      }
    }
  }
  const hasData = positions > 0;
  return {mode,start,end,hasData,complete:hasData && rows.every(row => row.complete),unknownRolesCount,unknownSetsCount,missingActualCount,incompleteWorkoutIds:[...incompleteWorkoutIds],
    muscles:rows.map(row => { const knownEffectiveSets = row.directSets + .5*row.indirectSets; const complete = hasData && row.complete;
      return {muscle:row.muscle,name:row.name,directSets:row.directSets,indirectSets:row.indirectSets,knownEffectiveSets,effectiveSets:complete ? knownEffectiveSets : null,exposures:complete ? row.sessions.size : null,complete}; })};
}
