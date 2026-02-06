import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';
import type { GlucoseReading } from '../../lib/types/glucose';

interface Props {
  readings: GlucoseReading[];
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getValueColor(value: number): string {
  if (value < 4) return 'var(--color-glucose-low)';
  if (value <= 10) return 'var(--color-glucose-normal)';
  return 'var(--color-glucose-high)';
}

interface DotProps {
  cx?: number;
  cy?: number;
}

function ThemeDot({ cx, cy }: DotProps) {
  if (cx == null || cy == null) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={3.5}
      fill="var(--color-chart-dot)"
      stroke="none"
    />
  );
}

interface TooltipPayload {
  payload?: { timestamp: string; value: number; ts: number };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.[0]?.payload) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-tile border border-stroke rounded-lg p-3 shadow-lg">
      <div className="text-xs text-dim mb-1">{formatDate(data.timestamp)}</div>
      <div className="text-lg font-semibold" style={{ color: getValueColor(data.value) }}>
        {data.value.toFixed(1)} mmol/L
      </div>
    </div>
  );
}

export default function GlucoseTimeSeries({ readings }: Props) {
  if (readings.length === 0) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-8 text-center">
        <div className="text-dim">No glucose data for this period</div>
      </div>
    );
  }

  const data = readings.map((r) => ({
    ...r,
    ts: new Date(r.timestamp).getTime(),
    time: formatTime(r.timestamp),
  }));

  const values = readings.map((r) => r.value);
  const yMin = 0;
  const yMax = Math.max(14, Math.ceil(Math.max(...values) + 1));

  const tsMin = data[0]!.ts;
  const tsMax = data[data.length - 1]!.ts;

  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      <div className="text-xs font-medium text-dim uppercase tracking-wide mb-4">Glucose Over Time</div>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 5, right: 0, left: 5, bottom: 0 }}>
          {/* Low zone — muted pink */}
          <ReferenceArea
            y1={yMin}
            y2={3.85}
            x1={tsMin}
            x2={tsMax}
            fill="var(--color-glucose-zone-low)"
            fillOpacity={0.18}
          />
          {/* Normal zone — muted olive */}
          <ReferenceArea
            y1={4.15}
            y2={9.85}
            x1={tsMin}
            x2={tsMax}
            fill="var(--color-glucose-zone-normal)"
            fillOpacity={0.18}
          />
          {/* High zone — muted beige-yellow */}
          <ReferenceArea
            y1={10.15}
            y2={yMax}
            x1={tsMin}
            x2={tsMax}
            fill="var(--color-glucose-zone-high)"
            fillOpacity={0.18}
          />
          <XAxis
            dataKey="ts"
            type="number"
            domain={[tsMin, tsMax]}
            tickFormatter={(ts: number) => formatTime(new Date(ts).toISOString())}
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
          />
          <YAxis
            dataKey="value"
            type="number"
            domain={[yMin, yMax]}
            orientation="right"
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
            unit=" "
          />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Scatter
            data={data}
            shape={<ThemeDot />}
            isAnimationActive={false}
          />
        </ScatterChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 mt-3">
        <div className="flex items-center gap-1.5 text-xs text-subtle">
          <span className="size-2.5 rounded-full bg-glucose-low" />
          Low (&lt;4)
        </div>
        <div className="flex items-center gap-1.5 text-xs text-subtle">
          <span className="size-2.5 rounded-full bg-glucose-normal" />
          In Range (4–10)
        </div>
        <div className="flex items-center gap-1.5 text-xs text-subtle">
          <span className="size-2.5 rounded-full bg-glucose-high" />
          High (&gt;10)
        </div>
      </div>
    </div>
  );
}
