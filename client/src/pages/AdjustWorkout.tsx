import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import * as endpoints from "../api/endpoints";
import { formatDayName } from "../lib/format";
import { dexie } from "../db/dexie";

type Day = {
  id: number;
  phase: number;
  dayOfWeek: number;
  nameEn: string;
  nameHe: string;
  isRestDay: boolean;
  isCardioDay: boolean;
};

export function AdjustWorkout() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isHe = i18n.language.startsWith("he");

  const [days, setDays] = useState<Day[]>([]);
  const [phase, setPhase] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await endpoints.programs.active();
        if (cancelled) return;
        setPhase(res.program?.phase ?? null);
        setDays(res.days);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const phaseDays = phase != null ? days.filter((d) => d.phase === phase) : days;
  const ordered = [...phaseDays].sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  const onRotate = async (day: Day) => {
    setPending(day.id);
    setError(null);
    try {
      await endpoints.programs.rotate(day.id);
      navigate("/");
    } catch (e) {
      setError((e as Error).message);
      setPending(null);
    }
  };

  const onExtra = async (day: Day) => {
    setPending(day.id);
    setError(null);
    const clientId = crypto.randomUUID();
    await dexie.pendingSessions.put({
      clientId,
      serverId: null,
      programDayId: day.id,
      isBadDay: false,
      isExtra: true,
      startedAt: new Date().toISOString(),
      completedAt: null,
      status: "in_progress",
      synced: 0,
    });
    try {
      const res = await endpoints.sessions.create({
        programDayId: day.id,
        isExtra: true,
        source: "extra",
        clientId,
      });
      await dexie.pendingSessions.update(clientId, { serverId: res.session.id, synced: 1 });
      navigate(`/workout/${res.session.id}?cid=${clientId}`);
    } catch (e) {
      setError((e as Error).message);
      setPending(null);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-md p-6">
      <header className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-text-2 active:bg-surface-2"
          aria-label={t("common.back")}
        >
          ←
        </button>
        <h1 className="text-2xl font-bold">{t("adjust.title")}</h1>
      </header>

      <p className="mb-4 text-sm text-text-mute">{t("adjust.rotate_help")}</p>

      {loading ? (
        <div className="text-text-mute">{t("app.loading")}</div>
      ) : (
        <ul className="flex flex-col gap-2">
          {ordered.map((d) => {
            const name = isHe ? d.nameHe : d.nameEn;
            const dow = formatDayName(d.dayOfWeek, i18n.language);
            const isWorkoutDay = !d.isRestDay && !d.isCardioDay;
            return (
              <li key={d.id} className="rounded-2xl bg-surface p-3">
                <div className="mb-2 px-1">
                  <div className="font-semibold">{name}</div>
                  <div className="text-xs text-text-dim">{dow}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={pending != null}
                    onClick={() => onRotate(d)}
                    className="min-h-tap flex-1 rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-ink active:bg-accent disabled:opacity-50"
                  >
                    {pending === d.id ? "…" : t("adjust.do_today")}
                  </button>
                  {isWorkoutDay && (
                    <button
                      type="button"
                      disabled={pending != null}
                      onClick={() => onExtra(d)}
                      className="min-h-tap flex-1 rounded-xl bg-surface-2 px-3 py-2 text-sm font-semibold text-text active:bg-line disabled:opacity-50"
                    >
                      {t("adjust.extra_workout")}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {error && <div className="mt-4 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</div>}

      <AdvisorPanel />
    </div>
  );
}

function AdvisorPanel() {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ rationale: string; actions: import("../api/endpoints").AdvisorAction[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onAsk = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await endpoints.advisor.ask(text.trim());
      setResult(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 rounded-2xl bg-surface p-4">
      <h2 className="text-lg font-bold">{t("advisor.title")}</h2>
      <p className="mt-1 text-xs text-text-dim">{t("advisor.help")}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder={t("advisor.placeholder")}
        className="mt-3 w-full rounded-xl bg-surface-2 px-3 py-2 text-base outline-none focus:ring-2 focus:ring-accent"
      />
      <button
        type="button"
        disabled={loading || !text.trim()}
        onClick={onAsk}
        className="mt-2 min-h-tap w-full rounded-xl bg-accent py-2 font-semibold text-ink active:bg-accent disabled:opacity-50"
      >
        {loading ? t("app.loading") : t("advisor.ask")}
      </button>
      {error && <div className="mt-3 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</div>}
      {result && (
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-sm text-text">{result.rationale}</p>
          <ul className="flex flex-col gap-1 text-xs text-text-mute">
            {result.actions.map((a, i) => (
              <li key={i} className="rounded-lg bg-surface-2 px-3 py-2">
                <span className="font-mono text-accent">{a.type}</span>
                <span className="ml-2">{describe(a)}</span>
                {"note" in a && a.note && <div className="mt-1 text-text-2">{a.note}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function describe(a: import("../api/endpoints").AdvisorAction): string {
  switch (a.type) {
    case "swap_exercise": return `${a.fromSlug} → ${a.toSlug}`;
    case "drop_sets": return `${a.slug} (-${a.sets} sets)`;
    case "reduce_weight": return `${a.slug} × ${Math.round(a.factor * 100)}%`;
    case "add_exercise": return `+ ${a.slug}`;
    case "skip_today": return "";
    case "no_action": return "";
  }
}
