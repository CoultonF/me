import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { StephHeartRateDay, StephSleepSession } from '../../lib/types/steph-activity';

interface Props {
  heartRate: StephHeartRateDay[];
  sleep: StephSleepSession[];
}

interface RecoveryDay {
  date: string;
  score: number;
  rhrScore: number;
  hrvScore: number;
  sleepScore: number;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'var(--color-steph-hrv)';
  if (score >= 40) return 'var(--color-steph-acute)';
  return 'var(--color-steph-rhr)';
}

function getScoreLabel(score: number): string {
  if (score >= 70) return 'Good';
  if (score >= 40) return 'Moderate';
  return 'Low';
}

function RecoveryTooltip({ active, payload }: { active?: boolean; payload?: { payload?: RecoveryDay }[] }) {
  if (!active || !payload?.[0]?.payload) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-tile border border-stroke rounded-lg p-3 shadow-lg">
      <div className="text-xs text-dim mb-1">{formatDate(d.date)}</div>
      <div className="text-sm font-semibold mb-1" style={{ color: getScoreColor(d.score) }}>
        Score: {d.score}
      </div>
      <div className="text-xs text-subtle">RHR: {d.rhrScore}</div>
      <div className="text-xs text-subtle">HRV: {d.hrvScore}</div>
      <div className="text-xs text-subtle">Sleep: {d.sleepScore}</div>
    </div>
  );
}

export default function RecoveryReadiness({ heartRate, sleep }: Props) {
  const recoveryData = useMemo(() => {
    // Build maps
    const hrMap = new Map<string, StephHeartRateDay>();
    for (const d of heartRate) hrMap.set(d.date, d);

    const sleepMap = new Map<string, StephSleepSession>();
    for (const s of sleep) sleepMap.set(s.date, s);

    // Collect dates with at least some data
    const allDates = new Set<string>();
    heartRate.forEach((d) => allDates.add(d.date));
    sleep.forEach((s) => allDates.add(s.date));

    const sortedDates = [...allDates].sort();
    if (sortedDates.length < 7) return [];

    // Collect raw values for percentile computation
    const rhrValues = heartRate.filter((d) => d.restingHR != null).map((d) => d.restingHR!);
    const hrvValues = heartRate.filter((d) => d.hrv != null).map((d) => d.hrv!);
    const sleepValues = sleep.filter((s) => s.totalMinutes != null).map((s) => s.totalMinutes!);

    if (rhrValues.length === 0 && hrvValues.length === 0 && sleepValues.length === 0) return [];

    // Percentile function
    function percentile(value: number, values: number[]): number {
      if (values.length === 0) return 50;
      const sorted = [...values].sort((a, b) => a - b);
      const idx = sorted.findIndex((v) => v >= value);
      if (idx === -1) return 100;
      return Math.round((idx / sorted.length) * 100);
    }

    const result: RecoveryDay[] = [];
    for (const date of sortedDates) {
      const hr = hrMap.get(date);
      const sl = sleepMap.get(date);

      // RHR: lower is better, so invert the percentile
      const rhrPct = hr?.restingHR != null ? 100 - percentile(hr.restingHR, rhrValues) : 50;
      // HRV: higher is better
      const hrvPct = hr?.hrv != null ? percentile(hr.hrv, hrvValues) : 50;
      // Sleep: more is better
      const sleepPct = sl?.totalMinutes != null ? percentile(sl.totalMinutes, sleepValues) : 50;

      const score = Math.round(hrvPct * 0.4 + rhrPct * 0.3 + sleepPct * 0.3);

      result.push({
        date,
        score,
        rhrScore: rhrPct,
        hrvScore: hrvPct,
        sleepScore: sleepPct,
      });
    }

    return result;
  }, [heartRate, sleep]);

  if (recoveryData.length < 7) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-8 text-center">
        <div className="text-dim">Not enough data for recovery readiness (need 7+ days)</div>
      </div>
    );
  }

  const latest = recoveryData[recoveryData.length - 1]!;

  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-medium text-dim uppercase tracking-wide">Recovery Readiness</div>
        <div className="flex items-center gap-2">
          <div
            className="text-2xl font-bold"
            style={{ color: getScoreColor(latest.score) }}
          >
            {latest.score}
          </div>
          <div
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              color: getScoreColor(latest.score),
              background: getScoreColor(latest.score) + '20',
            }}
          >
            {getScoreLabel(latest.score)}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={recoveryData} margin={{ top: 5, right: 0, left: 5, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
          />
          <Tooltip content={<RecoveryTooltip />} />
          <Line
            dataKey="score"
            type="monotone"
            stroke="var(--color-steph-hrv)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="flex justify-center gap-4 mt-2 text-[10px] text-dim">
        <span>Score = HRV (40%) + RHR inverted (30%) + Sleep (30%)</span>
      </div>
    </div>
  );
}
