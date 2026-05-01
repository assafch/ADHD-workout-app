import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { celebrationSound, vibrate } from "../hooks/useVibrate";

interface Props {
  oneRmKg: number;
  onDismiss: () => void;
}

const COLORS = ["#10b981", "#34d399", "#facc15", "#fb7185", "#60a5fa"];
const PIECES = Array.from({ length: 30 }, (_, i) => i);

export function PRCelebration({ oneRmKg, onDismiss }: Props) {
  const { t } = useTranslation();

  useEffect(() => {
    vibrate([100, 50, 100, 50, 200]);
    celebrationSound();
    const timeout = window.setTimeout(onDismiss, 2500);
    return () => window.clearTimeout(timeout);
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/95 backdrop-blur"
      onClick={onDismiss}
      role="button"
      tabIndex={0}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {PIECES.map((i) => {
          const color = COLORS[i % COLORS.length];
          const left = (i * 7) % 100;
          const delay = (i % 6) * 0.07;
          const duration = 1.6 + ((i * 13) % 11) * 0.08;
          return (
            <span
              key={i}
              className="confetti-piece"
              style={{
                left: `${left}%`,
                top: 0,
                background: color,
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}
      </div>
      <div className="relative text-center">
        <div className="text-huge font-extrabold text-emerald-400">{t("pr.title")}</div>
        <div className="ltr-numbers mt-4 text-big font-bold">{t("pr.subtitle", { weight: oneRmKg })}</div>
      </div>
    </div>
  );
}
