import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { ActivityDay } from '../../lib/types/activity';

interface Props {
  dailySummaries: ActivityDay[];
}

function formatDate(date: string): string {
  return new Date(date + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' });
}

interface TooltipPayload {
  payload?: ActivityDay & { dateLabel: string };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.[0]?.payload) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-tile border border-stroke rounded-lg p-3 shadow-lg">
      <div className="text-xs text-dim mb-1">{formatDate(d.date)}</div>
      <div className="text-sm font-medium text-heading">{d.activeCalories ?? 0} kcal</div>
      <div className="text-xs text-subtle">{d.exerciseMinutes ?? 0} min exercise</div>
    </div>
  );
}

export default function WeeklyActivityChart({ dailySummaries }: Props) {
  if (dailySummaries.length === 0) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-8 text-center">
        <div className="text-dim">No activity data for this period</div>
      </div>
    );
  }

  const data = dailySummaries.map((d) => ({
    ...d,
    dateLabel: formatDate(d.date),
    calories: d.activeCalories ?? 0,
  }));

  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      <div className="text-xs font-medium text-dim uppercase tracking-wide mb-4">Daily Active Calories</div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 5, right: 0, left: 5, bottom: 0 }}>
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
            unit=" kcal"
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-stroke)', opacity: 0.3 }} />
          <Bar dataKey="calories" fill="var(--color-activity-move)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
