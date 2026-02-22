type Range = string;

interface Props {
  selected: Range;
  onChange: (range: Range) => void;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 2023 }, (_, i) => currentYear - i);

const durations: { value: Range; label: string }[] = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: '365d', label: '1y' },
];

const isYear = (v: string) => /^\d{4}$/.test(v);

export default function DateRangePicker({ selected, onChange }: Props) {
  return (
    <div className="flex gap-1 rounded-lg bg-page border border-stroke p-1">
      {durations.map((r) => (
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
      <div className="relative">
        <select
          value={isYear(selected) ? selected : ''}
          onChange={(e) => {
            if (e.target.value) onChange(e.target.value);
          }}
          className={`appearance-none px-3 pr-6 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer border-0 outline-none ${
            isYear(selected)
              ? 'bg-accent text-white'
              : 'bg-transparent text-subtle hover:text-body'
          }`}
        >
          <option value="" disabled hidden>
            Year
          </option>
          {years.map((y) => (
            <option key={y} value={String(y)} className="bg-page text-body">
              {y}
            </option>
          ))}
        </select>
        <svg
          className={`pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 size-3 ${
            isYear(selected) ? 'text-white' : 'text-subtle'
          }`}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M3 5l3 3 3-3" />
        </svg>
      </div>
    </div>
  );
}
