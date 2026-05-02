import { Router } from "express";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { exercises, programDays, programExercises, programs, sessions, users } from "../db/schema.js";
import { requireAuth, type AuthedRequest } from "../auth/middleware.js";
import { runAdvisor, type AdvisorContext } from "../lib/advisor.js";
import { jerusalemDayOfWeek } from "../lib/streak.js";

export const advisorRouter = Router();

const requestSchema = z.object({
  text: z.string().min(2).max(2000),
});

advisorRouter.post("/", requireAuth, async (req: AuthedRequest, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: "advisor_not_configured" });
  }
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "bad_request" });

  const userId = req.userId!;
  const userRow = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  if (!userRow) return res.status(404).json({ error: "user_not_found" });

  const program = (await db
    .select()
    .from(programs)
    .where(and(eq(programs.userId, userId), eq(programs.isActive, true)))
    .limit(1))[0];

  const today = new Date();
  const dow = jerusalemDayOfWeek(today);
  const allDays = program ? await db.select().from(programDays).where(eq(programDays.programId, program.id)) : [];
  const todayDay = allDays.find((d) => d.phase === program?.phase && d.dayOfWeek === dow) ?? null;

  const allExRows = await db.select().from(exercises);
  const exMap = new Map(allExRows.map((e) => [e.id, e]));

  const todayPxRows = todayDay
    ? await db.select().from(programExercises).where(eq(programExercises.programDayId, todayDay.id))
    : [];
  const todayExercises = todayPxRows.map((px) => {
    const ex = exMap.get(px.exerciseId);
    return {
      slug: ex?.slug ?? "",
      nameEn: ex?.nameEn ?? "",
      targetSets: px.targetSets,
      targetRepsMin: px.targetRepsMin,
      targetRepsMax: px.targetRepsMax,
    };
  }).filter((e) => e.slug);

  const recent = await db
    .select()
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.startedAt))
    .limit(5);
  const recentSessions = recent.map((s) => {
    const pd = allDays.find((d) => d.id === s.programDayId) ?? null;
    return {
      date: new Date(s.startedAt).toISOString().slice(0, 10),
      programDay: pd?.nameEn ?? null,
      rpe: s.rpe,
      notes: s.notes,
    };
  });

  const ctx: AdvisorContext = {
    locale: (userRow.locale?.startsWith("he") ? "he" : "en") as "he" | "en",
    programDayNameEn: todayDay?.nameEn ?? null,
    programDayNameHe: todayDay?.nameHe ?? null,
    todayExercises,
    recentSessions,
    rackKg: userRow.rack,
    allExercises: allExRows.map((e) => ({
      slug: e.slug,
      nameEn: e.nameEn,
      nameHe: e.nameHe,
      primaryMuscles: e.primaryMuscles,
      equipment: e.equipment,
    })),
  };

  try {
    const result = await runAdvisor(parsed.data.text, ctx);
    return res.json(result);
  } catch (e) {
    const msg = (e as Error).message;
    console.error("[advisor]", msg);
    return res.status(502).json({ error: "advisor_failed", message: msg });
  }
});
