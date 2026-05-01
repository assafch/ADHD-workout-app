import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import * as endpoints from "../api/endpoints";
import { formatDate, formatDuration } from "../lib/format";
import type { Session, SetLog } from "@adhd/shared";

export function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<{ session: Session; sets: SetLog[] } | null>(null);

  useEffect(() => {
    if (!id) return;
    void endpoints.sessions.detail(Number(id)).then(setData).catch(() => setData(null));
  }, [id]);

  if (!data) return <div className="p-6 text-stone-400">{t("app.loading")}</div>;

  const totalVolume = data.sets.reduce((acc, s) => acc + s.weightKg * s.reps, 0);

  return (
    <div className="mx-auto min-h-screen max-w-md p-6">
      <Link to="/history" className="text-sm text-stone-400">← {t("common.back")}</Link>
      <h1 className="mt-2 text-xl font-bold">{formatDate(data.session.startedAt, i18n.language)}</h1>
      <div className="mt-3 grid grid-cols-2 gap-3 rounded-2xl bg-stone-900 p-4 text-center text-sm">
        <div>
          <div className="text-xs text-stone-400">{t("workout.total_sets")}</div>
          <div className="ltr-numbers text-xl font-bold">{data.sets.length}</div>
        </div>
        <div>
          <div className="text-xs text-stone-400">{t("workout.total_volume")}</div>
          <div className="ltr-numbers text-xl font-bold">{Math.round(totalVolume)} kg</div>
        </div>
        {data.session.durationSeconds != null && (
          <div className="col-span-2">
            <div className="text-xs text-stone-400">{t("workout.duration")}</div>
            <div className="ltr-numbers text-xl font-bold">{formatDuration(data.session.durationSeconds)}</div>
          </div>
        )}
      </div>
      <ul className="mt-4 flex flex-col gap-2">
        {data.sets.map((s) => (
          <li key={s.id} className="flex items-center justify-between rounded-xl bg-stone-900 px-4 py-3 text-sm">
            <span>#{s.setNumber} · ex {s.exerciseId}</span>
            <span className="ltr-numbers">{s.weightKg}kg × {s.reps}{s.isPR ? " 🏆" : ""}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
