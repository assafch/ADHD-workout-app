import "dotenv/config";
import bcrypt from "bcrypt";
import { eq, sql } from "drizzle-orm";
import { db, pool } from "./client.js";
import { users, exercises, programs, programDays, programExercises } from "./schema.js";

type ExerciseSeed = {
  slug: string;
  nameEn: string;
  nameHe: string;
  primaryMuscles: string[];
  equipment: string;
  isUnilateral?: boolean;
};

const EXERCISES: ExerciseSeed[] = [
  { slug: "flat-db-bench-press", nameEn: "Flat DB Bench Press", nameHe: "לחיצת חזה ישרה עם משקולות", primaryMuscles: ["chest", "front_delts", "triceps"], equipment: "dumbbell" },
  { slug: "one-arm-db-row", nameEn: "One-Arm DB Row", nameHe: "חתירה עם משקולת ביד אחת", primaryMuscles: ["lats", "rhomboids", "rear_delts"], equipment: "dumbbell", isUnilateral: true },
  { slug: "seated-db-shoulder-press", nameEn: "Seated DB Shoulder Press", nameHe: "לחיצת כתפיים בישיבה", primaryMuscles: ["front_delts", "side_delts", "triceps"], equipment: "dumbbell" },
  { slug: "chest-supported-db-row", nameEn: "Chest-Supported DB Row", nameHe: "חתירה במנח שכיבה על ספסל", primaryMuscles: ["mid_traps", "rear_delts", "rhomboids"], equipment: "dumbbell" },
  { slug: "db-skullcrusher", nameEn: "DB Skullcrusher", nameHe: "מתיחת טריצפס שכיבה", primaryMuscles: ["triceps"], equipment: "dumbbell" },
  { slug: "db-hammer-curl", nameEn: "DB Hammer Curl", nameHe: "כפיפת מרפק פטיש", primaryMuscles: ["biceps", "brachialis", "forearms"], equipment: "dumbbell" },
  { slug: "db-goblet-squat", nameEn: "DB Goblet Squat", nameHe: "סקוואט גביע", primaryMuscles: ["quads", "glutes", "core"], equipment: "dumbbell" },
  { slug: "db-romanian-deadlift", nameEn: "DB Romanian Deadlift", nameHe: "RDL רומני עם משקולות", primaryMuscles: ["hamstrings", "glutes", "lower_back"], equipment: "dumbbell" },
  { slug: "db-bulgarian-split-squat", nameEn: "DB Bulgarian Split Squat", nameHe: "סקוואט בולגרי", primaryMuscles: ["quads", "glutes"], equipment: "dumbbell", isUnilateral: true },
  { slug: "db-step-up", nameEn: "DB Step-Up", nameHe: "מדרגות עם משקולות", primaryMuscles: ["quads", "glutes"], equipment: "dumbbell", isUnilateral: true },
  { slug: "db-standing-calf-raise", nameEn: "DB Standing Calf Raise", nameHe: "מתיחת שוקיים בעמידה", primaryMuscles: ["calves"], equipment: "dumbbell" },
  { slug: "db-seated-calf-raise", nameEn: "DB Seated Calf Raise", nameHe: "מתיחת שוקיים בישיבה", primaryMuscles: ["calves", "soleus"], equipment: "dumbbell" },
  { slug: "hanging-leg-raise", nameEn: "Hanging Leg Raise", nameHe: "הרמת רגליים בתליה", primaryMuscles: ["abs", "hip_flexors"], equipment: "bodyweight" },
  { slug: "db-crunch", nameEn: "DB Crunch", nameHe: "כפיפות בטן עם משקולת", primaryMuscles: ["abs"], equipment: "dumbbell" },
  { slug: "incline-db-bench-press", nameEn: "Incline DB Bench Press", nameHe: "לחיצת חזה משופעת", primaryMuscles: ["upper_chest", "front_delts", "triceps"], equipment: "dumbbell" },
  { slug: "db-pullover", nameEn: "DB Pullover", nameHe: "פולאובר משקולת", primaryMuscles: ["lats", "chest"], equipment: "dumbbell" },
  { slug: "db-lateral-raise", nameEn: "DB Lateral Raise", nameHe: "הרמות צד", primaryMuscles: ["side_delts"], equipment: "dumbbell" },
  { slug: "db-rear-delt-fly", nameEn: "DB Rear-Delt Fly", nameHe: "הרמות גב כתף", primaryMuscles: ["rear_delts", "mid_traps"], equipment: "dumbbell" },
  { slug: "db-incline-curl", nameEn: "DB Incline Curl", nameHe: "כפיפת מרפק שכיבה משופעת", primaryMuscles: ["biceps_long_head"], equipment: "dumbbell" },
  { slug: "db-overhead-tri-ext", nameEn: "DB Overhead Triceps Extension", nameHe: "מתיחת טריצפס מאחורי הראש", primaryMuscles: ["triceps"], equipment: "dumbbell" },
  { slug: "db-reverse-lunge", nameEn: "DB Reverse Lunge", nameHe: "שמיכה אחורית עם משקולות", primaryMuscles: ["quads", "glutes"], equipment: "dumbbell", isUnilateral: true },
  { slug: "db-single-leg-rdl", nameEn: "DB Single-Leg RDL", nameHe: "RDL רומני על רגל אחת", primaryMuscles: ["hamstrings", "glutes"], equipment: "dumbbell", isUnilateral: true },
  { slug: "db-hip-thrust", nameEn: "DB Hip Thrust", nameHe: "משיכת אגן", primaryMuscles: ["glutes", "hamstrings"], equipment: "dumbbell" },
  { slug: "plank", nameEn: "Plank", nameHe: "פלאנק", primaryMuscles: ["core"], equipment: "bodyweight" },
];

type DaySeed = {
  dayOfWeek: number;
  nameEn: string;
  nameHe: string;
  isRestDay?: boolean;
  isCardioDay?: boolean;
  exercises?: { slug: string; sets: number; repsMin: number; repsMax: number; restSec: number; startWeightKg: number }[];
};

const PHASE_1: DaySeed[] = [
  {
    dayOfWeek: 0, nameEn: "Upper A", nameHe: "פלג גוף עליון א",
    exercises: [
      { slug: "flat-db-bench-press", sets: 3, repsMin: 8, repsMax: 10, restSec: 90, startWeightKg: 12 },
      { slug: "one-arm-db-row", sets: 3, repsMin: 10, repsMax: 10, restSec: 60, startWeightKg: 14 },
      { slug: "seated-db-shoulder-press", sets: 3, repsMin: 10, repsMax: 12, restSec: 60, startWeightKg: 10 },
    ],
  },
  {
    dayOfWeek: 1, nameEn: "Lower A", nameHe: "פלג גוף תחתון א",
    exercises: [
      { slug: "db-goblet-squat", sets: 3, repsMin: 10, repsMax: 10, restSec: 90, startWeightKg: 16 },
      { slug: "db-romanian-deadlift", sets: 3, repsMin: 10, repsMax: 10, restSec: 90, startWeightKg: 16 },
      { slug: "db-reverse-lunge", sets: 3, repsMin: 8, repsMax: 8, restSec: 60, startWeightKg: 10 },
    ],
  },
  { dayOfWeek: 2, nameEn: "Rest", nameHe: "מנוחה", isRestDay: true },
  {
    dayOfWeek: 3, nameEn: "Upper B", nameHe: "פלג גוף עליון ב",
    exercises: [
      { slug: "incline-db-bench-press", sets: 3, repsMin: 8, repsMax: 10, restSec: 90, startWeightKg: 10 },
      { slug: "db-pullover", sets: 3, repsMin: 10, repsMax: 12, restSec: 60, startWeightKg: 12 },
      { slug: "db-lateral-raise", sets: 3, repsMin: 12, repsMax: 15, restSec: 45, startWeightKg: 5 },
    ],
  },
  {
    dayOfWeek: 4, nameEn: "Lower B", nameHe: "פלג גוף תחתון ב",
    exercises: [
      { slug: "db-romanian-deadlift", sets: 3, repsMin: 10, repsMax: 10, restSec: 90, startWeightKg: 16 },
      { slug: "db-goblet-squat", sets: 3, repsMin: 10, repsMax: 10, restSec: 90, startWeightKg: 16 },
      { slug: "db-hip-thrust", sets: 3, repsMin: 10, repsMax: 12, restSec: 60, startWeightKg: 18 },
    ],
  },
  { dayOfWeek: 5, nameEn: "Walk", nameHe: "הליכה", isCardioDay: true },
  { dayOfWeek: 6, nameEn: "Shabbat", nameHe: "שבת", isRestDay: true },
];

const PHASE_2: DaySeed[] = [
  {
    dayOfWeek: 0, nameEn: "Upper A", nameHe: "פלג גוף עליון א",
    exercises: [
      { slug: "flat-db-bench-press", sets: 4, repsMin: 6, repsMax: 8, restSec: 120, startWeightKg: 14 },
      { slug: "one-arm-db-row", sets: 4, repsMin: 8, repsMax: 10, restSec: 90, startWeightKg: 16 },
      { slug: "seated-db-shoulder-press", sets: 3, repsMin: 8, repsMax: 10, restSec: 90, startWeightKg: 12 },
      { slug: "chest-supported-db-row", sets: 3, repsMin: 10, repsMax: 12, restSec: 90, startWeightKg: 10 },
      { slug: "db-skullcrusher", sets: 3, repsMin: 10, repsMax: 12, restSec: 60, startWeightKg: 7 },
      { slug: "db-hammer-curl", sets: 3, repsMin: 10, repsMax: 12, restSec: 60, startWeightKg: 10 },
    ],
  },
  {
    dayOfWeek: 1, nameEn: "Lower A", nameHe: "פלג גוף תחתון א",
    exercises: [
      { slug: "db-goblet-squat", sets: 4, repsMin: 8, repsMax: 10, restSec: 120, startWeightKg: 18 },
      { slug: "db-romanian-deadlift", sets: 4, repsMin: 8, repsMax: 10, restSec: 120, startWeightKg: 18 },
      { slug: "db-bulgarian-split-squat", sets: 3, repsMin: 10, repsMax: 10, restSec: 90, startWeightKg: 10 },
      { slug: "db-step-up", sets: 3, repsMin: 10, repsMax: 10, restSec: 60, startWeightKg: 10 },
      { slug: "db-standing-calf-raise", sets: 4, repsMin: 15, repsMax: 20, restSec: 45, startWeightKg: 16 },
      { slug: "hanging-leg-raise", sets: 3, repsMin: 12, repsMax: 15, restSec: 45, startWeightKg: 0 },
    ],
  },
  { dayOfWeek: 2, nameEn: "Rest", nameHe: "מנוחה", isRestDay: true },
  {
    dayOfWeek: 3, nameEn: "Upper B", nameHe: "פלג גוף עליון ב",
    exercises: [
      { slug: "incline-db-bench-press", sets: 4, repsMin: 8, repsMax: 10, restSec: 120, startWeightKg: 12 },
      { slug: "db-pullover", sets: 3, repsMin: 10, repsMax: 12, restSec: 90, startWeightKg: 14 },
      { slug: "db-lateral-raise", sets: 4, repsMin: 12, repsMax: 15, restSec: 60, startWeightKg: 7 },
      { slug: "db-rear-delt-fly", sets: 3, repsMin: 12, repsMax: 15, restSec: 60, startWeightKg: 5 },
      { slug: "db-incline-curl", sets: 3, repsMin: 10, repsMax: 12, restSec: 60, startWeightKg: 10 },
      { slug: "db-overhead-tri-ext", sets: 3, repsMin: 10, repsMax: 12, restSec: 60, startWeightKg: 12 },
    ],
  },
  {
    dayOfWeek: 4, nameEn: "Lower B", nameHe: "פלג גוף תחתון ב",
    exercises: [
      { slug: "db-romanian-deadlift", sets: 4, repsMin: 6, repsMax: 8, restSec: 120, startWeightKg: 22 },
      { slug: "db-reverse-lunge", sets: 4, repsMin: 10, repsMax: 10, restSec: 90, startWeightKg: 12 },
      { slug: "db-single-leg-rdl", sets: 3, repsMin: 8, repsMax: 8, restSec: 90, startWeightKg: 10 },
      { slug: "db-hip-thrust", sets: 3, repsMin: 10, repsMax: 12, restSec: 90, startWeightKg: 22 },
      { slug: "db-seated-calf-raise", sets: 4, repsMin: 15, repsMax: 20, restSec: 45, startWeightKg: 14 },
      { slug: "plank", sets: 3, repsMin: 1, repsMax: 1, restSec: 45, startWeightKg: 0 },
    ],
  },
  { dayOfWeek: 5, nameEn: "Walk", nameHe: "הליכה", isCardioDay: true },
  { dayOfWeek: 6, nameEn: "Shabbat", nameHe: "שבת", isRestDay: true },
];

async function upsertExercises() {
  for (const ex of EXERCISES) {
    await db.insert(exercises).values({
      slug: ex.slug,
      nameEn: ex.nameEn,
      nameHe: ex.nameHe,
      primaryMuscles: ex.primaryMuscles,
      equipment: ex.equipment,
      isUnilateral: ex.isUnilateral ?? false,
    }).onConflictDoNothing({ target: exercises.slug });
  }
}

async function ensureSeedUser(): Promise<number | null> {
  const email = process.env.SEED_EMAIL;
  const password = process.env.SEED_PASSWORD;
  const name = process.env.SEED_NAME ?? "Athlete";

  if (!email || !password) {
    console.warn("[seed] SEED_EMAIL or SEED_PASSWORD not set — skipping user creation");
    return null;
  }

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    return existing[0].id;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [created] = await db.insert(users).values({
    email,
    passwordHash,
    name,
    locale: "he",
    units: "kg",
    rack: [2, 5, 7, 10, 12, 14, 16, 18, 20, 22, 25, 28, 30, 32, 34, 36],
    programStartDate: new Date().toISOString().slice(0, 10),
  }).returning();
  console.log(`[seed] Created user ${email}`);
  return created.id;
}

async function ensureWolverineProgram(userId: number) {
  const existing = await db.select().from(programs).where(eq(programs.userId, userId)).limit(1);
  let programId: number;
  if (existing.length > 0) {
    programId = existing[0].id;
  } else {
    const [created] = await db.insert(programs).values({
      userId,
      nameEn: "Wolverine",
      nameHe: "וולברין",
      description: "Dumbbell-only ADHD-friendly strength program with two phases.",
      isActive: true,
      phase: 1,
    }).returning();
    programId = created.id;
    console.log(`[seed] Created Wolverine program ${programId}`);
  }

  await db.update(users).set({ currentProgramId: programId }).where(eq(users.id, userId));

  const exerciseRows = await db.select().from(exercises);
  const slugToId = new Map(exerciseRows.map((e) => [e.slug, e.id]));

  for (const phase of [1, 2] as const) {
    const days = phase === 1 ? PHASE_1 : PHASE_2;
    for (const day of days) {
      const existingDay = await db
        .select()
        .from(programDays)
        .where(sql`${programDays.programId} = ${programId} AND ${programDays.phase} = ${phase} AND ${programDays.dayOfWeek} = ${day.dayOfWeek}`)
        .limit(1);

      let dayId: number;
      if (existingDay.length > 0) {
        dayId = existingDay[0].id;
      } else {
        const [createdDay] = await db.insert(programDays).values({
          programId,
          phase,
          dayOfWeek: day.dayOfWeek,
          nameEn: day.nameEn,
          nameHe: day.nameHe,
          isRestDay: day.isRestDay ?? false,
          isCardioDay: day.isCardioDay ?? false,
        }).returning();
        dayId = createdDay.id;
      }

      if (!day.exercises) continue;

      const existingPx = await db.select().from(programExercises).where(eq(programExercises.programDayId, dayId));
      if (existingPx.length > 0) continue;

      for (let i = 0; i < day.exercises.length; i++) {
        const px = day.exercises[i];
        const exerciseId = slugToId.get(px.slug);
        if (!exerciseId) {
          console.warn(`[seed] Missing exercise ${px.slug}`);
          continue;
        }
        await db.insert(programExercises).values({
          programDayId: dayId,
          exerciseId,
          orderIndex: i,
          targetSets: px.sets,
          targetRepsMin: px.repsMin,
          targetRepsMax: px.repsMax,
          restSeconds: px.restSec,
          startWeightKg: px.startWeightKg,
        });
      }
    }
  }
}

export async function runSeed() {
  await upsertExercises();
  const userId = await ensureSeedUser();
  if (userId) {
    await ensureWolverineProgram(userId);
  }
  console.log("[seed] Done");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSeed()
    .then(() => pool.end())
    .catch((err) => {
      console.error("[seed] Failed:", err);
      process.exit(1);
    });
}
