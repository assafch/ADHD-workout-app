import { Router } from "express";
import { z } from "zod";
import { and, desc, eq, inArray, lt, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { exercises, programDays, programExercises, sessionExercises, sessions, setLogs } from "../db/schema.js";
import { requireAuth, type AuthedRequest } from "../auth/middleware.js";

export const sessionsRouter = Router();

const createSchema = z.object({
  programDayId: z.number().int().optional(),
  isBadDay: z.boolean().optional(),
  isExtra: z.boolean().optional(),
  source: z.enum(["scheduled", "rotated", "extra", "ai_adjusted"]).optional(),
  clientId: z.string().min(1).max(64),
});

sessionsRouter.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "bad_request" });
  const { programDayId, isBadDay, isExtra, source, clientId } = parsed.data;
  const userId = req.userId!;

  const existing = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.userId, userId), eq(sessions.clientId, clientId)))
    .limit(1);
  if (existing.length > 0) {
    return res.json({ session: existing[0] });
  }

  const [created] = await db.insert(sessions).values({
    userId,
    programDayId: programDayId ?? null,
    startedAt: new Date(),
    isBadDay: isBadDay ?? false,
    status: "in_progress",
    clientId,
    isExtra: isExtra ?? false,
    source: source ?? (isExtra ? "extra" : "scheduled"),
  }).returning();

  return res.json({ session: created });
});

const patchSchema = z.object({
  rpe: z.number().int().min(1).max(10).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  status: z.enum(["in_progress", "completed", "abandoned"]).optional(),
  completedAt: z.string().datetime().nullable().optional(),
});

sessionsRouter.patch("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "bad_id" });

  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "bad_request" });

  const updates: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined) {
      updates[k] = k === "completedAt" && v ? new Date(v as string) : v;
    }
  }

  const [updated] = await db
    .update(sessions)
    .set(updates)
    .where(and(eq(sessions.id, id), eq(sessions.userId, userId)))
    .returning();
  if (!updated) return res.status(404).json({ error: "not_found" });
  return res.json({ session: updated });
});

sessionsRouter.post("/:id/complete", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "bad_id" });

  const session = (await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, id), eq(sessions.userId, userId)))
    .limit(1))[0];
  if (!session) return res.status(404).json({ error: "not_found" });

  const completedAt = new Date();
  const durationSeconds = Math.max(0, Math.round((completedAt.getTime() - new Date(session.startedAt).getTime()) / 1000));

  const [updated] = await db
    .update(sessions)
    .set({ status: "completed", completedAt, durationSeconds })
    .where(eq(sessions.id, id))
    .returning();
  return res.json({ session: updated });
});

sessionsRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const before = req.query.before ? new Date(String(req.query.before)) : null;

  const where = before
    ? and(eq(sessions.userId, userId), lt(sessions.startedAt, before))
    : eq(sessions.userId, userId);

  const rows = await db
    .select()
    .from(sessions)
    .where(where)
    .orderBy(desc(sessions.startedAt))
    .limit(limit);
  return res.json({ sessions: rows });
});

sessionsRouter.get("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "bad_id" });

  const session = (await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, id), eq(sessions.userId, userId)))
    .limit(1))[0];
  if (!session) return res.status(404).json({ error: "not_found" });

  const sets = await db.select().from(setLogs).where(eq(setLogs.sessionId, id)).orderBy(setLogs.setNumber);
  return res.json({ session, sets });
});

const addExerciseSchema = z.object({
  exerciseId: z.number().int().positive(),
  targetSets: z.number().int().min(1).max(20).default(3),
  targetRepsMin: z.number().int().min(1).max(100).default(8),
  targetRepsMax: z.number().int().min(1).max(100).default(12),
  restSeconds: z.number().int().min(0).max(900).default(90),
  startWeightKg: z.number().min(0).max(1000).optional(),
  source: z.enum(["user_added", "ai_suggested"]).default("user_added"),
});

sessionsRouter.post("/:id/exercises", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const sessionId = Number(req.params.id);
  if (!Number.isFinite(sessionId)) return res.status(400).json({ error: "bad_id" });

  const session = (await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
    .limit(1))[0];
  if (!session) return res.status(404).json({ error: "not_found" });

  const parsed = addExerciseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "bad_request", details: parsed.error.flatten() });
  const data = parsed.data;

  const exists = (await db.select().from(exercises).where(eq(exercises.id, data.exerciseId)).limit(1))[0];
  if (!exists) return res.status(404).json({ error: "exercise_not_found" });

  const existingRows = await db
    .select({ orderIndex: sessionExercises.orderIndex })
    .from(sessionExercises)
    .where(eq(sessionExercises.sessionId, sessionId));
  const nextOrder = existingRows.length ? Math.max(...existingRows.map((r) => r.orderIndex)) + 1 : 1000;

  const [created] = await db.insert(sessionExercises).values({
    sessionId,
    exerciseId: data.exerciseId,
    orderIndex: nextOrder,
    targetSets: data.targetSets,
    targetRepsMin: data.targetRepsMin,
    targetRepsMax: data.targetRepsMax,
    restSeconds: data.restSeconds,
    startWeightKg: data.startWeightKg ?? null,
    source: data.source,
  }).returning();

  return res.json({ sessionExercise: created, exercise: exists });
});

sessionsRouter.get("/:id/exercise-suggestions", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const sessionId = Number(req.params.id);
  if (!Number.isFinite(sessionId)) return res.status(400).json({ error: "bad_id" });

  const session = (await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
    .limit(1))[0];
  if (!session) return res.status(404).json({ error: "not_found" });

  const limit = Math.min(10, Math.max(1, Number(req.query.limit) || 5));

  let targetMuscles = new Set<string>();
  const inSessionExerciseIds = new Set<number>();

  if (session.programDayId) {
    const pday = (await db.select().from(programDays).where(eq(programDays.id, session.programDayId)).limit(1))[0];
    if (pday) {
      const pxs = await db.select().from(programExercises).where(eq(programExercises.programDayId, pday.id));
      pxs.forEach((p) => inSessionExerciseIds.add(p.exerciseId));
      if (pxs.length > 0) {
        const programExs = await db.select().from(exercises).where(inArray(exercises.id, pxs.map((p) => p.exerciseId)));
        programExs.forEach((e) => e.primaryMuscles.forEach((m) => targetMuscles.add(m)));
      }
    }
  }
  const sessionExs = await db.select().from(sessionExercises).where(eq(sessionExercises.sessionId, sessionId));
  sessionExs.forEach((s) => inSessionExerciseIds.add(s.exerciseId));

  const allExercises = await db.select().from(exercises);
  const candidates = allExercises.filter((e) => {
    if (inSessionExerciseIds.has(e.id)) return false;
    if (targetMuscles.size === 0) return true;
    return e.primaryMuscles.some((m) => targetMuscles.has(m));
  });

  const lastUsedRows = await db
    .select({
      exerciseId: setLogs.exerciseId,
      lastAt: sql<Date>`max(${sessions.startedAt})`,
    })
    .from(setLogs)
    .innerJoin(sessions, eq(sessions.id, setLogs.sessionId))
    .where(eq(sessions.userId, userId))
    .groupBy(setLogs.exerciseId);
  const lastUsedMap = new Map<number, number>();
  lastUsedRows.forEach((r) => lastUsedMap.set(r.exerciseId, r.lastAt ? new Date(r.lastAt).getTime() : 0));

  const ranked = candidates
    .map((e) => ({
      exercise: e,
      lastUsedMs: lastUsedMap.get(e.id) ?? 0,
      muscleOverlap: e.primaryMuscles.filter((m) => targetMuscles.has(m)).length,
    }))
    .sort((a, b) => {
      if (b.muscleOverlap !== a.muscleOverlap) return b.muscleOverlap - a.muscleOverlap;
      return a.lastUsedMs - b.lastUsedMs;
    })
    .slice(0, limit);

  return res.json({
    suggestions: ranked.map((r) => ({
      exercise: r.exercise,
      reason: r.lastUsedMs === 0
        ? "never_done"
        : `last_${Math.round((Date.now() - r.lastUsedMs) / (24 * 3600 * 1000))}d_ago`,
    })),
  });
});
