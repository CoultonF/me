import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { GlucoseStats } from '../../lib/types/glucose';

interface Props {
  stats: GlucoseStats;
}

const SEGMENTS = [
  { key: 'veryHigh' as const, label: 'Very High', color: 'var(--color-glucose-very-high)' },
  { key: 'high' as const, label: 'High', color: 'var(--color-glucose-high)' },
  { key: 'normal' as const, label: 'In Range', color: 'var(--color-glucose-normal)' },
  { key: 'low' as const, label: 'Low', color: 'var(--color-glucose-low)' },
];

export default function TimeInRangeDonut({ stats }: Props) {
  const { timeInRange } = stats;

  const data = SEGMENTS.map((s) => ({
    name: s.label,
    value: timeInRange[s.key],
    color: s.color,
  })).filter((d) => d.value > 0);

  // If no data, show empty state
  if (data.length === 0) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-6">
        <div className="text-xs font-medium text-dim uppercase tracking-wide mb-3">Time in Range</div>
        <div className="text-dim text-center py-8">No data</div>
      </div>
    );
  }

  return (
    <div className="bg-tile border border-stroke rounded-lg p-6">
      <div className="text-xs font-medium text-dim uppercase tracking-wide mb-3">Time in Range</div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="none" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-3xl font-bold text-heading">{timeInRange.normal}%</div>
            <div className="text-xs text-dim">in range</div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
        {SEGMENTS.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5 text-xs text-subtle">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label} {timeInRange[s.key]}%
          </div>
        ))}
      </div>
    </div>
  );
}
