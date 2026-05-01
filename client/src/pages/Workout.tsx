import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { useTodayWorkout } from "../hooks/useTodayWorkout";
import { useWakeLock } from "../hooks/useWakeLock";
import { vibrate } from "../hooks/useVibrate";
import { SetCard } from "../components/SetCard";
import { RestTimer } from "../components/RestTimer";
import { PRCelebration } from "../components/PRCelebration";
import { ProgressBar } from "../components/ProgressBar";
import { dexie } from "../db/dexie";
import * as endpoints from "../api/endpoints";
import { epley1RM } from "../lib/oneRM";

interface LoggedSet {
  exerciseId: number;
  setNumber: number;
  weightKg: number;
  reps: number;
  oneRmKg: number;
  isPR: boolean;
}

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
  const [restSec, setRestSec] = useState<number | null>(null);
  const [pr, setPr] = useState<{ oneRmKg: number } | null>(null);
  const [loggedSets, setLoggedSets] = useState<LoggedSet[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [showExerciseComplete, setShowExerciseComplete] = useState(false);

  const isHe = i18n.language.startsWith("he");
  const exercises = useMemo(() => today?.exercises ?? [], [today]);
  const currentExercise = exercises[exerciseIdx];

  useEffect(() => {
    setSetNumber(1);
  }, [exerciseIdx]);

  if (!user) return null;
  if (!today) return <div className="flex min-h-screen items-center justify-center text-stone-400">{t("app.loading")}</div>;

  if (isBadDay) {
    return <BadDayFlow sessionClientId={sessionClientId!} sessionId={sessionId} />;
  }

  if (exercises.length === 0) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-6 text-center text-stone-300">
        <p>{t("workout.no_exercises")}</p>
        <Link to="/" className="mt-4 underline">
          {t("common.back")}
        </Link>
      </div>
    );
  }

  if (showSummary) {
    const totalVolume = loggedSets.reduce((acc, s) => acc + s.weightKg * s.reps, 0);
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col p-6">
        <h1 className="text-2xl font-bold">{t("workout.session_summary")}</h1>
        <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-stone-900 p-4 text-center">
          <div>
            <div className="text-xs text-stone-400">{t("workout.total_sets")}</div>
            <div className="ltr-numbers text-2xl font-bold">{loggedSets.length}</div>
          </div>
          <div>
            <div className="text-xs text-stone-400">{t("workout.total_volume")}</div>
            <div className="ltr-numbers text-2xl font-bold">{Math.round(totalVolume)} kg</div>
          </div>
        </div>
        {loggedSets.some((s) => s.isPR) && (
          <div className="mt-4 rounded-xl bg-emerald-500/10 p-3 text-center text-emerald-300">
            🏆 {loggedSets.filter((s) => s.isPR).length} PR(s) today
          </div>
        )}
        <button
          type="button"
          onClick={async () => {
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
          className="mt-auto min-h-tap rounded-xl bg-emerald-500 py-4 text-lg font-semibold text-stone-950"
        >
          {t("workout.finish_session")}
        </button>
      </div>
    );
  }

  const onSetDone = async (weightKg: number, reps: number) => {
    if (!currentExercise) return;
    vibrate(50);
    const oneRmKg = epley1RM(weightKg, reps);
    const clientId = crypto.randomUUID();
    const previousBest = currentExercise.bestEverOneRm ?? 0;
    let isPR = oneRmKg > previousBest && reps > 0;

    await dexie.pendingSets.put({
      clientId,
      sessionClientId: sessionClientId ?? "",
      sessionId,
      exerciseId: currentExercise.exercise.id,
      programExerciseId: currentExercise.programExerciseId,
      setNumber,
      weightKg,
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
          programExerciseId: currentExercise.programExerciseId,
          setNumber,
          weightKg,
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

    setLoggedSets((prev) => [...prev, {
      exerciseId: currentExercise.exercise.id,
      setNumber,
      weightKg,
      reps,
      oneRmKg,
      isPR,
    }]);

    if (isPR) {
      setPr({ oneRmKg });
      return;
    }

    proceedAfterSet();
  };

  const proceedAfterSet = () => {
    if (!currentExercise) return;
    if (setNumber >= currentExercise.targetSets) {
      setShowExerciseComplete(true);
      window.setTimeout(() => {
        setShowExerciseComplete(false);
        if (exerciseIdx >= exercises.length - 1) {
          setShowSummary(true);
        } else {
          setExerciseIdx((i) => i + 1);
        }
      }, 1500);
      return;
    }
    setRestSec(currentExercise.restSeconds);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col p-6">
      <header className="mb-4 flex items-center justify-between text-xs text-stone-400">
        <Link to="/" className="active:text-stone-200">← {t("common.back")}</Link>
        <span className="ltr-numbers">{t("workout.exercise_of", { current: exerciseIdx + 1, total: exercises.length })}</span>
        <button
          type="button"
          onClick={() => {
            if (exerciseIdx >= exercises.length - 1) setShowSummary(true);
            else setExerciseIdx((i) => i + 1);
          }}
          className="active:text-stone-200"
        >
          {t("workout.skip_exercise")} ⋯
        </button>
      </header>

      <ProgressBar done={exerciseIdx} total={exercises.length} />

      <div className="mt-8 flex-1">
        {currentExercise && (
          <SetCard
            rack={user.rack}
            initialWeightKg={currentExercise.suggestion.weightKg}
            initialReps={currentExercise.suggestion.repsTarget}
            setNumber={setNumber}
            totalSets={currentExercise.targetSets}
            exerciseNameHe={currentExercise.exercise.nameHe}
            exerciseNameEn={currentExercise.exercise.nameEn}
            targetRepsMin={currentExercise.targetRepsMin}
            targetRepsMax={currentExercise.targetRepsMax}
            lastSessionLabel={
              currentExercise.lastSession && currentExercise.lastSession.sets.length > 0
                ? `${currentExercise.lastSession.sets[0].weightKg}kg × ${currentExercise.lastSession.sets[0].reps}`
                : undefined
            }
            bestLabel={currentExercise.bestEverOneRm ? `1RM ${currentExercise.bestEverOneRm}kg` : undefined}
            onSetDone={onSetDone}
          />
        )}
      </div>

      {pr && <PRCelebration oneRmKg={pr.oneRmKg} onDismiss={() => { setPr(null); proceedAfterSet(); }} />}

      {restSec !== null && (
        <RestTimer
          seconds={restSec}
          onDone={() => {
            setRestSec(null);
            setSetNumber((n) => n + 1);
          }}
          onSkip={() => {
            setRestSec(null);
            setSetNumber((n) => n + 1);
          }}
        />
      )}

      {showExerciseComplete && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-stone-950/90">
          <div className="text-center">
            <div className="text-huge">✓</div>
            <div className="mt-2 text-2xl font-bold text-emerald-400">{t("workout.exercise_complete")}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function BadDayFlow({ sessionClientId, sessionId }: { sessionClientId: string; sessionId: number | null }) {
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
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-6 text-center">
        <div className="text-huge">✓</div>
        <p className="mt-4 text-2xl font-bold text-emerald-400">{t("bad_day.done_message")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-6 text-center">
      <h1 className="text-2xl font-bold">{t("bad_day.prompt")}</h1>
      <div className="mt-8 flex flex-col gap-3">
        <button type="button" onClick={() => log("squats")} className="min-h-[80px] rounded-2xl bg-emerald-500 text-xl font-semibold text-stone-950">
          {t("bad_day.option_squats")}
        </button>
        <button type="button" onClick={() => log("pushups")} className="min-h-[80px] rounded-2xl bg-emerald-500 text-xl font-semibold text-stone-950">
          {t("bad_day.option_pushups")}
        </button>
        <button type="button" onClick={() => log("other")} className="min-h-[80px] rounded-2xl bg-stone-800 text-xl text-stone-100">
          {t("bad_day.option_other")}
        </button>
      </div>
    </div>
  );
}
