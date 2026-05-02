import { useTranslation } from "react-i18next";
import type { PRChase } from "../lib/prChase";

interface Props {
  chase: PRChase;
  weightKg: number;
  /** Days since the past PR was set, optional — shown in the ghost row when present. */
  daysSincePR?: number | null;
  /** Past PR weight × reps shown in the ghost row. */
  pastPrWeightKg: number;
  pastPrReps: number;
  /** Current planned reps for the live row. */
  plannedReps: number;
  /** 1RM target that's being chased — shown in the eyebrow. */
  bestOneRm: number;
}

/**
 * PR Variation B — "Ghost duel": past PR runs as a faded set above today's row.
 * Visually beating your past self is the dopamine prompt.
 *
 * Note: the layout is RTL-aware. Numerals stay LTR via .ltr-numbers.
 */
export function PRGhostDuel({
  chase,
  weightKg,
  daysSincePR,
  pastPrWeightKg,
  pastPrReps,
  plannedReps,
  bestOneRm,
}: Props) {
  const { t } = useTranslation();
  const totalRepBlocks = Math.max(plannedReps, pastPrReps + 1);
  const filledBlocks = pastPrReps;

  return (
    <div className="rounded-hero border border-line bg-surface p-4">
      <div className="eyebrow text-accent">
        {t("pr.chase")} · {t("pr.one_rm")}{" "}
        <span className="ltr-numbers font-num">{bestOneRm}</span>
        <span className="ml-0.5">{t("pr.kg" as never, { defaultValue: "kg" })}</span>
      </div>

      {/* Ghost row — past PR */}
      <div className="mt-3 rounded-2xl border border-dashed border-line bg-white/[0.02] px-3 py-2.5">
        <div className="flex items-center justify-between" dir="ltr">
          <div className="font-num text-[10px] text-text-mute">
            {t("pr.past_pr").toUpperCase()} ·{" "}
            {daysSincePR != null ? t("pr.days_ago", { days: daysSincePR }) : ""}
          </div>
          <div className="font-num text-[18px] font-bold text-text-mute">
            <span className="ltr-numbers">{pastPrWeightKg}</span> ×{" "}
            <span className="ltr-numbers">{pastPrReps}</span>
          </div>
        </div>
      </div>

      {/* Today row */}
      <div className="mt-2 rounded-2xl border-[1.5px] border-accent bg-accent/[0.12] px-3 py-3">
        <div className="flex items-center justify-between" dir="ltr">
          <div className="font-num text-[10px] font-bold text-accent">
            {t("pr.today").toUpperCase()}
          </div>
          <div className="font-num text-[28px] font-extrabold leading-none text-text">
            <span className="ltr-numbers">{weightKg}</span> ×{" "}
            <span className="ltr-numbers text-accent">{plannedReps}?</span>
          </div>
        </div>
      </div>

      <div className="mt-3 text-center text-[12px] text-text-2">
        {t("pr.one_more_rep_breaks")} <span className="text-accent">△</span>
      </div>

      {/* Visual rep tally — fill = past, dashed = the one you need to beat */}
      <div className="mt-3 flex justify-center gap-1.5" dir="ltr">
        {Array.from({ length: totalRepBlocks }).map((_, i) => {
          const filled = i < filledBlocks;
          const isDuelTarget = i === filledBlocks;
          return (
            <div
              key={i}
              className={
                "h-8 w-[22px] rounded-md " +
                (filled
                  ? "bg-accent"
                  : isDuelTarget
                    ? "border-2 border-dashed border-accent bg-transparent"
                    : "bg-surface-2")
              }
            />
          );
        })}
      </div>
      <div className="mt-1.5 text-center font-num text-[10px] text-text-dim">
        <span className="ltr-numbers">{filledBlocks}</span> /{" "}
        <span className="ltr-numbers text-accent">{filledBlocks + 1}</span>{" "}
        {t("workout.reps")}
      </div>

      {/* Hint reps-needed if the user dialed weight up beyond a 1-rep break */}
      {chase.repsNeeded > plannedReps && (
        <div className="mt-2 text-center font-num text-[11px] text-text-dim">
          <span className="ltr-numbers">{chase.repsNeeded}</span>+ {t("workout.reps")}
        </div>
      )}
    </div>
  );
}
