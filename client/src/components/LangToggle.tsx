import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/useAuth";
import * as endpoints from "../api/endpoints";

export function LangToggle() {
  const { i18n } = useTranslation();
  const { user, setLocalUser } = useAuth();

  const switchTo = async (lang: "he" | "en") => {
    await i18n.changeLanguage(lang);
    if (user) {
      try {
        const res = await endpoints.auth.patchMe({ locale: lang });
        setLocalUser(res.user);
      } catch {
        /* offline ok */
      }
    }
  };

  const current = i18n.language.startsWith("he") ? "he" : "en";
  return (
    <div className="inline-flex rounded-full bg-surface-2 p-1 text-sm">
      <button
        type="button"
        onClick={() => switchTo("he")}
        className={`min-h-tap rounded-full px-4 py-2 ${current === "he" ? "bg-accent text-ink" : "text-text-2"}`}
      >
        עברית
      </button>
      <button
        type="button"
        onClick={() => switchTo("en")}
        className={`min-h-tap rounded-full px-4 py-2 ${current === "en" ? "bg-accent text-ink" : "text-text-2"}`}
      >
        English
      </button>
    </div>
  );
}
