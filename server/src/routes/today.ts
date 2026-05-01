import { Router } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { exercises, programDays, programExercises, programs, sessions, setLogs, users } from "../db/schema.js";
import { requireAuth, type AuthedRequest } from "../auth/middleware.js";
import { suggestNextSession } from "../lib/progression.js";
import { computeStreak, jerusalemDateString, jerusalemDayOfWeek, weekProgress } from "../lib/streak.js";

export const todayRouter = Router();

todayRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const userRow = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  if (!userRow) return res.status(404).json({ error: "user_not_found" });

  const today = new Date();
  const dayOfWeek = jerusalemDayOfWeek(today);
  const dateStr = jerusalemDateString(today);

  const program = userRow.currentProgramId
    ? (await db.select().from(programs).where(eq(programs.id, userRow.currentProgramId)).limit(1))[0]
    : (await db.select().from(programs).where(and(eq(programs.userId, userId), eq(programs.isActive, true))).limit(1))[0];

  if (!program) {
    return res.json({
      date: dateStr,
      dayOfWeek,
      isRestDay: false,
      isCardioDay: false,
      programDay: null,
      exercises: [],
      activeSession: null,
      streak: { weekDaysDone: 0, weekDaysPlanned: 0, totalSessions: 0, currentStreakDays: 0 },
    });
  }

  await maybeAdvancePhase(program.id, userId);
  const refreshedProgram = (await db.select().from(programs).where(eq(programs.id, program.id)).limit(1))[0];

  const allDays = await db.select().from(programDays).where(eq(programDays.programId, program.id));
  const phaseDays = allDays.filter((d) => d.phase === refreshedProgram.phase);
  const today_pd = phaseDays.find((d) => d.dayOfWeek === dayOfWeek) ?? null;

  const pxRows = today_pd
    ? await db.select().from(programExercises).where(eq(programExercises.programDayId, today_pd.id))
    : [];

  const exerciseRows = await db.select().from(exercises);
  const exMap = new Map(exerciseRows.map((e) => [e.id, e]));

  const activeSession = (await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.userId, userId), eq(sessions.status, "in_progress")))
    .orderBy(desc(sessions.startedAt))
    .limit(1))[0] ?? null;

  const todayExercises = await Promise.all(
    pxRows
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map(async (px) => {
        const ex = exMap.get(px.exerciseId)!;

        const lastSetRows = await db
          .select({
            sessionId: setLogs.sessionId,
            startedAt: sessions.startedAt,
            weightKg: setLogs.weightKg,
            reps: setLogs.reps,
            oneRmKg: setLogs.oneRmKg,
          })
          .from(setLogs)
          .innerJoin(sessions, eq(sessions.id, setLogs.sessionId))
          .where(and(eq(setLogs.exerciseId, ex.id), eq(sessions.userId, userId)))
          .orderBy(desc(sessions.startedAt), desc(setLogs.setNumber));

        let lastSession: { date: string; sets: { weightKg: number; reps: number; oneRmKg: number | null }[] } | null = null;
        if (lastSetRows.length > 0) {
          const lastSessionId = lastSetRows[0].sessionId;
          const lastSets = lastSetRows.filter((r) => r.sessionId === lastSessionId);
          lastSession = {
            date: jerusalemDateString(lastSets[0].startedAt),
            sets: lastSets.map((s) => ({ weightKg: s.weightKg, reps: s.reps, oneRmKg: s.oneRmKg })),
          };
        }

        const bestRow = (await db
          .select({ best: sql<number>`max(${setLogs.oneRmKg})` })
          .from(setLogs)
          .innerJoin(sessions, eq(sessions.id, setLogs.sessionId))
          .where(and(eq(setLogs.exerciseId, ex.id), eq(sessions.userId, userId))))[0];

        const suggestion = suggestNextSession({
          lastSession: lastSession ? { sets: lastSession.sets } : null,
          programExercise: {
            targetSets: px.targetSets,
            targetRepsMin: px.targetRepsMin,
            targetRepsMax: px.targetRepsMax,
            startWeightKg: px.startWeightKg,
          },
          rack: userRow.rack,
        });

        return {
          programExerciseId: px.id,
          exercise: {
            id: ex.id,
            slug: ex.slug,
            nameEn: ex.nameEn,
            nameHe: ex.nameHe,
            primaryMuscles: ex.primaryMuscles,
            isUnilateral: ex.isUnilateral,
          },
          targetSets: px.targetSets,
          targetRepsMin: px.targetRepsMin,
          targetRepsMax: px.targetRepsMax,
          restSeconds: px.restSeconds,
          lastSession,
          suggestion,
          bestEverOneRm: bestRow?.best ?? null,
        };
      }),
  );

  const allUserSessions = await db.select().from(sessions).where(eq(sessions.userId, userId));
  const totalSessions = allUserSessions.filter((s) => s.status === "completed").length;
  const phaseDayDefs = phaseDays.map((d) => ({ dayOfWeek: d.dayOfWeek, isRestDay: d.isRestDay, isCardioDay: d.isCardioDay }));
  const { currentStreakDays } = computeStreak(allUserSessions, phaseDayDefs, today);
  const { weekDaysDone, weekDaysPlanned } = weekProgress(allUserSessions, phaseDayDefs, today);

  return res.json({
    date: dateStr,
    dayOfWeek,
    isRestDay: today_pd?.isRestDay ?? false,
    isCardioDay: today_pd?.isCardioDay ?? false,
    programDay: today_pd ? { id: today_pd.id, nameEn: today_pd.nameEn, nameHe: today_pd.nameHe } : null,
    exercises: todayExercises,
    activeSession: activeSession ? { id: activeSession.id, startedAt: activeSession.startedAt } : null,
    streak: {
      weekDaysDone,
      weekDaysPlanned,
      totalSessions,
      currentStreakDays,
    },
  });
});

async function maybeAdvancePhase(programId: number, userId: number) {
  const program = (await db.select().from(programs).where(eq(programs.id, programId)).limit(1))[0];
  if (!program || program.phase >= 2) return;

  const userRow = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  if (!userRow?.programStartDate) return;

  const startMillis = new Date(userRow.programStartDate).getTime();
  const ageDays = (Date.now() - startMillis) / (24 * 3600 * 1000);
  if (ageDays < 14) return;

  const completedSessions = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), eq(sessions.status, "completed")));
  if (completedSessions.length < 6) return;

  await db.update(programs).set({ phase: 2 }).where(eq(programs.id, programId));
  console.log(`[phase] Advanced program ${programId} to phase 2`);
}
