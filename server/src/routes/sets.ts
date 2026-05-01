import { Router } from "express";
import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { sessions, setLogs } from "../db/schema.js";
import { requireAuth, type AuthedRequest } from "../auth/middleware.js";
import { epley1RM } from "../lib/oneRM.js";

export const setsRouter = Router();

const createSetSchema = z.object({
  exerciseId: z.number().int(),
  programExerciseId: z.number().int().optional(),
  setNumber: z.number().int().min(1).max(50),
  weightKg: z.number().min(0).max(1000),
  reps: z.number().int().min(0).max(500),
  rir: z.number().int().min(0).max(20).optional(),
  clientId: z.string().min(1).max(64),
  completedAt: z.string().datetime().optional(),
});

setsRouter.post("/sessions/:sessionId/sets", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const sessionId = Number(req.params.sessionId);
  if (!Number.isFinite(sessionId)) return res.status(400).json({ error: "bad_id" });

  const parsed = createSetSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "bad_request", details: parsed.error.flatten() });
  const data = parsed.data;

  const session = (await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
    .limit(1))[0];
  if (!session) return res.status(404).json({ error: "session_not_found" });

  const existing = await db
    .select()
    .from(setLogs)
    .where(and(eq(setLogs.sessionId, sessionId), eq(setLogs.clientId, data.clientId)))
    .limit(1);
  if (existing.length > 0) {
    return res.json({ set: existing[0], isPR: existing[0].isPR });
  }

  const oneRmKg = epley1RM(data.weightKg, data.reps);

  const bestRow = (await db
    .select({ best: sql<number>`max(${setLogs.oneRmKg})` })
    .from(setLogs)
    .innerJoin(sessions, eq(sessions.id, setLogs.sessionId))
    .where(and(eq(setLogs.exerciseId, data.exerciseId), eq(sessions.userId, userId))))[0];

  const previousBest = bestRow?.best ?? 0;
  const isPR = oneRmKg > previousBest && data.reps > 0;

  const [created] = await db.insert(setLogs).values({
    sessionId,
    programExerciseId: data.programExerciseId ?? null,
    exerciseId: data.exerciseId,
    setNumber: data.setNumber,
    weightKg: data.weightKg,
    reps: data.reps,
    rir: data.rir ?? null,
    isPR,
    oneRmKg,
    completedAt: data.completedAt ? new Date(data.completedAt) : new Date(),
    clientId: data.clientId,
  }).returning();

  return res.json({ set: created, isPR, oneRmKg });
});

setsRouter.delete("/sets/:id", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "bad_id" });

  const setRow = (await db
    .select({ id: setLogs.id, sessionId: setLogs.sessionId })
    .from(setLogs)
    .innerJoin(sessions, eq(sessions.id, setLogs.sessionId))
    .where(and(eq(setLogs.id, id), eq(sessions.userId, userId)))
    .limit(1))[0];
  if (!setRow) return res.status(404).json({ error: "not_found" });

  await db.delete(setLogs).where(eq(setLogs.id, id));
  return res.json({ ok: true });
});
