import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import he from "./he.json";
import en from "./en.json";

export const SUPPORTED_LANGS = ["he", "en"] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      he: { translation: he },
      en: { translation: en },
    },
    fallbackLng: "he",
    supportedLngs: SUPPORTED_LANGS as unknown as string[],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "lang",
    },
  });

function applyDir(lang: string) {
  const isHe = lang.startsWith("he");
  document.documentElement.dir = isHe ? "rtl" : "ltr";
  document.documentElement.lang = isHe ? "he" : "en";
}

applyDir(i18n.language || "he");
i18n.on("languageChanged", applyDir);

export default i18n;
