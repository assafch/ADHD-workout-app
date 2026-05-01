import { Router } from "express";
import { z } from "zod";
import { and, desc, eq, lt } from "drizzle-orm";
import { db } from "../db/client.js";
import { sessions, setLogs } from "../db/schema.js";
import { requireAuth, type AuthedRequest } from "../auth/middleware.js";

export const sessionsRouter = Router();

const createSchema = z.object({
  programDayId: z.number().int().optional(),
  isBadDay: z.boolean().optional(),
  clientId: z.string().min(1).max(64),
});

sessionsRouter.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "bad_request" });
  const { programDayId, isBadDay, clientId } = parsed.data;
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
