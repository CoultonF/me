import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
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
      <div className="flex items-center gap-2 text-sm">
        <span className="size-2.5 rounded-full" style={{ backgroundColor: 'var(--color-activity-move)' }} />
        {d.activeCalories ?? 0} kcal
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="size-2.5 rounded-full" style={{ backgroundColor: 'var(--color-activity-exercise)' }} />
        {d.exerciseMinutes ?? 0} min
      </div>
    </div>
  );
}

export default function ActivityTrends({ dailySummaries }: Props) {
  if (dailySummaries.length === 0) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-8 text-center">
        <div className="text-dim">No activity trends for this period</div>
      </div>
    );
  }

  const data = dailySummaries.map((d) => ({
    ...d,
    dateLabel: formatDate(d.date),
    calories: d.activeCalories ?? 0,
    minutes: d.exerciseMinutes ?? 0,
  }));

  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      <div className="text-xs font-medium text-dim uppercase tracking-wide mb-4">Activity Trends</div>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ top: 5, right: 0, left: 5, bottom: 0 }}>
          <XAxis
            dataKey="dateLabel"
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
          <Tooltip content={<CustomTooltip />} />
          <Line
            yAxisId="cal"
            type="monotone"
            dataKey="calories"
            stroke="var(--color-activity-move)"
            strokeWidth={2}
            dot={false}
            name="Calories"
          />
          <Line
            yAxisId="min"
            type="monotone"
            dataKey="minutes"
            stroke="var(--color-activity-exercise)"
            strokeWidth={2}
            dot={false}
            name="Exercise"
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 mt-3">
        <div className="flex items-center gap-1.5 text-xs text-subtle">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: 'var(--color-activity-move)' }} />
          Active Calories
        </div>
        <div className="flex items-center gap-1.5 text-xs text-subtle">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: 'var(--color-activity-exercise)' }} />
          Exercise Minutes
        </div>
      </div>
    </div>
  );
}
