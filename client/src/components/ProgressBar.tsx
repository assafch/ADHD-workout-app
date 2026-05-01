interface Props {
  done: number;
  total: number;
  label?: string;
}

export function ProgressBar({ done, total, label }: Props) {
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  return (
    <div className="w-full">
      {label && <div className="mb-1 flex justify-between text-xs text-stone-400"><span>{label}</span><span className="ltr-numbers">{done}/{total}</span></div>}
      <div className="h-2 w-full overflow-hidden rounded-full bg-stone-800">
        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
