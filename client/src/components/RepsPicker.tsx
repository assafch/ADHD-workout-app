interface Props {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  max?: number;
}

export function RepsPicker({ value, onChange, label, max = 100 }: Props) {
  const dec = () => onChange(Math.max(0, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <div className="flex flex-col items-center gap-2">
      {label && <span className="text-sm text-text-mute">{label}</span>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={dec}
          aria-label="decrease reps"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-2 text-3xl text-text active:bg-line"
        >
          −
        </button>
        <div className="ltr-numbers min-w-[120px] text-center">
          <div className="text-big font-bold tabular-nums">{value}</div>
          <div className="text-xs text-text-mute">reps</div>
        </div>
        <button
          type="button"
          onClick={inc}
          aria-label="increase reps"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-2 text-3xl text-text active:bg-line"
        >
          +
        </button>
      </div>
    </div>
  );
}
