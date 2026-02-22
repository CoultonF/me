import { PieChart, Pie, Tooltip, ResponsiveContainer } from 'recharts';
import type { WorkoutTypeBreakdown as WTB } from '../../lib/types/steph-activity';

interface Props {
  breakdown: WTB[];
}

const COLORS = [
  'var(--color-steph-workout)',
  'var(--color-steph-calories)',
  'var(--color-steph-exercise)',
  'var(--color-steph-hrv)',
  'var(--color-steph-acute)',
  'var(--color-steph-chronic)',
  'var(--color-steph-sleep)',
  'var(--color-steph-rhr)',
];

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function BreakdownTooltip({ active, payload }: { active?: boolean; payload?: { payload?: WTB & { fill: string } }[] }) {
  if (!active || !payload?.[0]?.payload) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-tile border border-stroke rounded-lg p-3 shadow-lg">
      <div className="text-sm font-semibold text-heading">{formatType(d.type)}</div>
      <div className="text-xs text-subtle">{formatDuration(d.totalDurationSeconds)}</div>
      <div className="text-xs text-subtle">{d.count} session{d.count !== 1 ? 's' : ''}</div>
    </div>
  );
}

export default function WorkoutTypeBreakdownChart({ breakdown }: Props) {
  if (breakdown.length === 0) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-8 text-center">
        <div className="text-dim">No workout type data</div>
      </div>
    );
  }

  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      <div className="text-xs font-medium text-dim uppercase tracking-wide mb-4">Workout Types</div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={breakdown.map((item, i) => ({ ...item, fill: COLORS[i % COLORS.length] }))}
            dataKey="totalDurationSeconds"
            nameKey="type"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            isAnimationActive={false}
          />
          <Tooltip content={<BreakdownTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {breakdown.map((item, i) => (
          <div key={item.type} className="flex items-center gap-1.5 text-xs text-subtle">
            <span className="size-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
            {formatType(item.type)}
          </div>
        ))}
      </div>
    </div>
  );
}
