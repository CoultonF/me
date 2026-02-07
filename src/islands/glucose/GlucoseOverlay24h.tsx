import { useState, useEffect } from 'react';
import {
  ComposedChart,
  Scatter,
  Bar,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';
import type { GlucoseReading } from '../../lib/types/glucose';
import type { InsulinDose, InsulinAPIResponse } from '../../lib/types/insulin';

interface Props {
  readings: GlucoseReading[];
}

interface MergedBucket {
  ts: number;
  glucose: number | null;
  bolus: number | null;
  basal: number | null;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getValueColor(value: number): string {
  if (value < 4) return 'var(--color-glucose-low)';
  if (value <= 10) return 'var(--color-glucose-normal)';
  return 'var(--color-glucose-high)';
}

const BUCKET_MS = 5 * 60 * 1000; // 5-minute buckets

function mergeToBuckets(readings: GlucoseReading[], doses: InsulinDose[]): MergedBucket[] {
  const buckets = new Map<number, MergedBucket>();

  for (const r of readings) {
    const ts = Math.floor(new Date(r.timestamp).getTime() / BUCKET_MS) * BUCKET_MS;
    const existing = buckets.get(ts);
    if (existing) {
      existing.glucose = r.value;
    } else {
      buckets.set(ts, { ts, glucose: r.value, bolus: null, basal: null });
    }
  }

  for (const d of doses) {
    const ts = Math.floor(new Date(d.timestamp).getTime() / BUCKET_MS) * BUCKET_MS;
    const existing = buckets.get(ts) ?? { ts, glucose: null, bolus: null, basal: null };
    if (d.type === 'bolus') {
      existing.bolus = (existing.bolus ?? 0) + d.units;
    } else {
      existing.basal = d.units;
    }
    buckets.set(ts, existing);
  }

  return Array.from(buckets.values()).sort((a, b) => a.ts - b.ts);
}

function OverlayTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload?: MergedBucket }> }) {
  if (!active || !payload?.[0]?.payload) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-tile border border-stroke rounded-lg p-3 shadow-lg">
      <div className="text-xs text-dim mb-1">{formatTime(d.ts)}</div>
      {d.glucose != null && (
        <div className="text-sm font-semibold" style={{ color: getValueColor(d.glucose) }}>
          {d.glucose.toFixed(1)} mmol/L
        </div>
      )}
      {d.bolus != null && d.bolus > 0 && (
        <div className="text-xs text-subtle">Bolus: {d.bolus.toFixed(1)} U</div>
      )}
      {d.basal != null && (
        <div className="text-xs text-subtle">Basal: {d.basal.toFixed(2)} U/hr</div>
      )}
    </div>
  );
}

export default function GlucoseOverlay24h({ readings }: Props) {
  const [doses, setDoses] = useState<InsulinDose[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/health/insulin?range=24h')
      .then((r) => r.json() as Promise<InsulinAPIResponse>)
      .then((d) => { setDoses(d.doses); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
        <div className="skeleton" style={{ height: 300 }} />
      </div>
    );
  }

  if (readings.length === 0 && doses.length === 0) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-8 text-center">
        <div className="text-dim">No overlay data available</div>
      </div>
    );
  }

  const data = mergeToBuckets(readings, doses);

  const glucoseValues = data.filter((d) => d.glucose != null).map((d) => d.glucose!);
  const yGlucoseMin = 0;
  const yGlucoseMax = glucoseValues.length > 0 ? Math.max(14, Math.ceil(Math.max(...glucoseValues) + 1)) : 14;

  const bolusValues = data.filter((d) => d.bolus != null && d.bolus > 0).map((d) => d.bolus!);
  const yInsulinMax = bolusValues.length > 0 ? Math.ceil(Math.max(...bolusValues) + 1) : 5;

  const tsMin = data[0]?.ts ?? 0;
  const tsMax = data[data.length - 1]?.ts ?? 0;

  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      <div className="text-xs font-medium text-dim uppercase tracking-wide mb-4">Glucose + Insulin Overlay (24h)</div>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
          {/* Zone bands */}
          <ReferenceArea y1={0} y2={3.85} x1={tsMin} x2={tsMax} fill="var(--color-glucose-zone-low)" fillOpacity={0.18} yAxisId="glucose" />
          <ReferenceArea y1={4.15} y2={9.85} x1={tsMin} x2={tsMax} fill="var(--color-glucose-zone-normal)" fillOpacity={0.18} yAxisId="glucose" />
          <ReferenceArea y1={10.15} y2={yGlucoseMax} x1={tsMin} x2={tsMax} fill="var(--color-glucose-zone-high)" fillOpacity={0.18} yAxisId="glucose" />

          <XAxis
            dataKey="ts"
            type="number"
            domain={[tsMin, tsMax]}
            tickFormatter={formatTime}
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
          />
          <YAxis
            yAxisId="glucose"
            domain={[yGlucoseMin, yGlucoseMax]}
            orientation="left"
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
            label={{ value: 'mmol/L', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: 'var(--color-dim)' } }}
          />
          <YAxis
            yAxisId="insulin"
            domain={[0, yInsulinMax]}
            orientation="right"
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
            label={{ value: 'Units', angle: 90, position: 'insideRight', style: { fontSize: 10, fill: 'var(--color-dim)' } }}
          />

          <Tooltip content={<OverlayTooltip />} />

          {/* Basal area */}
          <Area
            yAxisId="insulin"
            dataKey="basal"
            stroke="var(--color-insulin-basal)"
            fill="var(--color-insulin-basal)"
            fillOpacity={0.15}
            strokeWidth={1}
            type="stepAfter"
            isAnimationActive={false}
            connectNulls={false}
          />

          {/* Bolus bars */}
          <Bar
            yAxisId="insulin"
            dataKey="bolus"
            fill="var(--color-insulin-bolus)"
            fillOpacity={0.7}
            barSize={4}
            isAnimationActive={false}
          />

          {/* Glucose scatter */}
          <Scatter
            yAxisId="glucose"
            dataKey="glucose"
            fill="var(--color-chart-dot)"
            r={1.5}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-3">
        <div className="flex items-center gap-1.5 text-xs text-subtle">
          <span className="size-2.5 rounded-full" style={{ background: 'var(--color-chart-dot)' }} />
          Glucose
        </div>
        <div className="flex items-center gap-1.5 text-xs text-subtle">
          <span className="size-2.5 rounded-sm" style={{ background: 'var(--color-insulin-bolus)', opacity: 0.7 }} />
          Bolus
        </div>
        <div className="flex items-center gap-1.5 text-xs text-subtle">
          <span className="size-2.5 rounded-sm" style={{ background: 'var(--color-insulin-basal)', opacity: 0.3 }} />
          Basal
        </div>
      </div>
    </div>
  );
}
