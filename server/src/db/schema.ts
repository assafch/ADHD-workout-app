import { pgTable, serial, varchar, text, integer, real, timestamp, boolean, jsonb, uniqueIndex, date } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 100 }),
  locale: varchar("locale", { length: 5 }).notNull().default("he"),
  units: varchar("units", { length: 5 }).notNull().default("kg"),
  heightCm: real("height_cm"),
  dob: date("dob"),
  programStartDate: date("program_start_date"),
  currentProgramId: integer("current_program_id"),
  rack: jsonb("rack").$type<number[]>().notNull().default([2, 5, 7, 10, 12, 14, 16, 18, 20, 22, 25, 28, 30, 32, 34, 36]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  nameEn: varchar("name_en", { length: 120 }).notNull(),
  nameHe: varchar("name_he", { length: 120 }).notNull(),
  primaryMuscles: jsonb("primary_muscles").$type<string[]>().notNull(),
  equipment: varchar("equipment", { length: 40 }).notNull(),
  isUnilateral: boolean("is_unilateral").notNull().default(false),
  instructionEn: text("instruction_en"),
  instructionHe: text("instruction_he"),
});

export const programs = pgTable("programs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  nameEn: varchar("name_en", { length: 120 }).notNull(),
  nameHe: varchar("name_he", { length: 120 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  phase: integer("phase").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const programDays = pgTable("program_days", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull().references(() => programs.id, { onDelete: "cascade" }),
  phase: integer("phase").notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  nameEn: varchar("name_en", { length: 120 }).notNull(),
  nameHe: varchar("name_he", { length: 120 }).notNull(),
  isRestDay: boolean("is_rest_day").notNull().default(false),
  isCardioDay: boolean("is_cardio_day").notNull().default(false),
  notesEn: text("notes_en"),
  notesHe: text("notes_he"),
});

export const programExercises = pgTable("program_exercises", {
  id: serial("id").primaryKey(),
  programDayId: integer("program_day_id").notNull().references(() => programDays.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id").notNull().references(() => exercises.id),
  orderIndex: integer("order_index").notNull(),
  targetSets: integer("target_sets").notNull(),
  targetRepsMin: integer("target_reps_min").notNull(),
  targetRepsMax: integer("target_reps_max").notNull(),
  restSeconds: integer("rest_seconds").notNull(),
  startWeightKg: real("start_weight_kg"),
  notesEn: text("notes_en"),
  notesHe: text("notes_he"),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  programDayId: integer("program_day_id").references(() => programDays.id),
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  durationSeconds: integer("duration_seconds"),
  rpe: integer("rpe"),
  notes: text("notes"),
  isBadDay: boolean("is_bad_day").notNull().default(false),
  status: varchar("status", { length: 20 }).notNull().default("in_progress"),
  clientId: varchar("client_id", { length: 64 }),
  isExtra: boolean("is_extra").notNull().default(false),
  source: varchar("source", { length: 20 }).notNull().default("scheduled"),
});

export const sessionExercises = pgTable("session_exercises", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id").notNull().references(() => exercises.id),
  orderIndex: integer("order_index").notNull(),
  targetSets: integer("target_sets").notNull(),
  targetRepsMin: integer("target_reps_min").notNull(),
  targetRepsMax: integer("target_reps_max").notNull(),
  restSeconds: integer("rest_seconds").notNull(),
  startWeightKg: real("start_weight_kg"),
  source: varchar("source", { length: 20 }).notNull().default("user_added"),
  notesEn: text("notes_en"),
  notesHe: text("notes_he"),
});

export const setLogs = pgTable("set_logs", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
  programExerciseId: integer("program_exercise_id").references(() => programExercises.id),
  exerciseId: integer("exercise_id").notNull().references(() => exercises.id),
  setNumber: integer("set_number").notNull(),
  weightKg: real("weight_kg").notNull(),
  reps: integer("reps").notNull(),
  rir: integer("rir"),
  isPR: boolean("is_pr").notNull().default(false),
  oneRmKg: real("one_rm_kg"),
  completedAt: timestamp("completed_at").notNull(),
  clientId: varchar("client_id", { length: 64 }),
});

export const bodyMetrics = pgTable("body_metrics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  weightKg: real("weight_kg").notNull(),
  notes: text("notes"),
}, (t) => ({
  userDateIdx: uniqueIndex("body_user_date_idx").on(t.userId, t.date),
}));

export type UserRow = typeof users.$inferSelect;
export type ExerciseRow = typeof exercises.$inferSelect;
export type ProgramRow = typeof programs.$inferSelect;
export type ProgramDayRow = typeof programDays.$inferSelect;
export type ProgramExerciseRow = typeof programExercises.$inferSelect;
export type SessionRow = typeof sessions.$inferSelect;
export type SessionExerciseRow = typeof sessionExercises.$inferSelect;
export type SetLogRow = typeof setLogs.$inferSelect;
export type BodyMetricRow = typeof bodyMetrics.$inferSelect;
