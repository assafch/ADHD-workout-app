import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { useTodayWorkout } from "../hooks/useTodayWorkout";
import { useWakeLock } from "../hooks/useWakeLock";
import { beep, vibrate } from "../hooks/useVibrate";
import { PRCelebration } from "../components/PRCelebration";
import { PRGhostDuel } from "../components/PRGhostDuel";
import { CoachTip } from "../components/CoachTip";
import { dexie } from "../db/dexie";
import * as endpoints from "../api/endpoints";
import { epley1RM } from "../lib/oneRM";
import { nextInRack, prevInRack } from "../lib/rack";
import { computePRChase } from "../lib/prChase";

interface LoggedSet {
  exerciseId: number;
  setNumber: number;
  weightKg: number;
  reps: number;
  oneRmKg: number;
  isPR: boolean;
}

type Phase = "lift" | "rest" | "between";

export function Workout() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const sessionClientId = params.get("cid");
  const isBadDay = params.get("bad") === "1";
  const sessionId = id === "offline" ? null : Number(id);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { today, refresh } = useTodayWorkout();
  useWakeLock(true);

  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [setNumber, setSetNumber] = useState(1);
  const [phase, setPhase] = useState<Phase>("lift");
  const [restRemaining, setRestRemaining] = useState(0);
  const [restTotal, setRestTotal] = useState(0);
  const [pr, setPr] = useState<{
    weightKg: number;
    reps: number;
    deltaKg: number;
    nextSuggestionKg?: number;
    nextSuggestionReps?: number;
  } | null>(null);
  const [loggedSets, setLoggedSets] = useState<LoggedSet[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [extraSetsByIdx, setExtraSetsByIdx] = useState<Record<number, number>>({});
  const [showAddExercise, setShowAddExercise] = useState(false);

  const isHe = i18n.language.startsWith("he");
  const exercises = useMemo(() => today?.exercises ?? [], [today]);
  const baseExercise = exercises[exerciseIdx];
  const extraSetsHere = extraSetsByIdx[exerciseIdx] ?? 0;
  const currentExercise = baseExercise
    ? { ...baseExercise, targetSets: baseExercise.targetSets + extraSetsHere }
    : undefined;
  const nextExercise = exercises[exerciseIdx + 1];

  // Per-set live working values — defaults to suggestion, user adjusts via ±.
  const [weight, setWeight] = useState<number>(0);
  const [reps, setReps] = useState<number>(0);
  useEffect(() => {
    if (!currentExercise) return;
    setWeight(currentExercise.suggestion.weightKg);
    setReps(currentExercise.suggestion.repsTarget);
  }, [currentExercise]);

  // Reset set counter and phase when the exercise pointer changes.
  useEffect(() => {
    setSetNumber(1);
    setPhase("lift");
  }, [exerciseIdx]);

  // Rest countdown (inline — no full-screen modal).
  const restFiredRef = useRef({ ten: false, three: false, zero: false });
  useEffect(() => {
    if (phase !== "rest") return;
    restFiredRef.current = { ten: false, three: false, zero: false };
    const handle = window.setInterval(() => {
      setRestRemaining((r) => {
        const next = r - 1;
        if (next === 10 && !restFiredRef.current.ten) {
          restFiredRef.current.ten = true;
          vibrate(200);
        }
        if (next === 3 && !restFiredRef.current.three) {
          restFiredRef.current.three = true;
          vibrate([200, 200, 200]);
        }
        if (next <= 0 && !restFiredRef.current.zero) {
          restFiredRef.current.zero = true;
          vibrate(600);
          beep(523, 220, 0.07);
          window.clearInterval(handle);
          window.setTimeout(() => {
            setPhase("lift");
            setSetNumber((n) => n + 1);
          }, 200);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(handle);
  }, [phase]);

  if (!user) return null;
  if (!today)
    return (
      <div className="flex min-h-screen items-center justify-center text-text-mute">
        {t("app.loading")}
      </div>
    );

  if (isBadDay) {
    return <BadDayFlow sessionClientId={sessionClientId!} sessionId={sessionId} />;
  }

  if (exercises.length === 0) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-6 text-center text-text-2">
        <p>{t("workout.no_exercises")}</p>
        <Link to="/" className="mt-4 underline">
          {t("common.back")}
        </Link>
      </div>
    );
  }

  if (showSummary) {
    return (
      <SummaryView
        loggedSets={loggedSets}
        onFinish={async () => {
          if (sessionId) {
            try {
              await endpoints.sessions.complete(sessionId);
            } catch {
              /* offline ok */
            }
          }
          await refresh().catch(() => {});
          navigate("/", { replace: true });
        }}
      />
    );
  }

  const onSetDone = async () => {
    if (!currentExercise) return;
    vibrate(50);
    const oneRmKg = epley1RM(weight, reps);
    const clientId = crypto.randomUUID();
    const previousBest = currentExercise.bestEverOneRm ?? 0;
    let isPR = oneRmKg > previousBest && reps > 0;

    await dexie.pendingSets.put({
      clientId,
      sessionClientId: sessionClientId ?? "",
      sessionId,
      exerciseId: currentExercise.exercise.id,
      programExerciseId: currentExercise.programExerciseId ?? null,
      setNumber,
      weightKg: weight,
      reps,
      rir: null,
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      synced: 0,
    });

    if (sessionId) {
      try {
        const res = await endpoints.sets.create(sessionId, {
          exerciseId: currentExercise.exercise.id,
          programExerciseId: currentExercise.programExerciseId ?? undefined,
          setNumber,
          weightKg: weight,
          reps,
          clientId,
          completedAt: new Date().toISOString(),
        });
        await dexie.pendingSets.update(clientId, { synced: 1 });
        isPR = res.isPR;
      } catch {
        /* offline */
      }
    }

    setLoggedSets((prev) => [
      ...prev,
      { exerciseId: currentExercise.exercise.id, setNumber, weightKg: weight, reps, oneRmKg, isPR },
    ]);

    if (isPR) {
      const deltaKg = Math.max(0, oneRmKg - previousBest);
      const next = nextInRack(weight, user.rack);
      setPr({
        weightKg: weight,
        reps,
        deltaKg: Math.round(deltaKg * 10) / 10,
        nextSuggestionKg: next,
        nextSuggestionReps: Math.max(1, reps - 2),
      });
      return;
    }

    proceedAfterSet();
  };

  const proceedAfterSet = () => {
    if (!currentExercise) return;
    if (setNumber >= currentExercise.targetSets) {
      // Last set → between state (or summary if last exercise)
      if (exerciseIdx >= exercises.length - 1) {
        setShowSummary(true);
      } else {
        setPhase("between");
      }
      return;
    }
    // More sets to go → rest
    setRestTotal(currentExercise.restSeconds);
    setRestRemaining(currentExercise.restSeconds);
    setPhase("rest");
  };

  const skipRest = () => {
    setPhase("lift");
    setSetNumber((n) => n + 1);
  };

  const goNextExercise = () => {
    setExerciseIdx((i) => i + 1);
  };

  if (!currentExercise) return null;

  // PR chase math — show ghost duel if PR is in striking distance and we're on "lift" phase.
  const lastSets = currentExercise.lastSession?.sets ?? [];
  const matchingPastSet =
    lastSets.find((s) => Math.abs(s.weightKg - weight) < 0.05) ?? lastSets[0] ?? null;
  const chase =
    phase === "lift" && currentExercise.bestEverOneRm
      ? computePRChase({
          bestOneRm: currentExercise.bestEverOneRm,
          weightKg: weight,
          plannedReps: reps,
          lastReps: matchingPastSet?.reps ?? null,
          rack: user.rack,
        })
      : null;

  const showGhostDuel = chase != null && chase.inStrikingDistance;

  // Eyebrow + CTA per phase
  const eyebrow =
    phase === "lift"
      ? t("workout.state_lift")
      : phase === "rest"
        ? t("workout.state_rest")
        : t("workout.state_move");

  const ctaLabel =
    phase === "lift"
      ? showGhostDuel
        ? `${t("pr.crush_it")} △`
        : `${t("workout.set_done_short")} ✓`
      : phase === "rest"
        ? `${t("workout.skip")} →`
        : `${t("workout.next")} →`;

  const onCta =
    phase === "lift"
      ? onSetDone
      : phase === "rest"
        ? skipRest
        : goNextExercise;

  // Day-of-week segments for the per-exercise progress bar (sets count).
  const setsTotal = currentExercise.targetSets;

  // Rest helper — display mm:ss
  const restMinutes = Math.floor(restRemaining / 60);
  const restSecs = restRemaining % 60;
  const restDisplay = `${restMinutes}:${String(restSecs).padStart(2, "0")}`;
  const isLastFifteen = phase === "rest" && restRemaining > 0 && restRemaining <= 15;

  return (
    <div className="relative mx-auto flex min-h-screen max-w-md flex-col bg-bg pb-32">
      {/* Persistent header: exercise name + set/exercise meta */}
      <header className="px-5 pt-5">
        <div className="flex items-center justify-between text-[12px] text-text-2">
          <Link to="/" className="active:text-text">
            ←
          </Link>
          <div className="flex items-center gap-3 font-num text-[11px] text-text-dim">
            <span className="ltr-numbers">
              {t("workout.set_progress", {
                current: setNumber,
                total: setsTotal,
                exCurrent: exerciseIdx + 1,
                exTotal: exercises.length,
              })}
            </span>
          </div>
        </div>
        <div className="mt-2 text-[14px] text-text-2">
          {isHe ? currentExercise.exercise.nameHe : currentExercise.exercise.nameEn}
        </div>

        {/* 3-segment progress bar (per-set within exercise) */}
        <div className="mt-2 flex gap-1">
          {Array.from({ length: setsTotal }).map((_, i) => (
            <div
              key={i}
              className={
                "h-[3px] flex-1 rounded-sm " +
                (i < setNumber - 1
                  ? "bg-accent"
                  : i === setNumber - 1
                    ? "bg-accent/50"
                    : "bg-surface-2")
              }
            />
          ))}
        </div>
      </header>

      {/* Eyebrow word per state */}
      <div className="mt-7 px-5 text-center">
        <div className="eyebrow text-accent">{eyebrow.toUpperCase()}</div>
      </div>

      {/* Hero numeral area — always same spot, content flips by phase */}
      <div className="mt-2 flex flex-1 flex-col items-center px-5">
        {phase === "lift" && !showGhostDuel && (
          <LiftHero
            weight={weight}
            reps={reps}
            onWeight={setWeight}
            onReps={setReps}
            rack={user.rack}
            lastLabel={
              matchingPastSet
                ? `${matchingPastSet.weightKg} × ${matchingPastSet.reps}`
                : null
            }
            bestEverOneRm={currentExercise.bestEverOneRm}
          />
        )}

        {phase === "lift" && showGhostDuel && chase && (
          <div className="w-full">
            <PRGhostDuel
              chase={chase}
              weightKg={weight}
              pastPrWeightKg={matchingPastSet?.weightKg ?? weight}
              pastPrReps={chase.ghostReps}
              plannedReps={Math.max(reps, chase.repsNeeded)}
              bestOneRm={currentExercise.bestEverOneRm ?? 0}
              daysSincePR={daysSinceLastSession(currentExercise.lastSession?.date ?? null)}
            />
            <div className="mt-3">
              <CoachTip text={t("coach.tip_reps_close")} />
            </div>
            {/* Inline picker still available for adjustment */}
            <div className="mt-3">
              <InlineAdjusters
                weight={weight}
                reps={reps}
                onWeight={setWeight}
                onReps={setReps}
                rack={user.rack}
              />
            </div>
          </div>
        )}

        {phase === "rest" && (
          <RestHero
            display={restDisplay}
            total={restTotal}
            remaining={restRemaining}
            isLastFifteen={isLastFifteen}
            nextLabel={t("workout.next_label", {
              weight: weight,
              reps: reps,
            })}
          />
        )}

        {phase === "between" && (
          <BetweenHero
            doneName={isHe ? currentExercise.exercise.nameHe : currentExercise.exercise.nameEn}
            nextNameEn={nextExercise?.exercise.nameEn ?? ""}
            nextNameHe={nextExercise?.exercise.nameHe ?? ""}
            isHe={isHe}
            nextMeta={
              nextExercise
                ? `${nextExercise.targetSets} × ${nextExercise.targetRepsMin}-${nextExercise.targetRepsMax} · ${nextExercise.suggestion.weightKg}${t("workout.kg_unit")}`
                : ""
            }
          />
        )}
      </div>

      {/* Step indicator dots */}
      <div className="flex justify-center gap-1.5 pb-3 pt-1">
        {(["lift", "rest", "between"] as Phase[]).map((p) => (
          <span
            key={p}
            className={
              "h-1.5 w-1.5 rounded-full " + (p === phase ? "bg-accent" : "bg-line")
            }
          />
        ))}
      </div>

      {/* Secondary links — small mono, fixed position above CTA */}
      <div className="absolute inset-x-0 bottom-[116px] flex justify-around px-6 font-num text-[11px] text-text-dim">
        {phase === "lift" && (
          <button
            type="button"
            onClick={() =>
              setExtraSetsByIdx((m) => ({ ...m, [exerciseIdx]: (m[exerciseIdx] ?? 0) + 1 }))
            }
            className="active:text-text-2"
          >
            {t("workout.add_set")}
          </button>
        )}
        {sessionId != null && (
          <button
            type="button"
            onClick={() => setShowAddExercise(true)}
            className="active:text-text-2"
          >
            {t("workout.add_exercise")}
          </button>
        )}
        {phase === "between" && (
          <button
            type="button"
            onClick={() => setShowSummary(true)}
            className="active:text-text-2"
          >
            ↓ {t("workout.finish_session")}
          </button>
        )}
      </div>

      {/* Sticky CTA — same shape, same place, label flips per phase */}
      <div className="absolute inset-x-4 bottom-[18px]">
        <button
          type="button"
          onClick={onCta}
          className={
            "min-h-cta-lg w-full rounded-[22px] bg-accent text-cta font-extrabold text-ink active:bg-accent-2 " +
            (phase === "lift" ? "shadow-cta-glow pulse-coral" : "")
          }
        >
          {ctaLabel}
        </button>
      </div>

      {pr && (
        <PRCelebration
          exerciseNameEn={currentExercise.exercise.nameEn}
          exerciseNameHe={currentExercise.exercise.nameHe}
          weightKg={pr.weightKg}
          reps={pr.reps}
          deltaKg={pr.deltaKg}
          nextSuggestionKg={pr.nextSuggestionKg}
          nextSuggestionReps={pr.nextSuggestionReps}
          onDismiss={() => {
            setPr(null);
            proceedAfterSet();
          }}
        />
      )}

      {showAddExercise && sessionId && (
        <AddExerciseSheet
          sessionId={sessionId}
          onClose={() => setShowAddExercise(false)}
          onAdded={async () => {
            setShowAddExercise(false);
            await refresh().catch(() => {});
            setExerciseIdx(exercises.length);
            setSetNumber(1);
            setPhase("lift");
          }}
        />
      )}
    </div>
  );
}

/* ----- Hero variants ----- */

function LiftHero({
  weight,
  reps,
  onWeight,
  onReps,
  rack,
  lastLabel,
  bestEverOneRm,
}: {
  weight: number;
  reps: number;
  onWeight: (n: number) => void;
  onReps: (n: number) => void;
  rack: number[];
  lastLabel: string | null;
  bestEverOneRm: number | null;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex w-full flex-col items-center">
      <div
        className="font-num font-black text-text"
        style={{ fontSize: "96px", lineHeight: 1, letterSpacing: "-3px" }}
      >
        <span className="ltr-numbers">{weight}</span>
      </div>
      <div className="mt-1.5 text-[13px] text-text-mute">
        {t("workout.kg_unit")} ·{" "}
        <span className="ltr-numbers font-num">{reps}</span> {t("workout.reps")}
      </div>

      {(lastLabel || bestEverOneRm) && (
        <div className="mt-3 flex gap-3 font-num text-[11px] text-text-dim">
          {lastLabel && (
            <span className="ltr-numbers">
              {t("workout.last_time")}: {lastLabel}
            </span>
          )}
          {bestEverOneRm != null && (
            <span className="ltr-numbers">
              {t("pr.one_rm")} {bestEverOneRm}
              {t("workout.kg_unit")}
            </span>
          )}
        </div>
      )}

      <div className="mt-6 w-full max-w-sm">
        <InlineAdjusters
          weight={weight}
          reps={reps}
          onWeight={onWeight}
          onReps={onReps}
          rack={rack}
        />
      </div>
    </div>
  );
}

function RestHero({
  display,
  total,
  remaining,
  isLastFifteen,
  nextLabel,
}: {
  display: string;
  total: number;
  remaining: number;
  isLastFifteen: boolean;
  nextLabel: string;
}) {
  void total;
  void remaining;
  return (
    <div className="flex w-full flex-col items-center">
      <div
        className={
          "font-num font-black text-text " + (isLastFifteen ? "timer-tick" : "")
        }
        style={{ fontSize: "110px", lineHeight: 1, letterSpacing: "-4px" }}
      >
        <span className="ltr-numbers">{display}</span>
      </div>

      <div className="breathe mt-6 flex h-[140px] w-[140px] items-center justify-center rounded-full border-2 border-accent">
        <div className="absolute h-[112px] w-[112px] rounded-full border border-dashed border-accent/40" />
      </div>

      <div className="mt-6 font-num text-[12px] text-text-dim">
        <span className="ltr-numbers">{nextLabel}</span>
      </div>
    </div>
  );
}

function BetweenHero({
  doneName,
  nextNameEn,
  nextNameHe,
  isHe,
  nextMeta,
}: {
  doneName: string;
  nextNameEn: string;
  nextNameHe: string;
  isHe: boolean;
  nextMeta: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex w-full flex-col items-center text-center">
      <div className="text-[14px] font-bold tracking-wide text-accent-2">
        ✓ {doneName}
      </div>
      <div className="mt-9 eyebrow text-text-dim">
        {t("workout.next_exercise")}
      </div>
      <div
        className="mt-2 font-display font-black text-text"
        style={{
          fontSize: "38px",
          lineHeight: 1.05,
          letterSpacing: isHe ? "-0.01em" : "-0.04em",
        }}
      >
        {isHe ? nextNameHe : nextNameEn}
      </div>
      <div className="mt-2 font-num text-[12px] text-text-dim">
        <span className="ltr-numbers">{nextMeta}</span>
      </div>
    </div>
  );
}

function InlineAdjusters({
  weight,
  reps,
  onWeight,
  onReps,
  rack,
}: {
  weight: number;
  reps: number;
  onWeight: (n: number) => void;
  onReps: (n: number) => void;
  rack: number[];
}) {
  const { t } = useTranslation();
  return (
    <div className="flex w-full items-stretch gap-3" dir="ltr">
      <Adjuster
        label={t("workout.weight")}
        value={weight}
        onDec={() => onWeight(prevInRack(weight, rack))}
        onInc={() => onWeight(nextInRack(weight, rack))}
      />
      <Adjuster
        label={t("workout.reps")}
        value={reps}
        onDec={() => onReps(Math.max(0, reps - 1))}
        onInc={() => onReps(Math.min(100, reps + 1))}
      />
    </div>
  );
}

function Adjuster({
  label,
  value,
  onDec,
  onInc,
}: {
  label: string;
  value: number;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-between rounded-2xl border border-line bg-surface px-2 py-2">
      <button
        type="button"
        onClick={onDec}
        aria-label={`decrease ${label}`}
        className="flex h-10 w-10 items-center justify-center rounded-full text-2xl text-text-2 active:bg-surface-2"
      >
        −
      </button>
      <div className="text-center">
        <div className="font-num text-2xl font-bold text-text">
          <span className="ltr-numbers">{value}</span>
        </div>
        <div className="text-[10px] uppercase tracking-wider text-text-dim">
          {label}
        </div>
      </div>
      <button
        type="button"
        onClick={onInc}
        aria-label={`increase ${label}`}
        className="flex h-10 w-10 items-center justify-center rounded-full text-2xl text-text-2 active:bg-surface-2"
      >
        +
      </button>
    </div>
  );
}

function daysSinceLastSession(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const then = new Date(dateStr).getTime();
  if (!Number.isFinite(then)) return null;
  return Math.max(0, Math.round((Date.now() - then) / (24 * 3600 * 1000)));
}

/* ----- Summary ----- */

function SummaryView({
  loggedSets,
  onFinish,
}: {
  loggedSets: LoggedSet[];
  onFinish: () => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const totalVolume = loggedSets.reduce((acc, s) => acc + s.weightKg * s.reps, 0);
  const prCount = loggedSets.filter((s) => s.isPR).length;
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-bg p-6">
      <h1 className="text-section font-black text-text">{t("workout.session_summary")}</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 rounded-3xl bg-surface p-4 text-center">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-text-dim">
            {t("workout.total_sets")}
          </div>
          <div className="font-num text-3xl font-black text-text">
            <span className="ltr-numbers">{loggedSets.length}</span>
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-text-dim">
            {t("workout.total_volume")}
          </div>
          <div className="font-num text-3xl font-black text-text">
            <span className="ltr-numbers">{Math.round(totalVolume)}</span>{" "}
            <span className="text-text-mute">{t("workout.kg_unit")}</span>
          </div>
        </div>
      </div>
      {prCount > 0 && (
        <div className="mt-4 rounded-2xl bg-accent/10 p-3 text-center text-accent">
          △ {prCount} PR
        </div>
      )}
      <button
        type="button"
        onClick={onFinish}
        className="mt-auto min-h-cta-lg rounded-[22px] bg-accent text-cta font-extrabold text-ink active:bg-accent-2"
      >
        {t("workout.finish_session")}
      </button>
    </div>
  );
}

/* ----- Add exercise sheet (restyled) ----- */

function AddExerciseSheet({
  sessionId,
  onClose,
  onAdded,
}: {
  sessionId: number;
  onClose: () => void;
  onAdded: () => void | Promise<void>;
}) {
  const { t, i18n } = useTranslation();
  const isHe = i18n.language.startsWith("he");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<
    {
      exercise: { id: number; nameEn: string; nameHe: string; primaryMuscles: string[] };
      reason: string;
    }[]
  >([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await endpoints.sessions.exerciseSuggestions(sessionId, 5);
        if (cancelled) return;
        setItems(res.suggestions);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const onPick = async (exerciseId: number) => {
    setPending(exerciseId);
    setError(null);
    try {
      await endpoints.sessions.addExercise(sessionId, { exerciseId });
      await onAdded();
    } catch (e) {
      setError((e as Error).message);
      setPending(null);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/80 p-4">
      <div className="w-full max-w-md rounded-sheet bg-surface p-5">
        <div className="mb-1 flex justify-center">
          <div className="h-1 w-10 rounded-full bg-line" />
        </div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold">{t("workout.add_exercise_title")}</h3>
          <button type="button" onClick={onClose} className="text-text-mute">
            ✕
          </button>
        </div>
        {loading ? (
          <div className="text-text-mute">{t("app.loading")}</div>
        ) : items.length === 0 ? (
          <div className="text-text-mute">{t("workout.no_suggestions")}</div>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((s) => (
              <li key={s.exercise.id}>
                <button
                  type="button"
                  disabled={pending != null}
                  onClick={() => onPick(s.exercise.id)}
                  className="flex min-h-tap w-full flex-col items-start rounded-2xl bg-surface-2 px-3 py-2 text-start active:bg-line disabled:opacity-50"
                >
                  <span className="font-semibold">
                    {isHe ? s.exercise.nameHe : s.exercise.nameEn}
                  </span>
                  <span className="text-xs text-text-dim">
                    {s.exercise.primaryMuscles.join(" · ")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {error && (
          <div className="mt-3 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</div>
        )}
      </div>
    </div>
  );
}

/* ----- Bad day flow (palette refreshed) ----- */

function BadDayFlow({
  sessionClientId,
  sessionId,
}: {
  sessionClientId: string;
  sessionId: number | null;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [logged, setLogged] = useState(false);

  const log = async (kind: "squats" | "pushups" | "other") => {
    void kind;
    const clientId = crypto.randomUUID();
    await dexie.pendingSets.put({
      clientId,
      sessionClientId,
      sessionId,
      exerciseId: 1,
      programExerciseId: null,
      setNumber: 1,
      weightKg: 0,
      reps: 1,
      rir: null,
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      synced: 0,
    });
    if (sessionId) {
      try {
        await endpoints.sessions.complete(sessionId);
      } catch {
        /* ignore */
      }
    }
    setLogged(true);
    setTimeout(() => navigate("/", { replace: true }), 1800);
  };

  if (logged) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-bg p-6 text-center">
        <div className="text-huge text-accent">✓</div>
        <p className="mt-4 text-2xl font-bold text-text">{t("bad_day.done_message")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center bg-bg p-6 text-center">
      <h1 className="text-2xl font-bold text-text">{t("bad_day.prompt")}</h1>
      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => log("squats")}
          className="min-h-[80px] rounded-2xl bg-accent text-xl font-bold text-ink active:bg-accent-2"
        >
          {t("bad_day.option_squats")}
        </button>
        <button
          type="button"
          onClick={() => log("pushups")}
          className="min-h-[80px] rounded-2xl bg-accent text-xl font-bold text-ink active:bg-accent-2"
        >
          {t("bad_day.option_pushups")}
        </button>
        <button
          type="button"
          onClick={() => log("other")}
          className="min-h-[80px] rounded-2xl border border-line bg-surface text-xl text-text"
        >
          {t("bad_day.option_other")}
        </button>
      </div>
    </div>
  );
}
