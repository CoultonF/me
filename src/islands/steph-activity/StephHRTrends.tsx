import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { StephHeartRateDay } from '../../lib/types/steph-activity';

interface Props {
  heartRate: StephHeartRateDay[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function RHRTooltip({ active, payload }: { active?: boolean; payload?: { payload?: StephHeartRateDay }[] }) {
  if (!active || !payload?.[0]?.payload) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-tile border border-stroke rounded-lg p-3 shadow-lg">
      <div className="text-xs text-dim mb-1">{formatDate(d.date)}</div>
      <div className="text-sm text-heading">Resting HR: {d.restingHR ?? '--'} bpm</div>
      {d.walkingHRAvg != null && (
        <div className="text-xs text-subtle">Walking HR: {d.walkingHRAvg} bpm</div>
      )}
    </div>
  );
}

function HRVTooltip({ active, payload }: { active?: boolean; payload?: { payload?: StephHeartRateDay }[] }) {
  if (!active || !payload?.[0]?.payload) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-tile border border-stroke rounded-lg p-3 shadow-lg">
      <div className="text-xs text-dim mb-1">{formatDate(d.date)}</div>
      <div className="text-sm text-heading">HRV: {d.hrv != null ? `${Math.round(d.hrv)} ms` : '--'}</div>
    </div>
  );
}

export default function StephHRTrends({ heartRate }: Props) {
  const rhrData = heartRate.filter((d) => d.restingHR != null);
  const hrvData = heartRate.filter((d) => d.hrv != null);

  if (rhrData.length === 0 && hrvData.length === 0) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-8 text-center">
        <div className="text-dim">No heart rate data available</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
        <div className="text-xs font-medium text-dim uppercase tracking-wide mb-4">Resting Heart Rate</div>
        {rhrData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={rhrData} margin={{ top: 5, right: 0, left: 5, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--color-stroke)' }}
              />
              <YAxis
                domain={['dataMin - 5', 'dataMax + 5']}
                tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--color-stroke)' }}
                unit=" bpm"
              />
              <Tooltip content={<RHRTooltip />} />
              <Line
                dataKey="restingHR"
                type="monotone"
                stroke="var(--color-steph-rhr)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-dim text-center py-8">No resting HR data</div>
        )}
      </div>

      <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
        <div className="text-xs font-medium text-dim uppercase tracking-wide mb-4">Heart Rate Variability</div>
        {hrvData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={hrvData} margin={{ top: 5, right: 0, left: 5, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--color-stroke)' }}
              />
              <YAxis
                domain={['dataMin - 5', 'dataMax + 5']}
                tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--color-stroke)' }}
                unit=" ms"
              />
              <Tooltip content={<HRVTooltip />} />
              <Line
                dataKey="hrv"
                type="monotone"
                stroke="var(--color-steph-hrv)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-dim text-center py-8">No HRV data</div>
        )}
      </div>
    </div>
  );
}
