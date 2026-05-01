import { nextInRack } from "./rack";

interface LastSession {
  sets: { weightKg: number; reps: number }[];
}

export interface SuggestionInput {
  lastSession: LastSession | null;
  programExercise: {
    targetSets: number;
    targetRepsMin: number;
    targetRepsMax: number;
    startWeightKg: number | null;
  };
  rack: number[];
}

export function suggestNextSession({ lastSession, programExercise, rack }: SuggestionInput) {
  if (!lastSession || lastSession.sets.length === 0) {
    return {
      weightKg: programExercise.startWeightKg ?? 10,
      repsTarget: programExercise.targetRepsMin,
      reason: "starting_weight" as const,
    };
  }
  const allTop =
    lastSession.sets.length >= programExercise.targetSets &&
    lastSession.sets.every((s) => s.reps >= programExercise.targetRepsMax);
  const lastWeight = lastSession.sets[0].weightKg;
  if (allTop) {
    return { weightKg: nextInRack(lastWeight, rack), repsTarget: programExercise.targetRepsMin, reason: "weight_increase" as const };
  }
  const minReps = Math.min(...lastSession.sets.map((s) => s.reps));
  return {
    weightKg: lastWeight,
    repsTarget: Math.min(minReps + 1, programExercise.targetRepsMax),
    reason: "rep_increase" as const,
  };
}
