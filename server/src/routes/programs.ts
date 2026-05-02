import { Router } from "express";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { exercises, programDays, programExercises, programs, users } from "../db/schema.js";
import { requireAuth, type AuthedRequest } from "../auth/middleware.js";
import { jerusalemDayOfWeek } from "../lib/streak.js";

export const programsRouter = Router();

programsRouter.get("/active", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const program = (await db
    .select()
    .from(programs)
    .where(and(eq(programs.userId, userId), eq(programs.isActive, true)))
    .limit(1))[0];
  if (!program) return res.json({ program: null });

  const days = await db.select().from(programDays).where(eq(programDays.programId, program.id));
  const dayIds = days.map((d) => d.id);
  const px = dayIds.length > 0
    ? await db.select().from(programExercises)
    : [];
  const filtered = px.filter((p) => dayIds.includes(p.programDayId));
  const allExercises = await db.select().from(exercises);

  return res.json({ program, days, programExercises: filtered, exercises: allExercises });
});

const patchSchema = z.object({
  nameEn: z.string().optional(),
  nameHe: z.string().optional(),
  phase: z.number().int().min(1).max(2).optional(),
});

programsRouter.patch("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "bad_id" });
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "bad_request" });

  const program = (await db
    .select()
    .from(programs)
    .where(and(eq(programs.id, id), eq(programs.userId, userId)))
    .limit(1))[0];
  if (!program) return res.status(404).json({ error: "not_found" });

  const updates: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined) updates[k] = v;
  }
  if (Object.keys(updates).length === 0) return res.json({ program });

  const [updated] = await db.update(programs).set(updates).where(eq(programs.id, id)).returning();
  return res.json({ program: updated });
});

const rotateSchema = z.object({
  programDayId: z.number().int().positive(),
});

programsRouter.post("/rotate", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const parsed = rotateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "bad_request" });

  const program = (await db
    .select()
    .from(programs)
    .where(and(eq(programs.userId, userId), eq(programs.isActive, true)))
    .limit(1))[0];
  if (!program) return res.status(404).json({ error: "no_active_program" });

  const allDays = await db.select().from(programDays).where(eq(programDays.programId, program.id));
  const phaseDays = allDays.filter((d) => d.phase === program.phase);
  const target = phaseDays.find((d) => d.id === parsed.data.programDayId);
  if (!target) return res.status(404).json({ error: "day_not_found" });

  const todayDow = jerusalemDayOfWeek(new Date());
  const shift = ((todayDow - target.dayOfWeek) % 7 + 7) % 7;
  if (shift === 0) return res.json({ rotated: false, days: phaseDays });

  await db.transaction(async (tx) => {
    for (const d of phaseDays) {
      const newDow = ((d.dayOfWeek + shift) % 7 + 7) % 7;
      await tx.update(programDays).set({ dayOfWeek: newDow }).where(eq(programDays.id, d.id));
    }
  });

  const updated = await db.select().from(programDays).where(eq(programDays.programId, program.id));
  return res.json({ rotated: true, shift, days: updated.filter((d) => d.phase === program.phase) });
});
