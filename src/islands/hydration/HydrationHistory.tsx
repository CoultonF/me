import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { HydrationDayTotal } from '../../lib/types/hydration';

interface Props {
  dailyTotals: HydrationDayTotal[];
  goalMl: number;
}

function formatDate(date: string): string {
  return new Date(date + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' });
}

interface TooltipPayload {
  payload?: HydrationDayTotal & { dateLabel: string };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.[0]?.payload) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-tile border border-stroke rounded-lg p-3 shadow-lg">
      <div className="text-xs text-dim mb-1">{formatDate(d.date)}</div>
      <div className="text-sm font-medium text-heading">{d.totalMl} mL</div>
      <div className="text-xs text-subtle">{d.entryCount} entries</div>
    </div>
  );
}

export default function HydrationHistory({ dailyTotals, goalMl }: Props) {
  if (dailyTotals.length === 0) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-8 text-center">
        <div className="text-dim">No hydration data yet</div>
      </div>
    );
  }

  const data = dailyTotals.map((d) => ({
    ...d,
    dateLabel: formatDate(d.date),
  }));

  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      <div className="text-xs font-medium text-dim uppercase tracking-wide mb-4">90-Day Hydration</div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 0, left: 5, bottom: 0 }}>
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
            unit=" mL"
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-stroke)', opacity: 0.3 }} />
          <ReferenceLine y={goalMl} stroke="var(--color-hydration-goal)" strokeDasharray="4 4" strokeWidth={1.5} />
          <Bar dataKey="totalMl" fill="var(--color-hydration)" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
