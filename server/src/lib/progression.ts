import { nextInRack } from "./rack.js";

export interface LastSessionInput {
  sets: { weightKg: number; reps: number }[];
}

export interface ProgressionInput {
  lastSession: LastSessionInput | null;
  programExercise: {
    targetSets: number;
    targetRepsMin: number;
    targetRepsMax: number;
    startWeightKg: number | null;
  };
  rack: number[];
}

export interface Suggestion {
  weightKg: number;
  repsTarget: number;
  reason: "starting_weight" | "weight_increase" | "rep_increase";
}

export function suggestNextSession({ lastSession, programExercise, rack }: ProgressionInput): Suggestion {
  if (!lastSession || lastSession.sets.length === 0) {
    return {
      weightKg: programExercise.startWeightKg ?? 10,
      repsTarget: programExercise.targetRepsMin,
      reason: "starting_weight",
    };
  }

  const allSetsAtTopRange =
    lastSession.sets.length >= programExercise.targetSets &&
    lastSession.sets.every((s) => s.reps >= programExercise.targetRepsMax);

  const lastWeight = lastSession.sets[0].weightKg;

  if (allSetsAtTopRange) {
    return {
      weightKg: nextInRack(lastWeight, rack),
      repsTarget: programExercise.targetRepsMin,
      reason: "weight_increase",
    };
  }

  const minRepsLastSession = Math.min(...lastSession.sets.map((s) => s.reps));
  return {
    weightKg: lastWeight,
    repsTarget: Math.min(minRepsLastSession + 1, programExercise.targetRepsMax),
    reason: "rep_increase",
  };
}
