import { useState } from "react";
import { useTranslation } from "react-i18next";
import { WeightPicker } from "./WeightPicker";
import { RepsPicker } from "./RepsPicker";

interface Props {
  rack: number[];
  initialWeightKg: number;
  initialReps: number;
  setNumber: number;
  totalSets: number;
  exerciseNameHe: string;
  exerciseNameEn: string;
  targetRepsMin: number;
  targetRepsMax: number;
  lastSessionLabel?: string;
  bestLabel?: string;
  onSetDone: (weightKg: number, reps: number) => void;
}

export function SetCard({
  rack,
  initialWeightKg,
  initialReps,
  setNumber,
  totalSets,
  exerciseNameHe,
  exerciseNameEn,
  targetRepsMin,
  targetRepsMax,
  lastSessionLabel,
  bestLabel,
  onSetDone,
}: Props) {
  const { t, i18n } = useTranslation();
  const [weight, setWeight] = useState(initialWeightKg);
  const [reps, setReps] = useState(initialReps);

  const isHe = i18n.language.startsWith("he");
  const repRange = targetRepsMin === targetRepsMax ? `${targetRepsMin}` : `${targetRepsMin}-${targetRepsMax}`;

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{isHe ? exerciseNameHe : exerciseNameEn}</h1>
        <p className="text-sm text-stone-400">{isHe ? exerciseNameEn : exerciseNameHe}</p>
        <p className="mt-2 text-stone-300 ltr-numbers">{t("workout.set_of", { current: setNumber, total: totalSets })}</p>
        <p className="text-xs uppercase tracking-wide text-stone-500 ltr-numbers">target reps: {repRange}</p>
      </div>

      <div className="space-y-1 text-center text-xs text-stone-500">
        {lastSessionLabel && <div>{t("workout.last_time")}: <span className="ltr-numbers">{lastSessionLabel}</span></div>}
        {bestLabel && <div>{t("workout.best")}: <span className="ltr-numbers">{bestLabel}</span></div>}
      </div>

      <div className="flex items-center justify-around gap-4">
        <WeightPicker value={weight} rack={rack} onChange={setWeight} label={t("workout.weight_kg")} />
        <RepsPicker value={reps} onChange={setReps} label={t("workout.reps")} />
      </div>

      <button
        type="button"
        onClick={() => onSetDone(weight, reps)}
        className="pulse-emerald min-h-[72px] w-full rounded-3xl bg-emerald-500 text-2xl font-bold text-stone-950 active:bg-emerald-400"
      >
        {t("workout.set_done")}
      </button>
    </div>
  );
}
