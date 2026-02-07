import {
  ScatterChart,
  Scatter,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';
import type { GlucoseReading } from '../../lib/types/glucose';

interface Props {
  readings: GlucoseReading[];
  range?: string;
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(ts: number): string {
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getValueColor(value: number): string {
  if (value < 4) return 'var(--color-glucose-low)';
  if (value <= 10) return 'var(--color-glucose-normal)';
  return 'var(--color-glucose-high)';
}

// ── Aggregation ──

interface AggBucket {
  ts: number;
  median: number;
  q1: number;
  q3: number;
  min: number;
  max: number;
  iqr: [number, number];
  p10p90: [number, number];
  count: number;
}

function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo]!;
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (idx - lo);
}

function getBucketMs(range: string): number {
  if (range === '7d') return 2 * 60 * 60 * 1000;    // 2-hour buckets
  if (range === '30d') return 6 * 60 * 60 * 1000;   // 6-hour buckets
  return 24 * 60 * 60 * 1000;                        // daily buckets (90d)
}

function aggregateReadings(readings: GlucoseReading[], range: string): AggBucket[] {
  const bucketMs = getBucketMs(range);
  const buckets = new Map<number, number[]>();

  for (const r of readings) {
    const ts = new Date(r.timestamp).getTime();
    const key = Math.floor(ts / bucketMs) * bucketMs;
    const arr = buckets.get(key);
    if (arr) {
      arr.push(r.value);
    } else {
      buckets.set(key, [r.value]);
    }
  }

  const result: AggBucket[] = [];
  for (const [ts, values] of Array.from(buckets.entries())) {
    values.sort((a, b) => a - b);
    const q1 = Math.round(percentile(values, 25) * 10) / 10;
    const q3 = Math.round(percentile(values, 75) * 10) / 10;
    const p10 = Math.round(percentile(values, 10) * 10) / 10;
    const p90 = Math.round(percentile(values, 90) * 10) / 10;
    result.push({
      ts,
      median: Math.round(percentile(values, 50) * 10) / 10,
      q1,
      q3,
      min: p10,
      max: p90,
      iqr: [q1, q3],
      p10p90: [p10, p90],
      count: values.length,
    });
  }

  return result.sort((a, b) => a.ts - b.ts);
}

// ── Scatter dot ──

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
      r={1.5}
      fill="var(--color-chart-dot)"
      stroke="none"
    />
  );
}

// ── Tooltips ──

interface ScatterTooltipPayload {
  payload?: { timestamp: string; value: number; ts: number };
}

function ScatterTooltip({ active, payload }: { active?: boolean; payload?: ScatterTooltipPayload[] }) {
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

interface AggTooltipPayload {
  payload?: AggBucket;
}

function AggTooltip({ active, payload, showBands = true }: { active?: boolean; payload?: AggTooltipPayload[]; showBands?: boolean }) {
  if (!active || !payload?.[0]?.payload) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-tile border border-stroke rounded-lg p-3 shadow-lg">
      <div className="text-xs text-dim mb-1">{formatDate(new Date(d.ts).toISOString())}</div>
      <div className="text-lg font-semibold" style={{ color: getValueColor(d.median) }}>
        {d.median.toFixed(1)} mmol/L
      </div>
      {showBands && (
        <div className="text-xs text-subtle mt-1">
          IQR: {d.q1.toFixed(1)} – {d.q3.toFixed(1)} &middot; P10–P90: {d.min.toFixed(1)} – {d.max.toFixed(1)}
        </div>
      )}
      <div className="text-xs text-dim">{d.count} readings</div>
    </div>
  );
}

// ── Glucose zone bands (shared) ──

function ZoneBands({ tsMin, tsMax, yMax }: { tsMin: number; tsMax: number; yMax: number }) {
  return (
    <>
      <ReferenceArea y1={0} y2={3.85} x1={tsMin} x2={tsMax} fill="var(--color-glucose-zone-low)" fillOpacity={0.18} />
      <ReferenceArea y1={4.15} y2={9.85} x1={tsMin} x2={tsMax} fill="var(--color-glucose-zone-normal)" fillOpacity={0.18} />
      <ReferenceArea y1={10.15} y2={yMax} x1={tsMin} x2={tsMax} fill="var(--color-glucose-zone-high)" fillOpacity={0.18} />
    </>
  );
}

// ── Legend ──

function ChartLegend() {
  return (
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
  );
}

// ── Main component ──

export default function GlucoseTimeSeries({ readings, range = '24h' }: Props) {
  if (readings.length === 0) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-8 text-center">
        <div className="text-dim">No glucose data for this period</div>
      </div>
    );
  }

  const useAggregated = range !== '24h';

  if (useAggregated) {
    return <AggregatedChart readings={readings} range={range} />;
  }

  return <ScatterDotChart readings={readings} />;
}

// ── Scatter (24h) ──

function ScatterDotChart({ readings }: { readings: GlucoseReading[] }) {
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
          <ZoneBands tsMin={tsMin} tsMax={tsMax} yMax={yMax} />
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
          <Tooltip content={<ScatterTooltip />} cursor={false} />
          <Scatter data={data} shape={<ThemeDot />} isAnimationActive={false} />
        </ScatterChart>
      </ResponsiveContainer>
      <ChartLegend />
    </div>
  );
}

// ── Aggregated charts (7d / 30d / 90d) ──

function AggregatedChart({ readings, range }: { readings: GlucoseReading[]; range: string }) {
  const data = aggregateReadings(readings, range);

  if (data.length === 0) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-8 text-center">
        <div className="text-dim">No glucose data for this period</div>
      </div>
    );
  }

  const allMax = Math.max(...data.map((d) => d.max));
  const yMin = 0;
  const yMax = Math.max(14, Math.ceil(allMax + 1));
  const tsMin = data[0]!.ts;
  const tsMax = data[data.length - 1]!.ts;

  const showDateAxis = range !== '7d';
  const xTickFormatter = showDateAxis
    ? (ts: number) => formatDateShort(ts)
    : (ts: number) => formatTime(new Date(ts).toISOString());

  const showBands = range === '30d' || range === '90d';
  const bucketLabel = range === '7d' ? '2-hour avg' : range === '30d' ? '6-hour avg' : 'daily avg';

  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-medium text-dim uppercase tracking-wide">Glucose Over Time</div>
        <div className="text-xs text-dim">{bucketLabel}</div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 5, right: 0, left: 5, bottom: 0 }}>
          <ZoneBands tsMin={tsMin} tsMax={tsMax} yMax={yMax} />
          <XAxis
            dataKey="ts"
            type="number"
            domain={[tsMin, tsMax]}
            tickFormatter={xTickFormatter}
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
          />
          <YAxis
            type="number"
            domain={[yMin, yMax]}
            orientation="right"
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
            unit=" "
          />
          <Tooltip content={(props: Record<string, unknown>) => <AggTooltip {...props as { active?: boolean; payload?: AggTooltipPayload[] }} showBands={showBands} />} />
          {showBands && (
            <>
              <Area
                dataKey="p10p90"
                stroke="none"
                fill="var(--color-chart-dot)"
                fillOpacity={0.07}
                isAnimationActive={false}
                type="natural"
              />
              <Area
                dataKey="iqr"
                stroke="none"
                fill="var(--color-chart-dot)"
                fillOpacity={0.13}
                isAnimationActive={false}
                type="natural"
              />
            </>
          )}
          <Line
            dataKey="median"
            stroke="var(--color-chart-dot)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            type="natural"
          />
        </ComposedChart>
      </ResponsiveContainer>
      {showBands ? (
        <div className="flex justify-center gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-xs text-subtle">
            <span className="size-4 rounded-sm" style={{ background: 'var(--color-chart-dot)', opacity: 0.12 }} />
            IQR (25–75%)
          </div>
          <div className="flex items-center gap-1.5 text-xs text-subtle">
            <span className="size-4 rounded-sm" style={{ background: 'var(--color-chart-dot)', opacity: 0.06 }} />
            P10–P90
          </div>
          <div className="flex items-center gap-1.5 text-xs text-subtle">
            <span className="w-4 h-0.5 rounded" style={{ background: 'var(--color-chart-dot)' }} />
            Median
          </div>
        </div>
      ) : (
        <ChartLegend />
      )}
    </div>
  );
}
