import { Router } from "express";
import { z } from "zod";
import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "../db/client.js";
import { bodyMetrics } from "../db/schema.js";
import { requireAuth, type AuthedRequest } from "../auth/middleware.js";

export const bodyRouter = Router();

const upsertSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weightKg: z.number().positive().max(500),
  notes: z.string().max(500).nullable().optional(),
});

bodyRouter.post("/weight", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "bad_request" });

  const { date, weightKg, notes } = parsed.data;

  const existing = await db
    .select()
    .from(bodyMetrics)
    .where(and(eq(bodyMetrics.userId, userId), eq(bodyMetrics.date, date)))
    .limit(1);

  if (existing.length > 0) {
    const [updated] = await db
      .update(bodyMetrics)
      .set({ weightKg, notes: notes ?? null })
      .where(eq(bodyMetrics.id, existing[0].id))
      .returning();
    return res.json({ metric: updated });
  }

  const [created] = await db.insert(bodyMetrics).values({
    userId,
    date,
    weightKg,
    notes: notes ?? null,
  }).returning();
  return res.json({ metric: created });
});

bodyRouter.get("/weight", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const days = Math.max(1, Math.min(3650, Number(req.query.days) || 90));
  const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const rows = await db
    .select()
    .from(bodyMetrics)
    .where(and(eq(bodyMetrics.userId, userId), gte(bodyMetrics.date, since)))
    .orderBy(bodyMetrics.date);
  return res.json({ metrics: rows });
});
