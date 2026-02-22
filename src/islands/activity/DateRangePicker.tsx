type Range = string;

interface Props {
  selected: Range;
  onChange: (range: Range) => void;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 2023 }, (_, i) => currentYear - i);

const ranges: { value: Range; label: string }[] = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: '365d', label: '1y' },
  ...years.map((y) => ({ value: String(y), label: String(y) })),
];

export default function DateRangePicker({ selected, onChange }: Props) {
  return (
    <div className="flex gap-1 rounded-lg bg-page border border-stroke p-1">
      {ranges.map((r) => (
        <button
          key={r.value}
          onClick={() => onChange(r.value)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            selected === r.value
              ? 'bg-accent text-white'
              : 'text-subtle hover:text-body'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
