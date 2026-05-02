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
      className="text-sm text-text-mute underline-offset-4 hover:text-text hover:underline"
    >
      {t("home.bad_day_button")}
    </button>
  );
}
