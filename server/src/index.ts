import "dotenv/config";
import express from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { authRouter } from "./auth/routes.js";
import { todayRouter } from "./routes/today.js";
import { sessionsRouter } from "./routes/sessions.js";
import { setsRouter } from "./routes/sets.js";
import { exercisesRouter } from "./routes/exercises.js";
import { bodyRouter } from "./routes/body.js";
import { programsRouter } from "./routes/programs.js";
import { statsRouter } from "./routes/stats.js";
import { bootstrapSchema } from "./db/bootstrap.js";
import { runSeed } from "./db/seed.js";
import { pool } from "./db/client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, time: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ ok: false, error: (e as Error).message });
  }
});

app.use("/api/auth", authRouter);
app.use("/api/today", todayRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api", setsRouter);
app.use("/api/exercises", exercisesRouter);
app.use("/api/body", bodyRouter);
app.use("/api/programs", programsRouter);
app.use("/api/stats", statsRouter);

app.use("/api", (_req, res) => res.status(404).json({ error: "not_found" }));

const clientDist = path.resolve(__dirname, "..", "..", "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist, { index: false, maxAge: "1h" }));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
} else {
  app.get("/", (_req, res) => {
    res.type("text/plain").send("ADHD Strength API. Build the client and try again.");
  });
}

const PORT = Number(process.env.PORT) || 8080;

async function start() {
  await bootstrapSchema();
  await runSeed();
  app.listen(PORT, () => {
    console.log(`[server] Listening on :${PORT}`);
  });
}

start().catch((err) => {
  console.error("[server] Fatal startup error:", err);
  process.exit(1);
});
