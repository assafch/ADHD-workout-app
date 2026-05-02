import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import * as endpoints from "../api/endpoints";
import type { Exercise } from "@adhd/shared";

export function ExerciseDetail() {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const { t, i18n } = useTranslation();
  const [state, setState] = useState<{ exercise: Exercise; history: { date: string; bestSet: { weightKg: number; reps: number; oneRmKg: number | null }; totalVolumeKg: number }[] } | null>(null);

  useEffect(() => {
    if (!idOrSlug) return;
    void endpoints.exercises.history(idOrSlug, 365).then(setState).catch(() => setState(null));
  }, [idOrSlug]);

  if (!state) return <div className="p-6 text-text-mute">{t("app.loading")}</div>;
  const isHe = i18n.language.startsWith("he");
  const name = isHe ? state.exercise.nameHe : state.exercise.nameEn;
  const data = state.history.map((h) => ({ date: h.date, oneRm: h.bestSet.oneRmKg ?? 0, volume: h.totalVolumeKg }));

  return (
    <div className="mx-auto min-h-screen max-w-md p-6">
      <Link to="/history" className="text-sm text-text-mute">← {t("common.back")}</Link>
      <h1 className="mt-2 text-xl font-bold">{t("exercise.history_title", { name })}</h1>

      {data.length === 0 ? (
        <p className="mt-6 text-text-mute">{t("exercise.no_data")}</p>
      ) : (
        <>
          <div className="mt-4 h-64 w-full">
            <p className="mb-2 text-sm text-text-2">{t("exercise.one_rm_trend")}</p>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
                <XAxis dataKey="date" stroke="#a8a29e" fontSize={11} />
                <YAxis stroke="#a8a29e" fontSize={11} />
                <Tooltip contentStyle={{ background: "#1c1917", border: "1px solid #44403c" }} />
                <Line type="monotone" dataKey="oneRm" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <ul className="mt-4 flex flex-col gap-2">
            {state.history.slice().reverse().map((h, idx) => (
              <li key={idx} className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 text-sm">
                <span>{h.date}</span>
                <span className="ltr-numbers">{h.bestSet.weightKg}kg × {h.bestSet.reps} → {h.bestSet.oneRmKg}kg 1RM</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
