interface Props {
  month: string;
  onMonthChange: (month: string) => void;
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number) as [number, number];
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function MonthNavigator({ month, onMonthChange }: Props) {
  const isCurrentMonth = month === getCurrentMonth();

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onMonthChange(shiftMonth(month, -1))}
        className="p-1.5 rounded-md border border-stroke hover:bg-stroke-soft transition-colors text-subtle"
        aria-label="Previous month"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <span className="text-sm font-medium text-heading min-w-[140px] text-center">
        {formatMonthLabel(month)}
      </span>

      <button
        onClick={() => onMonthChange(shiftMonth(month, 1))}
        disabled={isCurrentMonth}
        className="p-1.5 rounded-md border border-stroke hover:bg-stroke-soft transition-colors text-subtle disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Next month"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
