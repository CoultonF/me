import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { WeeklyDistance } from '../../lib/types/activity';

interface Props {
  weeklyDistances: WeeklyDistance[];
}

function formatWeek(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' });
}

interface DistanceTooltipPayload {
  payload?: WeeklyDistance;
}

function DistanceTooltip({ active, payload }: { active?: boolean; payload?: DistanceTooltipPayload[] }) {
  if (!active || !payload?.[0]?.payload) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-tile border border-stroke rounded-lg p-3 shadow-lg">
      <div className="text-xs text-dim mb-1">Week of {formatWeek(d.weekStart)}</div>
      <div className="text-sm font-semibold text-heading">{d.totalDistanceKm.toFixed(1)} km</div>
      <div className="text-xs text-subtle">
        {d.runCount} workout{d.runCount !== 1 ? 's' : ''}
      </div>
      {d.runningDistanceKm > 0 && (
        <div className="text-xs text-subtle">Running: {d.runningDistanceKm.toFixed(1)} km</div>
      )}
      {d.cyclingDistanceKm > 0 && (
        <div className="text-xs text-subtle">Cycling: {d.cyclingDistanceKm.toFixed(1)} km</div>
      )}
    </div>
  );
}

export default function DistanceVolume({ weeklyDistances }: Props) {
  if (weeklyDistances.length === 0) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-8 text-center">
        <div className="text-dim">No distance data available</div>
      </div>
    );
  }

  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      <div className="text-xs font-medium text-dim uppercase tracking-wide mb-4">Weekly Distance</div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={weeklyDistances} margin={{ top: 5, right: 0, left: 5, bottom: 0 }}>
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
          <Tooltip content={<DistanceTooltip />} cursor={{ fill: 'var(--color-stroke)', fillOpacity: 0.3 }} />
          <Bar dataKey="runningDistanceKm" stackId="distance" fill="var(--color-running-distance)" radius={[0, 0, 0, 0]} isAnimationActive={false} />
          <Bar dataKey="cyclingDistanceKm" stackId="distance" fill="var(--color-running-cycling)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          <Legend
            content={() => (
              <div className="flex justify-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-subtle">
                  <span className="size-2.5 rounded-sm" style={{ background: 'var(--color-running-distance)' }} />
                  Running
                </div>
                <div className="flex items-center gap-1.5 text-xs text-subtle">
                  <span className="size-2.5 rounded-sm" style={{ background: 'var(--color-running-cycling)' }} />
                  Cycling
                </div>
              </div>
            )}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
