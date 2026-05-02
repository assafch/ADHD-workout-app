import { useTranslation } from "react-i18next";

interface Props {
  text: string;
  eyebrow?: string;
  className?: string;
}

export function CoachTip({ text, eyebrow, className = "" }: Props) {
  const { t } = useTranslation();
  const label = eyebrow ?? t("coach.tip");

  return (
    <div
      className={`flex items-start gap-2.5 rounded-2xl border border-ai/25 bg-ai/10 px-3.5 py-2.5 text-start ${className}`}
    >
      <div
        aria-hidden="true"
        className="mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-ai text-[11px] font-extrabold text-ink"
      >
        AI
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-ai">
          {label}
        </div>
        <div className="mt-0.5 text-[12px] leading-[1.35] text-text-2">
          {text}
        </div>
      </div>
    </div>
  );
}
