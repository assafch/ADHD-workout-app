import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useTodayWorkout } from "../hooks/useTodayWorkout";
import { useAuth } from "../auth/useAuth";
import { useOffline } from "../hooks/useOffline";
import { StreakBadge } from "../components/StreakBadge";
import { BadDayButton } from "../components/BadDayButton";
import { greetingKey, formatDayName } from "../lib/format";
import * as endpoints from "../api/endpoints";
import { dexie } from "../db/dexie";

export function Home() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { today, isLoading } = useTodayWorkout();
  const { online, pending } = useOffline();
  const isHe = i18n.language.startsWith("he");

  const [bw, setBw] = useState("");
  const [bwSaved, setBwSaved] = useState(false);

  useEffect(() => {
    if (!bwSaved) return;
    const t = setTimeout(() => setBwSaved(false), 2000);
    return () => clearTimeout(t);
  }, [bwSaved]);

  const onSaveBw = async (e: FormEvent) => {
    e.preventDefault();
    const num = Number(bw);
    if (!Number.isFinite(num) || num <= 0) return;
    const today = new Date().toISOString().slice(0, 10);
    const clientKey = `${today}`;
    await dexie.bodyMetrics.put({
      clientKey,
      date: today,
      weightKg: num,
      notes: null,
      synced: 0,
    });
    try {
      await endpoints.body.upsert(today, num);
      await dexie.bodyMetrics.update(clientKey, { synced: 1 });
    } catch {
      /* offline ok */
    }
    setBw("");
    setBwSaved(true);
  };

  const startSession = async (isBadDay = false) => {
    if (!today?.programDay && !isBadDay) return;
    const clientId = crypto.randomUUID();
    await dexie.pendingSessions.put({
      clientId,
      serverId: null,
      programDayId: today?.programDay?.id ?? null,
      isBadDay,
      startedAt: new Date().toISOString(),
      completedAt: null,
      status: "in_progress",
      synced: 0,
    });
    try {
      const res = await endpoints.sessions.create({
        programDayId: today?.programDay?.id,
        isBadDay,
        clientId,
      });
      await dexie.pendingSessions.update(clientId, { serverId: res.session.id, synced: 1 });
      navigate(`/workout/${res.session.id}?cid=${clientId}${isBadDay ? "&bad=1" : ""}`);
    } catch {
      navigate(`/workout/offline?cid=${clientId}${isBadDay ? "&bad=1" : ""}`);
    }
  };

  const resumeSession = () => {
    if (today?.activeSession) {
      navigate(`/workout/${today.activeSession.id}`);
    }
  };

  if (isLoading && !today) {
    return <div className="flex min-h-screen items-center justify-center text-stone-400">{t("app.loading")}</div>;
  }

  if (!today) {
    return <div className="flex min-h-screen items-center justify-center text-stone-400">{t("home.no_program")}</div>;
  }

  const greeting = t(`home.${greetingKey()}` as const);
  const dayName = today.programDay ? (isHe ? today.programDay.nameHe : today.programDay.nameEn) : formatDayName(today.dayOfWeek, i18n.language);

  return (
    <div className="mx-auto min-h-screen max-w-md p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-stone-400">{greeting}{user?.name ? ` · ${user.name}` : ""}</p>
          <h1 className="text-2xl font-bold">{dayName}</h1>
        </div>
        <Link to="/settings" aria-label="settings" className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-900 text-stone-300 active:bg-stone-800">
          ⚙️
        </Link>
      </header>

      {!online && (
        <div className="mb-4 rounded-lg bg-amber-500/15 px-3 py-2 text-sm text-amber-300">
          {t("offline.indicator", { count: pending })}
        </div>
      )}

      <main className="flex flex-col gap-6">
        {today.isRestDay ? (
          <RestCard onLogAnyway={() => startSession(false)} />
        ) : today.isCardioDay ? (
          <CardioCard onLogWalk={() => startSession(true)} onLiftInstead={() => startSession(false)} />
        ) : today.activeSession ? (
          <button
            type="button"
            onClick={resumeSession}
            className="pulse-emerald min-h-[88px] w-full rounded-3xl bg-emerald-500 text-2xl font-bold text-stone-950 active:bg-emerald-400"
          >
            {t("home.resume_workout")}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => startSession(false)}
            disabled={today.exercises.length === 0}
            className="pulse-emerald min-h-[88px] w-full rounded-3xl bg-emerald-500 text-2xl font-bold text-stone-950 active:bg-emerald-400 disabled:opacity-50"
          >
            {t("home.start_workout")}
          </button>
        )}

        <StreakBadge
          weekDaysDone={today.streak.weekDaysDone}
          weekDaysPlanned={today.streak.weekDaysPlanned}
          currentStreakDays={today.streak.currentStreakDays}
        />

        <form onSubmit={onSaveBw} className="flex items-center gap-2 rounded-2xl bg-stone-900 p-3">
          <span className="text-sm text-stone-300">{t("home.bodyweight_label")}</span>
          <input
            type="number"
            step="0.1"
            value={bw}
            onChange={(e) => setBw(e.target.value)}
            placeholder={t("home.weight_placeholder")}
            className="ltr-numbers min-h-tap flex-1 rounded-lg bg-stone-800 px-3 py-2 text-base outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="min-h-tap rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-stone-950"
          >
            {bwSaved ? t("home.saved") : t("home.log_weight")}
          </button>
        </form>

        {today.exercises.length > 0 && (
          <ul className="rounded-2xl bg-stone-900 p-3 text-sm text-stone-300">
            {today.exercises.map((ex) => (
              <li key={ex.programExerciseId} className="flex items-center justify-between border-b border-stone-800 py-2 last:border-0">
                <span>{isHe ? ex.exercise.nameHe : ex.exercise.nameEn}</span>
                <span className="ltr-numbers text-xs text-stone-500">
                  {ex.targetSets}×{ex.targetRepsMin}-{ex.targetRepsMax} @ {ex.suggestion.weightKg}kg
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-between text-xs">
          <Link to="/history" className="text-stone-400 underline-offset-4 hover:underline">{t("history.title")}</Link>
          <BadDayButton onClick={() => navigate("/bad-day")} />
        </div>
      </main>
    </div>
  );
}

function RestCard({ onLogAnyway }: { onLogAnyway: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-3xl bg-stone-900 p-6 text-center">
      <div className="text-3xl">🛏️</div>
      <h2 className="mt-2 text-2xl font-bold">{t("home.rest_day")}</h2>
      <button type="button" onClick={onLogAnyway} className="mt-4 text-sm text-stone-400 underline">
        {t("home.log_anyway")}
      </button>
    </div>
  );
}

function CardioCard({ onLogWalk, onLiftInstead }: { onLogWalk: () => void; onLiftInstead: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-3xl bg-stone-900 p-6 text-center">
      <div className="text-3xl">🚶</div>
      <h2 className="mt-2 text-2xl font-bold">{t("home.cardio_day")}</h2>
      <div className="mt-4 flex flex-col gap-2">
        <button type="button" onClick={onLogWalk} className="min-h-tap rounded-xl bg-emerald-500 py-3 font-semibold text-stone-950">
          {t("home.log_walk")}
        </button>
        <button type="button" onClick={onLiftInstead} className="text-sm text-stone-400 underline">
          {t("home.lift_instead")}
        </button>
      </div>
    </div>
  );
}
