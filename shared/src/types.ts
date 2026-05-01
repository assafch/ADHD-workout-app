export type Locale = "he" | "en";
export type Units = "kg" | "lb";

export interface User {
  id: number;
  email: string;
  name: string | null;
  locale: Locale;
  units: Units;
  heightCm: number | null;
  dob: string | null;
  programStartDate: string | null;
  currentProgramId: number | null;
  rack: number[];
  createdAt: string;
}

export interface Exercise {
  id: number;
  slug: string;
  nameEn: string;
  nameHe: string;
  primaryMuscles: string[];
  equipment: string;
  isUnilateral: boolean;
  instructionEn: string | null;
  instructionHe: string | null;
}

export interface ProgramDay {
  id: number;
  programId: number;
  phase: number;
  dayOfWeek: number;
  nameEn: string;
  nameHe: string;
  isRestDay: boolean;
  isCardioDay: boolean;
  notesEn: string | null;
  notesHe: string | null;
}

export interface ProgramExercise {
  id: number;
  programDayId: number;
  exerciseId: number;
  orderIndex: number;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  restSeconds: number;
  startWeightKg: number | null;
  notesEn: string | null;
  notesHe: string | null;
}

export interface SetLog {
  id: number;
  sessionId: number;
  programExerciseId: number | null;
  exerciseId: number;
  setNumber: number;
  weightKg: number;
  reps: number;
  rir: number | null;
  isPR: boolean;
  oneRmKg: number | null;
  completedAt: string;
  clientId: string | null;
}

export interface Session {
  id: number;
  userId: number;
  programDayId: number | null;
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
  rpe: number | null;
  notes: string | null;
  isBadDay: boolean;
  status: "in_progress" | "completed" | "abandoned";
  clientId: string | null;
}

export interface BodyMetric {
  id: number;
  userId: number;
  date: string;
  weightKg: number;
  notes: string | null;
}

export interface TodayExerciseSuggestion {
  weightKg: number;
  repsTarget: number;
  reason: "starting_weight" | "weight_increase" | "rep_increase";
}

export interface TodayExercise {
  programExerciseId: number;
  exercise: Pick<Exercise, "id" | "slug" | "nameEn" | "nameHe" | "primaryMuscles" | "isUnilateral">;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  restSeconds: number;
  lastSession: { date: string; sets: { weightKg: number; reps: number; oneRmKg: number | null }[] } | null;
  suggestion: TodayExerciseSuggestion;
  bestEverOneRm: number | null;
}

export interface TodayResponse {
  date: string;
  dayOfWeek: number;
  isRestDay: boolean;
  isCardioDay: boolean;
  programDay: { id: number; nameEn: string; nameHe: string } | null;
  exercises: TodayExercise[];
  activeSession: { id: number; startedAt: string } | null;
  streak: {
    weekDaysDone: number;
    weekDaysPlanned: number;
    totalSessions: number;
    currentStreakDays: number;
  };
}

export interface AuthResponse {
  token: string;
  user: User;
}
