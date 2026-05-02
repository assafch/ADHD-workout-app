import Dexie, { type Table } from "dexie";
import type { TodayResponse } from "@adhd/shared";

export interface PendingSet {
  clientId: string;
  sessionClientId: string;
  sessionId: number | null;
  exerciseId: number;
  programExerciseId: number | null;
  setNumber: number;
  weightKg: number;
  reps: number;
  rir: number | null;
  completedAt: string;
  createdAt: string;
  synced: number;
}

export interface PendingSession {
  clientId: string;
  serverId: number | null;
  programDayId: number | null;
  isBadDay: boolean;
  isExtra?: boolean;
  startedAt: string;
  completedAt: string | null;
  status: "in_progress" | "completed" | "abandoned";
  synced: number;
}

export interface TodayCache {
  key: string;
  data: TodayResponse;
  storedAt: string;
}

export interface UserSnapshot {
  id: number;
  email: string;
  name: string | null;
  locale: string;
  units: string;
  rack: number[];
  storedAt: string;
}

export interface LocalBodyMetric {
  clientKey: string;
  date: string;
  weightKg: number;
  notes: string | null;
  synced: number;
}

class StrengthDB extends Dexie {
  pendingSets!: Table<PendingSet, string>;
  pendingSessions!: Table<PendingSession, string>;
  cache_today!: Table<TodayCache, string>;
  user!: Table<UserSnapshot, number>;
  bodyMetrics!: Table<LocalBodyMetric, string>;

  constructor() {
    super("adhd-strength");
    this.version(1).stores({
      pendingSets: "clientId, sessionClientId, sessionId, synced",
      pendingSessions: "clientId, serverId, synced",
      cache_today: "key",
      user: "id",
      bodyMetrics: "clientKey, date, synced",
    });
  }
}

export const dexie = new StrengthDB();
