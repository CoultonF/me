import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { InsulinStats } from '../../lib/types/insulin';

interface Props {
  stats: InsulinStats;
}

const SEGMENTS = [
  { key: 'bolusPercent' as const, label: 'Bolus', color: 'var(--color-insulin-bolus)' },
  { key: 'basalPercent' as const, label: 'Basal', color: 'var(--color-insulin-basal)' },
];

export default function BasalBolusDonut({ stats }: Props) {
  const data = SEGMENTS.map((s) => ({
    name: s.label,
    value: stats[s.key],
    color: s.color,
  })).filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-6">
        <div className="text-xs font-medium text-dim uppercase tracking-wide mb-3">Basal / Bolus Split</div>
        <div className="text-dim text-center py-8">No data</div>
      </div>
    );
  }

  return (
    <div className="bg-tile border border-stroke rounded-lg p-6">
      <div className="text-xs font-medium text-dim uppercase tracking-wide mb-3">Basal / Bolus Split</div>
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
            <div className="text-3xl font-bold text-heading">{stats.avgDailyTotal}u</div>
            <div className="text-xs text-dim">avg daily</div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
        {SEGMENTS.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5 text-xs text-subtle">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label} {stats[s.key]}%
          </div>
        ))}
      </div>
    </div>
  );
}
