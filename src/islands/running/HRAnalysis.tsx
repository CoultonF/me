import {
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { HRZoneDistribution, PaceHRPoint, Workout } from '../../lib/types/activity';

interface Props {
  hrZones: HRZoneDistribution;
  paceHRCorrelation: PaceHRPoint[];
  workouts: Workout[];
}

const ZONE_COLORS = [
  'var(--color-running-hr-zone1)',
  'var(--color-running-hr-zone2)',
  'var(--color-running-hr-zone3)',
  'var(--color-running-hr-zone4)',
  'var(--color-running-hr-zone5)',
];

const ZONE_LABELS = ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5'];
const ZONE_RANGES = ['<60%', '60-70%', '70-80%', '80-90%', '90%+'];

function formatPace(secPerKm: number): string {
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ── HR Zone Bar ──

function HRZoneBar({ hrZones }: { hrZones: HRZoneDistribution }) {
  const zones = [
    { name: 'Zone 1', value: hrZones.zone1, range: ZONE_RANGES[0] },
    { name: 'Zone 2', value: hrZones.zone2, range: ZONE_RANGES[1] },
    { name: 'Zone 3', value: hrZones.zone3, range: ZONE_RANGES[2] },
    { name: 'Zone 4', value: hrZones.zone4, range: ZONE_RANGES[3] },
    { name: 'Zone 5', value: hrZones.zone5, range: ZONE_RANGES[4] },
  ];

  const total = zones.reduce((s, z) => s + z.value, 0);
  if (total === 0) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-6 text-center">
        <div className="text-dim">No heart rate zone data</div>
      </div>
    );
  }

  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      <div className="text-xs font-medium text-dim uppercase tracking-wide mb-4">HR Zone Distribution</div>

      {/* Stacked horizontal bar */}
      <div className="flex rounded-md overflow-hidden h-8 mb-4">
        {zones.map((z, i) => z.value > 0 && (
          <div
            key={i}
            className="flex items-center justify-center text-[10px] font-medium text-white"
            style={{ width: `${z.value}%`, background: ZONE_COLORS[i], minWidth: z.value > 3 ? undefined : 0 }}
          >
            {z.value >= 8 && `${z.value}%`}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-5 gap-2">
        {zones.map((z, i) => (
          <div key={i} className="text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <span className="size-2 rounded-full" style={{ background: ZONE_COLORS[i] }} />
              <span className="text-[10px] text-dim">{ZONE_LABELS[i]}</span>
            </div>
            <div className="text-xs font-medium text-body">{z.value}%</div>
            <div className="text-[10px] text-dim">{z.range}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Pace vs HR Scatter ──

interface ScatterTooltipPayload {
  payload?: PaceHRPoint;
}

function PaceHRTooltip({ active, payload }: { active?: boolean; payload?: ScatterTooltipPayload[] }) {
  if (!active || !payload?.[0]?.payload) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-tile border border-stroke rounded-lg p-3 shadow-lg">
      <div className="text-xs text-dim mb-1">{formatDate(d.startTime)}</div>
      <div className="text-sm text-heading">Pace: {formatPace(d.avgPaceSecPerKm)} /km</div>
      <div className="text-sm text-heading">HR: {d.avgHeartRate} bpm</div>
      <div className="text-xs text-subtle">{d.distanceKm.toFixed(1)} km</div>
    </div>
  );
}

function PaceHRScatter({ paceHRCorrelation }: { paceHRCorrelation: PaceHRPoint[] }) {
  if (paceHRCorrelation.length < 2) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-6 text-center">
        <div className="text-dim">Not enough data for pace vs HR</div>
      </div>
    );
  }

  const data = paceHRCorrelation
    .filter((p) => p.avgHeartRate >= 130 && p.avgHeartRate <= 190)
    .map((p) => ({
      ...p,
      paceMin: p.avgPaceSecPerKm / 60,
    }));

  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      <div className="text-xs font-medium text-dim uppercase tracking-wide mb-4">Pace vs Heart Rate</div>
      <ResponsiveContainer width="100%" height={250}>
        <ScatterChart margin={{ top: 5, right: 10, left: 5, bottom: 0 }}>
          <XAxis
            dataKey="avgHeartRate"
            type="number"
            domain={[130, 190]}
            name="HR"
            unit=" bpm"
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
          />
          <YAxis
            dataKey="avgPaceSecPerKm"
            type="number"
            reversed
            tickFormatter={(v: number) => formatPace(v)}
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
          />
          <Tooltip content={<PaceHRTooltip />} />
          <Scatter data={data} fill="var(--color-running-hr)" fillOpacity={0.7} isAnimationActive={false} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Aerobic Efficiency Trend ──

function EfficiencyTrend({ workouts }: { workouts: Workout[] }) {
  const data = workouts
    .filter((w) => w.avgHeartRate && w.avgHeartRate >= 130 && w.avgHeartRate <= 190 && w.avgPaceSecPerKm && w.avgPaceSecPerKm > 0)
    .map((w) => ({
      ts: new Date(w.startTime).getTime(),
      efficiency: Math.round(((w.avgPaceSecPerKm! / 60) / w.avgHeartRate!) * 1000) / 10,
    }))
    .sort((a, b) => a.ts - b.ts);

  if (data.length < 2) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-6 text-center">
        <div className="text-dim">Not enough data for efficiency trend</div>
      </div>
    );
  }

  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-medium text-dim uppercase tracking-wide">Aerobic Efficiency</div>
        <div className="text-xs text-dim">pace/HR ratio (lower = better)</div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 0, left: 5, bottom: 0 }}>
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
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
            reversed
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const d = payload[0].payload as { ts: number; efficiency: number };
              return (
                <div className="bg-tile border border-stroke rounded-lg p-3 shadow-lg">
                  <div className="text-xs text-dim mb-1">{formatDate(new Date(d.ts).toISOString())}</div>
                  <div className="text-sm font-semibold text-heading">{d.efficiency}</div>
                </div>
              );
            }}
          />
          <Line
            dataKey="efficiency"
            stroke="var(--color-running-hr)"
            strokeWidth={2}
            dot={{ fill: 'var(--color-running-hr)', r: 3 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Main ──

export default function HRAnalysis({ hrZones, paceHRCorrelation, workouts }: Props) {
  return (
    <div className="space-y-4">
      <div className="text-xs font-medium text-dim uppercase tracking-wide">Heart Rate Analysis</div>
      <HRZoneBar hrZones={hrZones} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PaceHRScatter paceHRCorrelation={paceHRCorrelation} />
        <EfficiencyTrend workouts={workouts} />
      </div>
    </div>
  );
}
