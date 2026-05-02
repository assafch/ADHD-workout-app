import { Router } from "express";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { programDays, programs, sessions, setLogs, users } from "../db/schema.js";
import { requireAuth, type AuthedRequest } from "../auth/middleware.js";
import { computeStreak, weekProgress } from "../lib/streak.js";

export const statsRouter = Router();

statsRouter.get("/streak", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const userRow = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  if (!userRow) return res.status(404).json({ error: "user_not_found" });

  const program = userRow.currentProgramId
    ? (await db.select().from(programs).where(eq(programs.id, userRow.currentProgramId)).limit(1))[0]
    : (await db.select().from(programs).where(and(eq(programs.userId, userId), eq(programs.isActive, true))).limit(1))[0];

  const allUserSessions = await db.select().from(sessions).where(eq(sessions.userId, userId));
  const scheduledSessions = allUserSessions.filter((s) => !s.isExtra);
  const totalSessions = scheduledSessions.filter((s) => s.status === "completed").length;

  if (!program) {
    return res.json({
      weekDaysDone: 0,
      weekDaysPlanned: 0,
      totalSessions,
      currentStreakDays: 0,
      longestStreakDays: 0,
    });
  }

  const allDays = await db.select().from(programDays).where(eq(programDays.programId, program.id));
  const phaseDays = allDays
    .filter((d) => d.phase === program.phase)
    .map((d) => ({ dayOfWeek: d.dayOfWeek, isRestDay: d.isRestDay, isCardioDay: d.isCardioDay }));
  const today = new Date();
  const { currentStreakDays, longestStreakDays } = computeStreak(scheduledSessions, phaseDays, today);
  const { weekDaysDone, weekDaysPlanned } = weekProgress(scheduledSessions, phaseDays, today);

  return res.json({
    weekDaysDone,
    weekDaysPlanned,
    totalSessions,
    currentStreakDays,
    longestStreakDays,
  });
});

statsRouter.get("/weekly", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const weeks = Math.max(1, Math.min(52, Number(req.query.weeks) || 4));

  const since = new Date(Date.now() - weeks * 7 * 24 * 3600 * 1000);
  const rows = await db
    .select({
      sessionId: sessions.id,
      startedAt: sessions.startedAt,
      weightKg: setLogs.weightKg,
      reps: setLogs.reps,
    })
    .from(sessions)
    .leftJoin(setLogs, eq(sessions.id, setLogs.sessionId))
    .where(and(eq(sessions.userId, userId), gte(sessions.startedAt, since)));

  const weekMap = new Map<string, { sessions: Set<number>; volume: number }>();
  for (const r of rows) {
    const d = new Date(r.startedAt);
    const dow = d.getDay();
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - dow);
    weekStart.setHours(0, 0, 0, 0);
    const key = weekStart.toISOString().slice(0, 10);
    if (!weekMap.has(key)) weekMap.set(key, { sessions: new Set(), volume: 0 });
    const entry = weekMap.get(key)!;
    entry.sessions.add(r.sessionId);
    if (r.weightKg && r.reps) entry.volume += r.weightKg * r.reps;
  }

  const result = Array.from(weekMap.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([weekStart, v]) => ({
      weekStart,
      sessions: v.sessions.size,
      totalVolumeKg: Math.round(v.volume * 10) / 10,
    }));

  return res.json({ weeks: result });
});
