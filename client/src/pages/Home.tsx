import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useTodayWorkout } from "../hooks/useTodayWorkout";
import { useAuth } from "../auth/useAuth";
import { useOffline } from "../hooks/useOffline";
import { greetingKey } from "../lib/format";
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
    const handle = window.setTimeout(() => setBwSaved(false), 2000);
    return () => window.clearTimeout(handle);
  }, [bwSaved]);

  const onSaveBw = async (e: FormEvent) => {
    e.preventDefault();
    const num = Number(bw);
    if (!Number.isFinite(num) || num <= 0) return;
    const todayIso = new Date().toISOString().slice(0, 10);
    const clientKey = `${todayIso}`;
    await dexie.bodyMetrics.put({
      clientKey,
      date: todayIso,
      weightKg: num,
      notes: null,
      synced: 0,
    });
    try {
      await endpoints.body.upsert(todayIso, num);
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

  const programDayCount = useMemo(() => {
    const start = (user as { programStartDate?: string | null } | null)?.programStartDate;
    if (!start) return null;
    const startMs = new Date(start).getTime();
    if (!Number.isFinite(startMs)) return null;
    const days = Math.floor((Date.now() - startMs) / (24 * 3600 * 1000)) + 1;
    return days > 0 ? days : null;
  }, [user]);

  const estimatedMinutes = useMemo(() => {
    const lifts = today?.exercises ?? [];
    if (lifts.length === 0) return null;
    const setsCount = lifts.reduce((acc, e) => acc + e.targetSets, 0);
    const restSec = lifts.reduce((acc, e) => acc + e.restSeconds * Math.max(0, e.targetSets - 1), 0);
    const liftSec = setsCount * 45;
    return Math.max(15, Math.round((restSec + liftSec) / 60));
  }, [today]);

  if (isLoading && !today) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-text-mute">
        {t("app.loading")}
      </div>
    );
  }

  if (!today) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-text-mute">
        {t("home.no_program")}
      </div>
    );
  }

  const greeting = t(`home.${greetingKey()}` as const);
  const greetingLine = `${greeting}${user?.name ? `, ${user.name}` : ""}`;

  const dayName = today.programDay
    ? isHe
      ? today.programDay.nameHe
      : today.programDay.nameEn
    : today.isRestDay
      ? t("home.rest_day")
      : today.isCardioDay
        ? t("home.cardio_day")
        : t("home.no_program");

  const isWorkoutDay = !today.isRestDay && !today.isCardioDay && !!today.programDay;
  const hasResumable = !!today.activeSession;
  const lifts = today.exercises;

  return (
    <div className="relative mx-auto flex min-h-screen max-w-md flex-col bg-bg pb-[80px]">
      {!online && (
        <div className="mx-5 mt-3 rounded-xl border border-warn/30 bg-warn/[0.12] px-3 py-2 text-[12px] text-warn">
          ◐ {t("offline.indicator", { count: pending })}
        </div>
      )}

      {/* Greeting */}
      <header className="px-5 pt-5">
        <div className="text-[13px] tracking-wide text-text-mute">{greetingLine}</div>
      </header>

      {/* Eyebrow + day-name hero */}
      <section className="px-5 pt-7">
        <div className="eyebrow text-accent-2">
          {t("home.today").toUpperCase()}
          {programDayCount != null && (
            <>
              {" · "}
              <span className="ltr-numbers font-num">
                {isHe ? `יום ${programDayCount}` : `day ${programDayCount}`}
              </span>
            </>
          )}
        </div>
        <h1
          className="mt-1 font-display font-black text-text"
          style={{
            fontSize: "78px",
            lineHeight: 0.88,
            letterSpacing: isHe ? "-1px" : "-3px",
          }}
        >
          {dayName}
        </h1>
        {lifts.length > 0 && (
          <div className="mt-3 font-num text-[13px] text-text-dim">
            <span className="ltr-numbers">{lifts.length}</span>{" "}
            {t("home.lifts_word")}
            {estimatedMinutes != null && (
              <>
                {" · "}
                <span className="ltr-numbers">~{estimatedMinutes}</span>{" "}
                {t("workout.minutes_short")}
              </>
            )}
          </div>
        )}
      </section>

      {/* Primary CTA */}
      <section className="px-5 pt-6">
        {today.isRestDay ? (
          <RestCard />
        ) : today.isCardioDay ? (
          <CardioCard onLogWalk={() => startSession(true)} />
        ) : hasResumable ? (
          <button
            type="button"
            onClick={resumeSession}
            className="pulse-coral relative h-[92px] w-full rounded-[26px] bg-accent text-2xl font-extrabold text-ink shadow-cta-glow active:bg-accent-2"
          >
            {t("home.resume_workout")}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => startSession(false)}
            disabled={lifts.length === 0}
            className="pulse-coral relative h-[92px] w-full rounded-[26px] bg-accent text-2xl font-extrabold text-ink shadow-cta-glow active:bg-accent-2 disabled:opacity-50"
          >
            {t("home.start_workout")}
          </button>
        )}
        <div className="mt-2 text-end">
          <Link to="/adjust" className="font-num text-[11px] text-text-dim active:text-text-2">
            {t("adjust.open")} ↗
          </Link>
        </div>
      </section>

      {/* Streak strip */}
      <section className="px-5 pt-7">
        <WeekDotStrip
          weekDaysDone={today.streak.weekDaysDone}
          dayOfWeekToday={today.dayOfWeek}
        />
        <div className="mt-2 font-num text-[11px] text-text-mute">
          <span className="ltr-numbers">{today.streak.currentStreakDays}</span>{" "}
          {t("home.day_streak_word")} <span className="text-accent">▲</span>
        </div>
      </section>

      {/* Bodyweight quick log */}
      <section className="px-5 pt-6">
        <form onSubmit={onSaveBw} className="flex items-center gap-2 rounded-2xl bg-surface p-2 ps-3">
          <span className="text-[12px] text-text-mute">{t("home.bodyweight_label")}</span>
          <input
            type="number"
            step="0.1"
            value={bw}
            onChange={(e) => setBw(e.target.value)}
            placeholder={t("home.weight_placeholder")}
            className="ltr-numbers font-num min-h-tap flex-1 rounded-lg bg-surface-2 px-3 py-2 text-[14px] text-text outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            type="submit"
            className="min-h-tap rounded-lg bg-accent px-4 py-2 text-[13px] font-bold text-ink active:bg-accent-2"
          >
            {bwSaved ? t("home.saved") : t("home.log_weight")}
          </button>
        </form>
      </section>

      {/* Preview list */}
      {isWorkoutDay && lifts.length > 0 && (
        <section className="px-5 pt-7">
          <div className="eyebrow mb-2 text-text-dim">{t("home.preview")}</div>
          <ul>
            {lifts.map((ex, i) => (
              <li
                key={`${ex.programExerciseId ?? "se"}-${ex.exercise.id}`}
                className={
                  "flex items-center justify-between py-2.5 text-[14px] text-text-2" +
                  (i < lifts.length - 1 ? " border-b border-surface-2" : "")
                }
              >
                <span className="flex items-center gap-2">
                  <span className="font-num text-[10px] text-text-dim">{i + 1}</span>
                  {isHe ? ex.exercise.nameHe : ex.exercise.nameEn}
                </span>
                <span className="font-num text-[12px] text-text-dim">
                  <span className="ltr-numbers">
                    {ex.targetSets}×{ex.targetRepsMin}
                    {ex.targetRepsMin !== ex.targetRepsMax ? `-${ex.targetRepsMax}` : ""} ·{" "}
                    {ex.suggestion.weightKg}
                    {t("workout.kg_unit")}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Rough day chip */}
      <section className="px-5 pb-4 pt-6">
        <button
          type="button"
          onClick={() => navigate("/bad-day")}
          className="w-full rounded-2xl border border-dashed border-line px-4 py-3 text-start active:bg-surface-2"
        >
          <div className="text-[12px] uppercase tracking-wider text-text-dim">
            {t("home.bad_day_eyebrow")}
          </div>
          <div className="mt-0.5 text-[13px] text-text-2">{t("home.bad_day_sub")} →</div>
        </button>
      </section>

      {/* Bottom nav */}
      <BottomNav active="home" />
    </div>
  );
}

function RestCard() {
  const { t } = useTranslation();
  return (
    <div className="rounded-[26px] border border-line bg-surface px-5 py-7 text-center">
      <div
        aria-hidden
        className="mx-auto flex h-[100px] w-[100px] items-center justify-center rounded-full border-2 border-dashed border-line text-[40px] text-text-dim"
      >
        ○
      </div>
      <h2 className="mt-4 text-[28px] font-black text-text">{t("home.rest_day")}</h2>
      <div className="mt-2 text-[13px] text-text-mute">{t("home.rest_subtitle")}</div>
      <Link
        to="/adjust"
        className="mt-4 inline-block rounded-2xl border-[1.5px] border-accent px-5 py-2 text-[14px] font-bold text-accent active:bg-accent/10"
      >
        + {t("adjust.extra_workout")}
      </Link>
    </div>
  );
}

function CardioCard({ onLogWalk }: { onLogWalk: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-[26px] border border-line bg-surface px-5 py-6 text-center">
      <div className="text-[28px] font-black text-text">{t("home.cardio_day")}</div>
      <button
        type="button"
        onClick={onLogWalk}
        className="mt-4 h-[72px] w-full rounded-[22px] bg-accent text-[18px] font-extrabold text-ink active:bg-accent-2"
      >
        {t("home.log_walk")}
      </button>
    </div>
  );
}

function WeekDotStrip({
  weekDaysDone,
  dayOfWeekToday,
}: {
  weekDaysDone: number;
  dayOfWeekToday: number;
}) {
  const { i18n } = useTranslation();
  const isHe = i18n.language.startsWith("he");
  const labels = isHe
    ? ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"]
    : ["S", "M", "T", "W", "T", "F", "S"];
  return (
    <div className="flex justify-between gap-2" dir="ltr">
      {labels.map((label, i) => {
        const filled = i < weekDaysDone;
        const isToday = i === dayOfWeekToday;
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="font-num text-[10px] text-text-dim">{label}</div>
            <div
              className={
                "h-[26px] w-[26px] rounded-lg " +
                (filled
                  ? "bg-accent"
                  : "border-[1.5px] border-dashed border-line bg-transparent") +
                (isToday && filled
                  ? " shadow-[0_0_0_4px_rgba(217,112,71,0.18)]"
                  : isToday
                    ? " shadow-[0_0_0_4px_rgba(217,112,71,0.10)] border-accent/60"
                    : "")
              }
            />
          </div>
        );
      })}
    </div>
  );
}

function BottomNav({ active }: { active: "home" | "history" | "adjust" | "settings" }) {
  const items: { key: typeof active; href: string; glyph: string; aria: string }[] = [
    { key: "home", href: "/", glyph: "▮", aria: "home" },
    { key: "history", href: "/history", glyph: "▦", aria: "history" },
    { key: "adjust", href: "/adjust", glyph: "△", aria: "adjust" },
    { key: "settings", href: "/settings", glyph: "⚙", aria: "settings" },
  ];
  return (
    <nav
      className="fixed inset-x-0 bottom-0 mx-auto flex h-16 max-w-md items-center justify-around border-t border-surface-2 bg-ink"
      dir="ltr"
      aria-label="primary"
    >
      {items.map((item) => (
        <Link
          key={item.key}
          to={item.href}
          aria-label={item.aria}
          className={
            "flex h-full flex-1 items-center justify-center font-num text-[20px] " +
            (item.key === active ? "text-text" : "text-text-dim active:text-text-2")
          }
        >
          {item.glyph}
        </Link>
      ))}
    </nav>
  );
}
