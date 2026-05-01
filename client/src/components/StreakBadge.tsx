import { useTranslation } from "react-i18next";

interface Props {
  weekDaysDone: number;
  weekDaysPlanned: number;
  currentStreakDays: number;
}

export function StreakBadge({ weekDaysDone, weekDaysPlanned, currentStreakDays }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-stone-900 px-4 py-3">
      <span className="text-2xl" aria-hidden>🔥</span>
      <div className="flex flex-col">
        <span className="text-sm text-stone-300">{t("home.streak_this_week", { done: weekDaysDone, planned: weekDaysPlanned })}</span>
        <span className="text-xs text-stone-500 ltr-numbers">{t("home.current_streak_days", { count: currentStreakDays })}</span>
      </div>
    </div>
  );
}
