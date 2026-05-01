import { useTranslation } from "react-i18next";

interface Props {
  onClick: () => void;
}

export function BadDayButton({ onClick }: Props) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm text-stone-400 underline-offset-4 hover:text-stone-200 hover:underline"
    >
      {t("home.bad_day_button")}
    </button>
  );
}
