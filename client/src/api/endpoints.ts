import type { AuthResponse, BodyMetric, Exercise, Session, SetLog, TodayResponse, User } from "@adhd/shared";
import { api } from "./client";

export const auth = {
  login: (email: string, password: string) =>
    api<AuthResponse>("/api/auth/login", { method: "POST", body: { email, password }, auth: false }),
  me: () => api<{ user: User }>("/api/auth/me"),
  patchMe: (patch: Partial<Pick<User, "name" | "locale" | "units" | "heightCm" | "dob" | "rack">>) =>
    api<{ user: User }>("/api/auth/me", { method: "PATCH", body: patch }),
};

export const today = {
  get: () => api<TodayResponse>("/api/today"),
};

export const sessions = {
  create: (body: { programDayId?: number; isBadDay?: boolean; isExtra?: boolean; source?: "scheduled" | "rotated" | "extra" | "ai_adjusted"; clientId: string }) =>
    api<{ session: Session }>("/api/sessions", { method: "POST", body }),
  patch: (id: number, body: Partial<Pick<Session, "rpe" | "notes" | "status" | "completedAt">>) =>
    api<{ session: Session }>(`/api/sessions/${id}`, { method: "PATCH", body }),
  complete: (id: number) => api<{ session: Session }>(`/api/sessions/${id}/complete`, { method: "POST", body: {} }),
  list: (limit = 20) => api<{ sessions: Session[] }>(`/api/sessions?limit=${limit}`),
  detail: (id: number) => api<{ session: Session; sets: SetLog[] }>(`/api/sessions/${id}`),
  addExercise: (
    sessionId: number,
    body: {
      exerciseId: number;
      targetSets?: number;
      targetRepsMin?: number;
      targetRepsMax?: number;
      restSeconds?: number;
      startWeightKg?: number;
      source?: "user_added" | "ai_suggested";
    },
  ) => api<{ sessionExercise: { id: number }; exercise: Exercise }>(`/api/sessions/${sessionId}/exercises`, { method: "POST", body }),
  exerciseSuggestions: (sessionId: number, limit = 5) =>
    api<{ suggestions: { exercise: Exercise; reason: string }[] }>(`/api/sessions/${sessionId}/exercise-suggestions?limit=${limit}`),
};

export const sets = {
  create: (
    sessionId: number,
    body: {
      exerciseId: number;
      programExerciseId?: number;
      setNumber: number;
      weightKg: number;
      reps: number;
      rir?: number;
      clientId: string;
      completedAt?: string;
    },
  ) => api<{ set: SetLog; isPR: boolean; oneRmKg: number }>(`/api/sessions/${sessionId}/sets`, { method: "POST", body }),
  remove: (id: number) => api<{ ok: true }>(`/api/sets/${id}`, { method: "DELETE" }),
};

export const exercises = {
  list: () => api<{ exercises: Exercise[] }>("/api/exercises"),
  history: (idOrSlug: string | number, days = 90) =>
    api<{ exercise: Exercise; history: { date: string; bestSet: { weightKg: number; reps: number; oneRmKg: number | null }; totalVolumeKg: number }[] }>(`/api/exercises/${idOrSlug}/history?days=${days}`),
  lastSession: (idOrSlug: string | number) =>
    api<{ exercise: Exercise; lastSession: { sessionId: number; date: string; sets: { setNumber: number; weightKg: number; reps: number; oneRmKg: number | null }[] } | null }>(`/api/exercises/${idOrSlug}/last-session`),
};

export const body = {
  upsert: (date: string, weightKg: number, notes?: string) =>
    api<{ metric: BodyMetric }>("/api/body/weight", { method: "POST", body: { date, weightKg, notes } }),
  list: (days = 90) => api<{ metrics: BodyMetric[] }>(`/api/body/weight?days=${days}`),
};

export const programs = {
  active: () => api<{
    program: { id: number; phase: number; nameEn: string; nameHe: string } | null;
    days: { id: number; phase: number; dayOfWeek: number; nameEn: string; nameHe: string; isRestDay: boolean; isCardioDay: boolean }[];
    programExercises: { id: number; programDayId: number; exerciseId: number; orderIndex: number; targetSets: number; targetRepsMin: number; targetRepsMax: number; restSeconds: number; startWeightKg: number | null }[];
    exercises: Exercise[];
  }>("/api/programs/active"),
  patch: (id: number, body: { phase?: number; nameEn?: string; nameHe?: string }) =>
    api<{ program: { id: number; phase: number } }>(`/api/programs/${id}`, { method: "PATCH", body }),
  rotate: (programDayId: number) =>
    api<{ rotated: boolean; shift?: number; days: { id: number; phase: number; dayOfWeek: number; nameEn: string; nameHe: string; isRestDay: boolean; isCardioDay: boolean }[] }>(
      "/api/programs/rotate",
      { method: "POST", body: { programDayId } },
    ),
};

export type AdvisorAction =
  | { type: "swap_exercise"; fromSlug: string; toSlug: string; note?: string }
  | { type: "drop_sets"; slug: string; sets: number; note?: string }
  | { type: "reduce_weight"; slug: string; factor: number; note?: string }
  | { type: "add_exercise"; slug: string; targetSets?: number; targetRepsMin?: number; targetRepsMax?: number; note?: string }
  | { type: "skip_today"; note?: string }
  | { type: "no_action"; note?: string };

export const advisor = {
  ask: (text: string) =>
    api<{ rationale: string; actions: AdvisorAction[] }>("/api/advisor", { method: "POST", body: { text } }),
};

export const stats = {
  streak: () => api<{ weekDaysDone: number; weekDaysPlanned: number; totalSessions: number; currentStreakDays: number; longestStreakDays: number }>("/api/stats/streak"),
  weekly: (weeks = 4) => api<{ weeks: { weekStart: string; sessions: number; totalVolumeKg: number }[] }>(`/api/stats/weekly?weeks=${weeks}`),
};
