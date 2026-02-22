import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { StephActivityDay } from '../../lib/types/steph-activity';

interface Props {
  dailyActivity: StephActivityDay[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function CaloriesTooltip({ active, payload }: { active?: boolean; payload?: { payload?: StephActivityDay }[] }) {
  if (!active || !payload?.[0]?.payload) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-tile border border-stroke rounded-lg p-3 shadow-lg">
      <div className="text-xs text-dim mb-1">{formatDate(d.date)}</div>
      <div className="text-sm font-semibold text-heading">{d.activeCalories ?? 0} kcal</div>
      {d.exerciseMinutes != null && (
        <div className="text-xs text-subtle">{d.exerciseMinutes} min exercise</div>
      )}
    </div>
  );
}

export default function StephDailyCaloriesChart({ dailyActivity }: Props) {
  if (dailyActivity.length === 0) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-8 text-center">
        <div className="text-dim">No activity data for this period</div>
      </div>
    );
  }

  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      <div className="text-xs font-medium text-dim uppercase tracking-wide mb-4">Daily Active Calories</div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={dailyActivity} margin={{ top: 5, right: 0, left: 5, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
          />
          <Tooltip content={<CaloriesTooltip />} cursor={{ fill: 'var(--color-stroke)', fillOpacity: 0.3 }} />
          <Bar dataKey="activeCalories" fill="var(--color-steph-calories)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
