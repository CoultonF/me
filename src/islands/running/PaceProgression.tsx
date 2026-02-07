import {
  ComposedChart,
  Scatter,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { PaceDataPoint } from '../../lib/types/running';

interface Props {
  paceHistory: PaceDataPoint[];
}

function formatPace(secPerKm: number): string {
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function movingAverage(data: { ts: number; avgPaceSecPerKm: number }[], window: number) {
  return data.map((d, i) => {
    const start = Math.max(0, i - Math.floor(window / 2));
    const end = Math.min(data.length, i + Math.ceil(window / 2));
    const slice = data.slice(start, end);
    const avg = slice.reduce((s, p) => s + p.avgPaceSecPerKm, 0) / slice.length;
    return { ts: d.ts, trendPace: Math.round(avg) };
  });
}

interface PaceTooltipPayload {
  payload?: {
    startTime: string;
    avgPaceSecPerKm: number;
    distanceKm: number;
    activityName: string;
  };
}

function PaceTooltip({ active, payload }: { active?: boolean; payload?: PaceTooltipPayload[] }) {
  if (!active || !payload?.[0]?.payload) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-tile border border-stroke rounded-lg p-3 shadow-lg">
      <div className="text-xs text-dim mb-1">{formatDate(d.startTime)}</div>
      <div className="text-sm font-semibold text-heading">{formatPace(d.avgPaceSecPerKm)} /km</div>
      <div className="text-xs text-subtle">{d.distanceKm.toFixed(1)} km &middot; {d.activityName}</div>
    </div>
  );
}

export default function PaceProgression({ paceHistory }: Props) {
  if (paceHistory.length === 0) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-8 text-center">
        <div className="text-dim">No pace data available</div>
      </div>
    );
  }

  const data = paceHistory.map((p) => ({
    ...p,
    ts: new Date(p.startTime).getTime(),
    isRunning: p.activityName === 'Running',
  }));

  const trend = movingAverage(data, Math.min(5, data.length));
  const merged = data.map((d, i) => ({ ...d, trendPace: trend[i]?.trendPace }));

  const paces = data.map((d) => d.avgPaceSecPerKm);
  const yMin = Math.floor(Math.min(...paces) / 60) * 60 - 30;
  const yMax = Math.ceil(Math.max(...paces) / 60) * 60 + 30;

  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      <div className="text-xs font-medium text-dim uppercase tracking-wide mb-4">Pace Progression</div>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={merged} margin={{ top: 5, right: 0, left: 5, bottom: 0 }}>
          <XAxis
            dataKey="ts"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(ts: number) => formatDate(new Date(ts).toISOString())}
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
          />
          <YAxis
            domain={[yMin, yMax]}
            reversed
            tickFormatter={(v: number) => formatPace(v)}
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
          />
          <Tooltip content={<PaceTooltip />} />
          <Scatter
            dataKey="avgPaceSecPerKm"
            fill="var(--color-running-pace)"
            isAnimationActive={false}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            shape={((props: any) => {
              const { cx, cy, payload } = props;
              if (cx == null || cy == null) return <circle />;
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill={payload?.isRunning ? 'var(--color-running-pace)' : 'var(--color-running-cycling)'}
                  stroke="none"
                />
              );
            }) as any}
          />
          <Line
            dataKey="trendPace"
            stroke="var(--color-running-pace)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            strokeDasharray="6 3"
            connectNulls
          />
          <Legend
            content={() => (
              <div className="flex justify-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-subtle">
                  <span className="size-2.5 rounded-full" style={{ background: 'var(--color-running-pace)' }} />
                  Running
                </div>
                <div className="flex items-center gap-1.5 text-xs text-subtle">
                  <span className="size-2.5 rounded-full" style={{ background: 'var(--color-running-cycling)' }} />
                  Cycling
                </div>
                <div className="flex items-center gap-1.5 text-xs text-subtle">
                  <span className="w-4 h-0.5 rounded" style={{ background: 'var(--color-running-pace)', borderStyle: 'dashed' }} />
                  Trend
                </div>
              </div>
            )}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
