interface Props {
  onAdd: (amountMl: number) => void;
  disabled: boolean;
}

const PRESETS = [
  { label: 'Glass', ml: 250 },
  { label: 'Cup', ml: 350 },
  { label: 'Bottle', ml: 500 },
  { label: 'Large', ml: 750 },
] as const;

export default function HydrationQuickAdd({ onAdd, disabled }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {PRESETS.map((p) => (
        <button
          key={p.ml}
          onClick={() => onAdd(p.ml)}
          disabled={disabled}
          className="flex flex-col items-center gap-0.5 rounded-lg border border-stroke bg-tile px-3 py-2.5 text-center transition-all hover:border-[var(--color-hydration)] hover:bg-[var(--color-hydration-bg)] active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
        >
          <span className="text-sm font-medium text-heading">{p.ml} mL</span>
          <span className="text-[11px] text-dim">{p.label}</span>
        </button>
      ))}
    </div>
  );
}
