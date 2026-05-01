import { nextInRack, prevInRack } from "../lib/rack";

interface Props {
  value: number;
  rack: number[];
  onChange: (value: number) => void;
  label?: string;
}

export function WeightPicker({ value, rack, onChange, label }: Props) {
  const inc = () => onChange(nextInRack(value, rack));
  const dec = () => onChange(prevInRack(value, rack));

  return (
    <div className="flex flex-col items-center gap-2">
      {label && <span className="text-sm text-stone-400">{label}</span>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={dec}
          aria-label="decrease weight"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-800 text-3xl text-stone-100 active:bg-stone-700"
        >
          −
        </button>
        <div className="ltr-numbers min-w-[140px] text-center">
          <div className="text-big font-bold tabular-nums">{value}</div>
          <div className="text-xs text-stone-400">kg</div>
        </div>
        <button
          type="button"
          onClick={inc}
          aria-label="increase weight"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-800 text-3xl text-stone-100 active:bg-stone-700"
        >
          +
        </button>
      </div>
    </div>
  );
}
