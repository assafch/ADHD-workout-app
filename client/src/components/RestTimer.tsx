import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { beep, vibrate } from "../hooks/useVibrate";

interface Props {
  seconds: number;
  onDone: () => void;
  onSkip: () => void;
}

export function RestTimer({ seconds, onDone, onSkip }: Props) {
  const { t } = useTranslation();
  const [remaining, setRemaining] = useState(seconds);
  const total = useRef(seconds);
  const fired = useRef<{ ten: boolean; three: boolean; zero: boolean }>({ ten: false, three: false, zero: false });

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRemaining((r) => {
        const next = r - 1;
        if (next === 10 && !fired.current.ten) { fired.current.ten = true; vibrate(200); }
        if (next === 3 && !fired.current.three) { fired.current.three = true; vibrate([200, 200, 200]); }
        if (next <= 0 && !fired.current.zero) {
          fired.current.zero = true;
          vibrate(600);
          beep(523, 220, 0.07);
          window.clearInterval(interval);
          window.setTimeout(onDone, 200);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [onDone]);

  const adjust = (delta: number) => {
    setRemaining((r) => Math.max(0, r + delta));
    total.current = Math.max(total.current + delta, total.current);
    if (delta > 0) fired.current = { ten: false, three: false, zero: false };
  };

  const pct = total.current > 0 ? Math.max(0, Math.min(1, remaining / total.current)) : 0;
  const circumference = 2 * Math.PI * 90;
  const dash = circumference * pct;

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-bg/95 backdrop-blur">
      <div className="relative flex h-64 w-64 items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="90" stroke="#1c1917" strokeWidth="10" fill="none" />
          <circle
            cx="100"
            cy="100"
            r="90"
            stroke="#10b981"
            strokeWidth="10"
            fill="none"
            strokeDasharray={`${dash} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.3s linear" }}
          />
        </svg>
        <div className="text-center">
          <div className="ltr-numbers text-huge font-bold tabular-nums">{remaining}</div>
          <div className="text-sm uppercase tracking-wide text-text-mute">{t("workout.rest_remaining")}</div>
        </div>
      </div>
      <div className="mt-8 flex gap-4">
        <button
          type="button"
          onClick={() => adjust(-15)}
          className="min-h-tap rounded-full bg-surface-2 px-6 py-3 text-lg active:bg-line"
        >
          −15s
        </button>
        <button
          type="button"
          onClick={() => adjust(15)}
          className="min-h-tap rounded-full bg-surface-2 px-6 py-3 text-lg active:bg-line"
        >
          +15s
        </button>
      </div>
      <button
        type="button"
        onClick={onSkip}
        className="mt-6 min-h-tap rounded-full bg-accent px-8 py-4 text-lg font-semibold text-ink active:bg-accent"
      >
        {t("workout.skip_rest")}
      </button>
    </div>
  );
}
