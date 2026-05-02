import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { LangToggle } from "../components/LangToggle";
import * as endpoints from "../api/endpoints";

const COMMON_WEIGHTS = [2, 4, 5, 6, 7, 8, 10, 12, 14, 16, 18, 20, 22, 24, 25, 28, 30, 32, 34, 36, 40, 44, 48, 50];

export function Settings() {
  const { t, i18n } = useTranslation();
  const { user, logout, setLocalUser } = useAuth();
  const navigate = useNavigate();
  const [rack, setRack] = useState<number[]>(user?.rack ?? []);
  const [units, setUnits] = useState<"kg" | "lb">(user?.units ?? "kg");
  const [name, setName] = useState(user?.name ?? "");
  const [program, setProgram] = useState<{ id: number; phase: number } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void endpoints.programs.active().then((res) => res.program && setProgram({ id: res.program.id, phase: res.program.phase })).catch(() => {});
  }, []);

  const toggleWeight = (w: number) => {
    setRack((prev) => (prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w].sort((a, b) => a - b)));
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await endpoints.auth.patchMe({ rack, units, name });
      setLocalUser(res.user);
    } finally {
      setSaving(false);
    }
  };

  const advancePhase = async () => {
    if (!program) return;
    const nextPhase = program.phase >= 2 ? 1 : 2;
    const res = await endpoints.programs.patch(program.id, { phase: nextPhase });
    setProgram({ id: res.program.id, phase: res.program.phase });
  };

  const onLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="mx-auto min-h-screen max-w-md p-6">
      <header className="mb-6 flex items-center justify-between">
        <Link to="/" className="text-sm text-text-mute">← {t("common.back")}</Link>
        <h1 className="text-xl font-bold">{t("settings.title")}</h1>
        <span className="w-12" />
      </header>

      <section className="mb-6">
        <h2 className="mb-2 text-sm uppercase tracking-wide text-text-dim">{t("settings.language")}</h2>
        <LangToggle />
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-sm uppercase tracking-wide text-text-dim">{t("settings.units")}</h2>
        <div className="inline-flex rounded-full bg-surface-2 p-1 text-sm">
          {(["kg", "lb"] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUnits(u)}
              className={`min-h-tap rounded-full px-4 py-2 ${units === u ? "bg-accent text-ink" : "text-text-2"}`}
            >
              {t(`common.${u}`)}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-sm uppercase tracking-wide text-text-dim">{t("settings.profile")}</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("settings.name")}
          className="min-h-tap w-full rounded-xl bg-surface px-4 py-3 text-base outline-none focus:ring-2 focus:ring-accent"
        />
      </section>

      <section className="mb-6">
        <h2 className="mb-1 text-sm uppercase tracking-wide text-text-dim">{t("settings.rack")}</h2>
        <p className="mb-3 text-xs text-text-dim">{t("settings.rack_help")}</p>
        <div className="grid grid-cols-4 gap-2">
          {COMMON_WEIGHTS.map((w) => {
            const active = rack.includes(w);
            return (
              <button
                key={w}
                type="button"
                onClick={() => toggleWeight(w)}
                className={`ltr-numbers min-h-tap rounded-xl px-2 py-3 text-sm ${active ? "bg-accent text-ink font-semibold" : "bg-surface-2 text-text-2"}`}
              >
                {w}
              </button>
            );
          })}
        </div>
      </section>

      {program && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm uppercase tracking-wide text-text-dim">{t("settings.program")}</h2>
          <p className="text-text-2">{t("settings.phase")}: {t(`settings.phase_${program.phase}` as const)}</p>
          <button
            type="button"
            onClick={advancePhase}
            className="mt-2 min-h-tap rounded-xl bg-surface-2 px-4 py-2 text-sm text-text"
          >
            {t("settings.advance_phase")}
          </button>
        </section>
      )}

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="mb-3 min-h-tap w-full rounded-xl bg-accent py-3 text-lg font-semibold text-ink disabled:opacity-50"
      >
        {t("common.save")}
      </button>

      <button
        type="button"
        onClick={onLogout}
        className="min-h-tap w-full rounded-xl bg-surface-2 py-3 text-text"
      >
        {t("settings.logout")}
      </button>
    </div>
  );
}
