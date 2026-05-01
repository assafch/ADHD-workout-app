import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { requireAuth, signToken, type AuthedRequest } from "./middleware.js";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
  locale: z.enum(["he", "en"]).optional(),
});

function publicUser(u: typeof users.$inferSelect) {
  const { passwordHash: _ph, ...rest } = u;
  return rest;
}

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "bad_request" });

  const { email, password } = parsed.data;
  const found = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  const user = found[0];
  if (!user) return res.status(401).json({ error: "invalid_credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "invalid_credentials" });

  const token = signToken(user.id);
  return res.json({ token, user: publicUser(user) });
});

authRouter.post("/register", async (req, res) => {
  if (process.env.ENABLE_REGISTRATION !== "true") {
    return res.status(403).json({ error: "registration_disabled" });
  }
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "bad_request" });
  const { email, password, name, locale } = parsed.data;
  const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  if (existing.length > 0) return res.status(409).json({ error: "email_taken" });

  const passwordHash = await bcrypt.hash(password, 12);
  const [created] = await db.insert(users).values({
    email: email.toLowerCase(),
    passwordHash,
    name: name ?? null,
    locale: locale ?? "he",
  }).returning();

  const token = signToken(created.id);
  return res.json({ token, user: publicUser(created) });
});

authRouter.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const found = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (found.length === 0) return res.status(404).json({ error: "not_found" });
  return res.json({ user: publicUser(found[0]) });
});

authRouter.patch("/me", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const schema = z.object({
    name: z.string().min(1).max(100).optional(),
    locale: z.enum(["he", "en"]).optional(),
    units: z.enum(["kg", "lb"]).optional(),
    heightCm: z.number().positive().nullable().optional(),
    dob: z.string().nullable().optional(),
    rack: z.array(z.number().positive()).min(1).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "bad_request" });

  const updates: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined) updates[k] = v;
  }
  if (Object.keys(updates).length === 0) {
    const found = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return res.json({ user: publicUser(found[0]) });
  }

  const [updated] = await db.update(users).set(updates).where(eq(users.id, userId)).returning();
  return res.json({ user: publicUser(updated) });
});
