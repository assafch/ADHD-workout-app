import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");
    client = new Anthropic({ apiKey });
  }
  return client;
}

export interface ExerciseRef {
  slug: string;
  nameEn: string;
  nameHe: string;
  primaryMuscles: string[];
  equipment: string;
}

export interface AdvisorContext {
  locale: "he" | "en";
  programDayNameEn: string | null;
  programDayNameHe: string | null;
  todayExercises: { slug: string; nameEn: string; targetSets: number; targetRepsMin: number; targetRepsMax: number }[];
  recentSessions: { date: string; programDay: string | null; rpe: number | null; notes: string | null }[];
  rackKg: number[];
  allExercises: ExerciseRef[];
}

export type AdvisorAction =
  | { type: "swap_exercise"; fromSlug: string; toSlug: string; note?: string }
  | { type: "drop_sets"; slug: string; sets: number; note?: string }
  | { type: "reduce_weight"; slug: string; factor: number; note?: string }
  | { type: "add_exercise"; slug: string; targetSets?: number; targetRepsMin?: number; targetRepsMax?: number; note?: string }
  | { type: "skip_today"; note?: string }
  | { type: "no_action"; note?: string };

export interface AdvisorResult {
  rationale: string;
  actions: AdvisorAction[];
}

const PROPOSE_TOOL: Anthropic.Tool = {
  name: "propose_adjustments",
  description: "Propose concrete adjustments to today's workout based on the user's free-text request. Only reference exercises by slug from the provided allowed list.",
  input_schema: {
    type: "object",
    properties: {
      rationale: {
        type: "string",
        description: "One short sentence in the user's locale explaining the recommendation.",
      },
      actions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["swap_exercise", "drop_sets", "reduce_weight", "add_exercise", "skip_today", "no_action"],
            },
            fromSlug: { type: "string", description: "For swap_exercise: existing exercise slug to remove." },
            toSlug: { type: "string", description: "For swap_exercise: replacement exercise slug from the allowed list." },
            slug: { type: "string", description: "Exercise slug for drop_sets / reduce_weight / add_exercise." },
            sets: { type: "integer", minimum: 1, maximum: 10, description: "Number of sets to drop or new total." },
            factor: { type: "number", minimum: 0.3, maximum: 1, description: "Multiplier for working weight (e.g., 0.7 = 70%)." },
            targetSets: { type: "integer", minimum: 1, maximum: 10 },
            targetRepsMin: { type: "integer", minimum: 1, maximum: 50 },
            targetRepsMax: { type: "integer", minimum: 1, maximum: 50 },
            note: { type: "string", description: "Short note in the user's locale." },
          },
          required: ["type"],
        },
      },
    },
    required: ["rationale", "actions"],
  },
};

function buildStaticSystem(allExercises: ExerciseRef[]): string {
  const lines = [
    "You are a fitness advisor for an ADHD-friendly home dumbbell strength app.",
    "The user trains alone with adjustable dumbbells. Be empathetic, concise, and practical.",
    "ALWAYS call the propose_adjustments tool. NEVER reply with prose.",
    "ALL exercise references (fromSlug, toSlug, slug) MUST be a slug from the allowed list below — do not invent slugs.",
    "If the user does not need changes, return a single no_action with a short reassuring note.",
    "Prefer the smallest change that solves the problem (e.g. reduce_weight before swap_exercise).",
    "",
    "Allowed exercises (slug — muscles — equipment):",
    ...allExercises.map((e) => `- ${e.slug} — ${e.primaryMuscles.join(",")} — ${e.equipment} — ${e.nameEn}`),
  ];
  return lines.join("\n");
}

export async function runAdvisor(
  freeText: string,
  ctx: AdvisorContext,
): Promise<AdvisorResult> {
  const c = getClient();
  const staticSystem = buildStaticSystem(ctx.allExercises);

  const dynamicContext = [
    `Locale: ${ctx.locale}`,
    `Program day: ${ctx.programDayNameEn ?? "(none / rest)"}`,
    `Today's exercises:`,
    ...ctx.todayExercises.map((e) => `  - ${e.slug}: ${e.targetSets}x${e.targetRepsMin}-${e.targetRepsMax}`),
    `Available dumbbell weights (kg): ${ctx.rackKg.join(", ")}`,
    `Recent sessions:`,
    ...ctx.recentSessions.slice(0, 5).map((s) => `  - ${s.date} ${s.programDay ?? ""} rpe=${s.rpe ?? "-"} notes=${s.notes ?? ""}`),
  ].join("\n");

  const response = await c.messages.create({
    model: MODEL,
    max_tokens: 2048,
    tools: [PROPOSE_TOOL],
    tool_choice: { type: "tool", name: "propose_adjustments" },
    system: [
      { type: "text", text: staticSystem, cache_control: { type: "ephemeral" } },
    ],
    messages: [
      {
        role: "user",
        content: `${dynamicContext}\n\nUser request (locale=${ctx.locale}):\n${freeText}`,
      },
    ],
  });

  const toolBlock = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
  if (!toolBlock) throw new Error("advisor_no_tool_use");

  const input = toolBlock.input as Partial<AdvisorResult>;
  const allowedSlugs = new Set(ctx.allExercises.map((e) => e.slug));
  const actions: AdvisorAction[] = [];
  for (const a of input.actions ?? []) {
    const cleaned = sanitizeAction(a, allowedSlugs);
    if (cleaned) actions.push(cleaned);
  }

  return {
    rationale: typeof input.rationale === "string" ? input.rationale : "",
    actions,
  };
}

function sanitizeAction(a: AdvisorAction, allowed: Set<string>): AdvisorAction | null {
  switch (a.type) {
    case "swap_exercise":
      if (!allowed.has(a.fromSlug) || !allowed.has(a.toSlug)) return null;
      return a;
    case "drop_sets":
    case "reduce_weight":
    case "add_exercise":
      if (!allowed.has(a.slug)) return null;
      return a;
    case "skip_today":
    case "no_action":
      return a;
    default:
      return null;
  }
}
