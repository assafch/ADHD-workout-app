import { epley1RM } from "./oneRM";

export interface PRChaseInput {
  bestOneRm: number | null;
  weightKg: number;
  /** The reps the user is about to attempt (their suggested target). */
  plannedReps: number;
  /** Reps the user did at this same weight last time (for the "past PR row"). */
  lastReps?: number | null;
  rack: number[];
}

export interface PRChase {
  /** Reps needed at current weight to break the PR (strictly greater than). */
  repsNeeded: number;
  /** Smallest absolute weight bump (kg) at planned reps that breaks the PR, given the rack. */
  weightBumpKg: number | null;
  /** Reps the user is currently set to attempt — anchors the "9?" label. */
  plannedReps: number;
  /** Past-best reps at this weight (for the ghost row). Falls back to plannedReps - 1. */
  ghostReps: number;
  /** True if breaking the PR is "in striking distance" — within +1-2 reps of plan. */
  inStrikingDistance: boolean;
}

/**
 * Compute what it would take to break the user's current 1RM in the next set.
 * Returns null when no PR exists yet (first session for this exercise).
 */
export function computePRChase(input: PRChaseInput): PRChase | null {
  const { bestOneRm, weightKg, plannedReps, lastReps, rack } = input;
  if (!bestOneRm || bestOneRm <= 0 || weightKg <= 0) return null;

  // Inverse Epley: reps where weight × (1 + reps/30) > PR  →  reps > (PR/weight − 1) × 30
  const repsForBreak = Math.floor((bestOneRm / weightKg - 1) * 30) + 1;
  const repsNeeded = Math.max(1, repsForBreak);

  // Smallest weight bump on rack at planned reps that beats PR.
  let weightBumpKg: number | null = null;
  for (const r of rack) {
    if (r <= weightKg) continue;
    if (epley1RM(r, plannedReps) > bestOneRm) {
      weightBumpKg = Math.round((r - weightKg) * 10) / 10;
      break;
    }
  }

  const ghostReps = lastReps != null && lastReps > 0 ? lastReps : Math.max(1, plannedReps - 1);
  const inStrikingDistance = repsNeeded <= plannedReps + 2;

  return { repsNeeded, weightBumpKg, plannedReps, ghostReps, inStrikingDistance };
}
