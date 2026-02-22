import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { StephActivityDay } from '../../lib/types/steph-activity';

interface Props {
  dailyActivity: StephActivityDay[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function TrendTooltip({ active, payload }: { active?: boolean; payload?: { payload?: StephActivityDay }[] }) {
  if (!active || !payload?.[0]?.payload) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-tile border border-stroke rounded-lg p-3 shadow-lg">
      <div className="text-xs text-dim mb-1">{formatDate(d.date)}</div>
      <div className="text-sm text-heading">{d.activeCalories ?? 0} kcal</div>
      <div className="text-sm text-heading">{d.exerciseMinutes ?? 0} min</div>
    </div>
  );
}

export default function StephActivityTrends({ dailyActivity }: Props) {
  if (dailyActivity.length === 0) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-8 text-center">
        <div className="text-dim">No activity trend data</div>
      </div>
    );
  }

  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      <div className="text-xs font-medium text-dim uppercase tracking-wide mb-4">Activity Trends</div>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={dailyActivity} margin={{ top: 5, right: 0, left: 5, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
          />
          <YAxis
            yAxisId="cal"
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
          />
          <YAxis
            yAxisId="min"
            orientation="right"
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
          />
          <Tooltip content={<TrendTooltip />} />
          <Line
            yAxisId="cal"
            dataKey="activeCalories"
            type="monotone"
            stroke="var(--color-steph-calories)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            yAxisId="min"
            dataKey="exerciseMinutes"
            type="monotone"
            stroke="var(--color-steph-exercise)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Legend
            content={() => (
              <div className="flex justify-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-subtle">
                  <span className="size-2.5 rounded-sm" style={{ background: 'var(--color-steph-calories)' }} />
                  Calories
                </div>
                <div className="flex items-center gap-1.5 text-xs text-subtle">
                  <span className="size-2.5 rounded-sm" style={{ background: 'var(--color-steph-exercise)' }} />
                  Exercise
                </div>
              </div>
            )}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
