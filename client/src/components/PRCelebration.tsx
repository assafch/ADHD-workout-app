import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { celebrationSound, vibrate } from "../hooks/useVibrate";
import { CoachTip } from "./CoachTip";

interface Props {
  exerciseNameEn: string;
  exerciseNameHe: string;
  weightKg: number;
  reps: number;
  /** Delta vs previous PR (kg). */
  deltaKg: number;
  /** Suggested next-session target. */
  nextSuggestionKg?: number;
  nextSuggestionReps?: number;
  onDismiss: () => void;
}

/**
 * PR celebration — full takeover. Designed companion to PRGhostDuel.
 * Spec:
 *   - Gradient bg #1c1b1a → #2a1f1a
 *   - Caveat 58px coral handwritten title with -3° rotation (mirrored in RTL)
 *   - 130px JetBrains Mono hero number with kg unit at 38px
 *   - Pill: "△ +0.5kg vs past PR"
 *   - Coach tip with next-session suggestion
 *   - Continue CTA at the bottom
 */
export function PRCelebration({
  exerciseNameEn,
  exerciseNameHe,
  weightKg,
  reps,
  deltaKg,
  nextSuggestionKg,
  nextSuggestionReps,
  onDismiss,
}: Props) {
  const { t, i18n } = useTranslation();
  const isHe = i18n.language.startsWith("he");
  const exerciseName = isHe ? exerciseNameHe : exerciseNameEn;

  useEffect(() => {
    vibrate([100, 50, 100, 50, 200]);
    celebrationSound();
  }, []);

  const nextTip =
    nextSuggestionKg != null && nextSuggestionReps != null
      ? t("coach.tip_pr_next_session", { weight: nextSuggestionKg, reps: nextSuggestionReps })
      : t("coach.tip_pr_next_session", { weight: weightKg, reps: Math.max(1, reps - 2) });

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background:
          "linear-gradient(180deg, #1c1b1a 0%, #2a1f1a 100%)",
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="flex flex-1 flex-col items-center px-6 pt-16 text-center">
        <div className="pr-handwritten text-[58px] leading-none text-accent">
          {t("pr.title")}
        </div>

        <div className="mt-2 eyebrow text-text-2">
          {exerciseName}
        </div>

        <div className="mt-7 flex items-baseline justify-center gap-1">
          <span
            className="font-num font-black text-text"
            style={{
              fontSize: "130px",
              lineHeight: 1,
              letterSpacing: "-5px",
            }}
          >
            <span className="ltr-numbers">{weightKg}</span>
          </span>
          <span className="font-num text-[38px] font-black text-accent">
            {t("workout.kg_unit")}
          </span>
        </div>

        <div className="mt-1.5 font-num text-[18px] text-text-mute">
          × <span className="ltr-numbers">{reps}</span> {t("workout.reps")}
        </div>

        <div className="mt-7 inline-flex items-center gap-1.5 rounded-full bg-accent/25 px-4 py-2 text-[13px] font-bold text-accent">
          <span>△</span>
          <span>
            {t("pr.delta_vs_past", {
              delta: deltaKg.toFixed(deltaKg < 1 ? 1 : 0),
              unit: t("workout.kg_unit"),
            })}
          </span>
        </div>

        <div className="mt-7 w-full max-w-md">
          <CoachTip text={nextTip} />
        </div>
      </div>

      <div className="px-4 pb-5">
        <button
          type="button"
          onClick={onDismiss}
          className="min-h-[76px] w-full rounded-[20px] bg-accent text-cta font-extrabold text-ink active:bg-accent-2"
        >
          {t("pr.continue")} →
        </button>
      </div>
    </div>
  );
}
