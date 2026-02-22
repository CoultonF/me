import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { WeeklyWorkoutVolume } from '../../lib/types/steph-activity';

interface Props {
  weeklyVolume: WeeklyWorkoutVolume[];
}

function formatWeek(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function VolumeTooltip({ active, payload }: { active?: boolean; payload?: { payload?: WeeklyWorkoutVolume }[] }) {
  if (!active || !payload?.[0]?.payload) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-tile border border-stroke rounded-lg p-3 shadow-lg">
      <div className="text-xs text-dim mb-1">Week of {formatWeek(d.weekStart)}</div>
      <div className="text-sm font-semibold text-heading">{d.totalDistanceKm.toFixed(1)} km</div>
      <div className="text-xs text-subtle">{d.count} workout{d.count !== 1 ? 's' : ''}</div>
    </div>
  );
}

export default function StephWeeklyVolume({ weeklyVolume }: Props) {
  if (weeklyVolume.length === 0) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-8 text-center">
        <div className="text-dim">No weekly volume data</div>
      </div>
    );
  }

  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      <div className="text-xs font-medium text-dim uppercase tracking-wide mb-4">Weekly Distance</div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={weeklyVolume} margin={{ top: 5, right: 0, left: 5, bottom: 0 }}>
          <XAxis
            dataKey="weekStart"
            tickFormatter={formatWeek}
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
            unit=" km"
          />
          <Tooltip content={<VolumeTooltip />} cursor={{ fill: 'var(--color-stroke)', fillOpacity: 0.3 }} />
          <Bar dataKey="totalDistanceKm" fill="var(--color-steph-workout)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
