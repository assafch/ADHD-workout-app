import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { LangToggle } from "../components/LangToggle";
import { ApiError } from "../api/client";

export function Login() {
  const { t } = useTranslation();
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setError(t("auth.invalid_credentials"));
      } else {
        setError(t("auth.invalid_credentials"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-between p-6">
      <div className="flex justify-end">
        <LangToggle />
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">{t("app.name")}</h1>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("auth.email")}
          className="ltr-numbers min-h-tap rounded-xl bg-surface px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-accent"
          autoComplete="email"
          required
          dir="ltr"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("auth.password")}
          className="min-h-tap rounded-xl bg-surface px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-accent"
          autoComplete="current-password"
          required
          dir="ltr"
        />
        {error && <div className="text-sm text-rose-400">{error}</div>}
        <button
          type="submit"
          disabled={submitting}
          className="min-h-tap rounded-xl bg-accent py-3 text-lg font-semibold text-ink disabled:opacity-50"
        >
          {t("auth.login")}
        </button>
      </form>
      <div />
    </div>
  );
}
