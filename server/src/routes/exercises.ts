import { Router } from "express";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { exercises, sessions, setLogs } from "../db/schema.js";
import { requireAuth, type AuthedRequest } from "../auth/middleware.js";
import { jerusalemDateString } from "../lib/streak.js";

export const exercisesRouter = Router();

exercisesRouter.get("/", requireAuth, async (_req, res) => {
  const rows = await db.select().from(exercises);
  return res.json({ exercises: rows });
});

async function resolveExercise(idOrSlug: string) {
  const asNumber = Number(idOrSlug);
  if (Number.isFinite(asNumber)) {
    return (await db.select().from(exercises).where(eq(exercises.id, asNumber)).limit(1))[0] ?? null;
  }
  return (await db.select().from(exercises).where(eq(exercises.slug, idOrSlug)).limit(1))[0] ?? null;
}

exercisesRouter.get("/:idOrSlug/history", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const days = Math.max(1, Math.min(730, Number(req.query.days) || 90));
  const exercise = await resolveExercise(req.params.idOrSlug);
  if (!exercise) return res.status(404).json({ error: "not_found" });

  const since = new Date(Date.now() - days * 24 * 3600 * 1000);
  const rows = await db
    .select({
      sessionId: setLogs.sessionId,
      startedAt: sessions.startedAt,
      weightKg: setLogs.weightKg,
      reps: setLogs.reps,
      oneRmKg: setLogs.oneRmKg,
    })
    .from(setLogs)
    .innerJoin(sessions, eq(sessions.id, setLogs.sessionId))
    .where(and(
      eq(setLogs.exerciseId, exercise.id),
      eq(sessions.userId, userId),
      gte(sessions.startedAt, since),
    ))
    .orderBy(sessions.startedAt);

  const bySession = new Map<number, { startedAt: Date; sets: typeof rows }>();
  for (const r of rows) {
    if (!bySession.has(r.sessionId)) bySession.set(r.sessionId, { startedAt: r.startedAt, sets: [] });
    bySession.get(r.sessionId)!.sets.push(r);
  }

  const history = Array.from(bySession.values()).map(({ startedAt, sets }) => {
    const bestSet = sets.reduce((best, s) => ((s.oneRmKg ?? 0) > (best.oneRmKg ?? 0) ? s : best), sets[0]);
    const totalVolumeKg = sets.reduce((acc, s) => acc + s.weightKg * s.reps, 0);
    return {
      date: jerusalemDateString(startedAt),
      bestSet: { weightKg: bestSet.weightKg, reps: bestSet.reps, oneRmKg: bestSet.oneRmKg },
      totalVolumeKg: Math.round(totalVolumeKg * 10) / 10,
    };
  });

  return res.json({ exercise, history });
});

exercisesRouter.get("/:idOrSlug/last-session", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const exercise = await resolveExercise(req.params.idOrSlug);
  if (!exercise) return res.status(404).json({ error: "not_found" });

  const lastSetRows = await db
    .select({
      sessionId: setLogs.sessionId,
      startedAt: sessions.startedAt,
      weightKg: setLogs.weightKg,
      reps: setLogs.reps,
      setNumber: setLogs.setNumber,
      oneRmKg: setLogs.oneRmKg,
    })
    .from(setLogs)
    .innerJoin(sessions, eq(sessions.id, setLogs.sessionId))
    .where(and(eq(setLogs.exerciseId, exercise.id), eq(sessions.userId, userId)))
    .orderBy(desc(sessions.startedAt), setLogs.setNumber);

  if (lastSetRows.length === 0) return res.json({ exercise, lastSession: null });

  const lastSessionId = lastSetRows[0].sessionId;
  const lastSets = lastSetRows.filter((r) => r.sessionId === lastSessionId);
  return res.json({
    exercise,
    lastSession: {
      sessionId: lastSessionId,
      date: jerusalemDateString(lastSets[0].startedAt),
      sets: lastSets.map((s) => ({
        setNumber: s.setNumber,
        weightKg: s.weightKg,
        reps: s.reps,
        oneRmKg: s.oneRmKg,
      })),
    },
  });
});
