import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import * as endpoints from "../api/endpoints";
import { formatDate } from "../lib/format";
import type { Session } from "@adhd/shared";

export function History() {
  const { t, i18n } = useTranslation();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void endpoints.sessions.list(50).then((r) => {
      setSessions(r.sessions);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto min-h-screen max-w-md p-6">
      <header className="mb-6 flex items-center justify-between">
        <Link to="/" className="text-sm text-stone-400 active:text-stone-200">← {t("common.back")}</Link>
        <h1 className="text-xl font-bold">{t("history.title")}</h1>
        <span className="w-12" />
      </header>

      {loading ? (
        <p className="text-stone-400">{t("app.loading")}</p>
      ) : sessions.length === 0 ? (
        <p className="text-stone-400">{t("history.no_sessions")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sessions.map((s) => (
            <li key={s.id} className="rounded-2xl bg-stone-900 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{formatDate(s.startedAt, i18n.language)}</div>
                  <div className="text-xs text-stone-500">
                    {s.status} {s.isBadDay ? "· bad day" : ""}
                  </div>
                </div>
                <Link to={`/sessions/${s.id}`} className="text-sm text-emerald-400 underline-offset-4 hover:underline">
                  {t("history.view")}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
