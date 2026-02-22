import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { StephSleepSession, StephWorkout } from '../../lib/types/steph-activity';

interface Props {
  sleep: StephSleepSession[];
  workouts: StephWorkout[];
}

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ── Duration Distribution ──

interface DurationBucket {
  label: string;
  count: number;
}

function DurationDistribution({ sleep }: { sleep: StephSleepSession[] }) {
  const buckets = useMemo(() => {
    const b: DurationBucket[] = [
      { label: '<6.5h', count: 0 },
      { label: '6.5-7h', count: 0 },
      { label: '7-7.5h', count: 0 },
      { label: '7.5-8h', count: 0 },
      { label: '8-8.5h', count: 0 },
      { label: '8.5h+', count: 0 },
    ];
    for (const s of sleep) {
      const m = s.totalMinutes ?? 0;
      if (m < 390) b[0]!.count++;
      else if (m < 420) b[1]!.count++;
      else if (m < 450) b[2]!.count++;
      else if (m < 480) b[3]!.count++;
      else if (m < 510) b[4]!.count++;
      else b[5]!.count++;
    }
    return b;
  }, [sleep]);

  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      <div className="text-xs font-medium text-dim uppercase tracking-wide mb-4">Duration Distribution</div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={buckets} margin={{ top: 5, right: 0, left: 5, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
            allowDecimals={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const d = payload[0].payload as DurationBucket;
              return (
                <div className="bg-tile border border-stroke rounded-lg p-3 shadow-lg">
                  <div className="text-sm font-semibold text-heading">{d.count} nights</div>
                  <div className="text-xs text-dim">{d.label}</div>
                </div>
              );
            }}
            cursor={{ fill: 'var(--color-stroke)', fillOpacity: 0.3 }}
          />
          <Bar dataKey="count" fill="var(--color-steph-sleep)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Day of Week Pattern ──

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface DowData {
  day: string;
  avgTotal: number;
  avgDeep: number;
  avgRem: number;
  avgAwake: number;
  count: number;
}

function DayOfWeekPattern({ sleep }: { sleep: StephSleepSession[] }) {
  const dowData = useMemo(() => {
    const buckets: { total: number[]; deep: number[]; rem: number[]; awake: number[] }[] =
      Array.from({ length: 7 }, () => ({ total: [], deep: [], rem: [], awake: [] }));

    for (const s of sleep) {
      const dow = new Date(s.date + 'T12:00:00').getDay();
      buckets[dow]!.total.push(s.totalMinutes ?? 0);
      buckets[dow]!.deep.push(s.deepMinutes ?? 0);
      buckets[dow]!.rem.push(s.remMinutes ?? 0);
      buckets[dow]!.awake.push(s.awakeMinutes ?? 0);
    }

    const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

    return buckets.map((b, i) => ({
      day: DOW_LABELS[i]!,
      avgTotal: avg(b.total),
      avgDeep: avg(b.deep),
      avgRem: avg(b.rem),
      avgAwake: avg(b.awake),
      count: b.total.length,
    }));
  }, [sleep]);

  const overallAvg = Math.round(dowData.reduce((s, d) => s + d.avgTotal * d.count, 0) / dowData.reduce((s, d) => s + d.count, 0));

  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      <div className="text-xs font-medium text-dim uppercase tracking-wide mb-4">Sleep by Day of Week</div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={dowData} margin={{ top: 5, right: 0, left: 5, bottom: 0 }}>
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
          />
          <YAxis
            domain={[360, 480]}
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
            tickFormatter={(v: number) => `${Math.round(v / 60)}h`}
          />
          <ReferenceLine y={overallAvg} stroke="var(--color-dim)" strokeDasharray="4 3" strokeOpacity={0.5} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const d = payload[0].payload as DowData;
              return (
                <div className="bg-tile border border-stroke rounded-lg p-3 shadow-lg">
                  <div className="text-xs text-dim mb-1">{d.day} ({d.count} nights)</div>
                  <div className="text-sm font-semibold text-heading">{formatMinutes(d.avgTotal)}</div>
                  <div className="text-xs text-subtle">Deep: {formatMinutes(d.avgDeep)}</div>
                  <div className="text-xs text-subtle">REM: {formatMinutes(d.avgRem)}</div>
                  <div className="text-xs text-subtle">Awake: {formatMinutes(d.avgAwake)}</div>
                </div>
              );
            }}
            cursor={{ fill: 'var(--color-stroke)', fillOpacity: 0.3 }}
          />
          <Bar dataKey="avgTotal" fill="var(--color-steph-sleep)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Monthly Trend ──

interface MonthData {
  month: string;
  avgTotal: number;
  avgDeep: number;
  avgRem: number;
  avgAwake: number;
}

function MonthlyTrend({ sleep }: { sleep: StephSleepSession[] }) {
  const monthData = useMemo(() => {
    const buckets = new Map<string, { total: number[]; deep: number[]; rem: number[]; awake: number[] }>();

    for (const s of sleep) {
      const month = s.date.slice(0, 7);
      if (!buckets.has(month)) buckets.set(month, { total: [], deep: [], rem: [], awake: [] });
      const b = buckets.get(month)!;
      b.total.push(s.totalMinutes ?? 0);
      b.deep.push(s.deepMinutes ?? 0);
      b.rem.push(s.remMinutes ?? 0);
      b.awake.push(s.awakeMinutes ?? 0);
    }

    const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

    const result: MonthData[] = [];
    for (const [month, b] of [...buckets.entries()].sort()) {
      result.push({
        month: new Date(month + '-15').toLocaleDateString([], { month: 'short' }),
        avgTotal: avg(b.total),
        avgDeep: avg(b.deep),
        avgRem: avg(b.rem),
        avgAwake: avg(b.awake),
      });
    }
    return result;
  }, [sleep]);

  if (monthData.length < 2) return null;

  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      <div className="text-xs font-medium text-dim uppercase tracking-wide mb-4">Monthly Sleep Trend</div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={monthData} margin={{ top: 5, right: 10, left: 5, bottom: 0 }}>
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
          />
          <YAxis
            domain={[360, 500]}
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
            tickFormatter={(v: number) => formatMinutes(v)}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const d = payload[0].payload as MonthData;
              return (
                <div className="bg-tile border border-stroke rounded-lg p-3 shadow-lg">
                  <div className="text-xs text-dim mb-1">{d.month}</div>
                  <div className="text-sm font-semibold text-heading">{formatMinutes(d.avgTotal)} total</div>
                  <div className="text-xs" style={{ color: 'var(--color-steph-sleep-deep)' }}>Deep: {formatMinutes(d.avgDeep)}</div>
                  <div className="text-xs" style={{ color: 'var(--color-steph-sleep-rem)' }}>REM: {formatMinutes(d.avgRem)}</div>
                  <div className="text-xs" style={{ color: 'var(--color-steph-sleep-awake)' }}>Awake: {formatMinutes(d.avgAwake)}</div>
                </div>
              );
            }}
          />
          <Line dataKey="avgTotal" type="monotone" stroke="var(--color-steph-sleep)" strokeWidth={2} dot={{ fill: 'var(--color-steph-sleep)', r: 4 }} isAnimationActive={false} />
          <Line dataKey="avgDeep" type="monotone" stroke="var(--color-steph-sleep-deep)" strokeWidth={2} dot={{ fill: 'var(--color-steph-sleep-deep)', r: 3 }} isAnimationActive={false} />
          <Line dataKey="avgAwake" type="monotone" stroke="var(--color-steph-sleep-awake)" strokeWidth={2} strokeDasharray="4 3" dot={{ fill: 'var(--color-steph-sleep-awake)', r: 3 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 mt-3">
        <div className="flex items-center gap-1.5 text-xs text-subtle">
          <span className="size-2.5 rounded-sm" style={{ background: 'var(--color-steph-sleep)' }} />
          Total
        </div>
        <div className="flex items-center gap-1.5 text-xs text-subtle">
          <span className="size-2.5 rounded-sm" style={{ background: 'var(--color-steph-sleep-deep)' }} />
          Deep
        </div>
        <div className="flex items-center gap-1.5 text-xs text-subtle">
          <span className="size-2.5 rounded-sm" style={{ background: 'var(--color-steph-sleep-awake)' }} />
          Awake
        </div>
      </div>
    </div>
  );
}

// ── Exercise → Next Night Sleep ──

interface ExerciseSleepBucket {
  label: string;
  avgTotal: number;
  avgDeep: number;
  avgRem: number;
  nights: number;
}

function ExerciseSleepCorrelation({ sleep, workouts }: { sleep: StephSleepSession[]; workouts: StephWorkout[] }) {
  const data = useMemo(() => {
    // Build exercise minutes per day from workouts
    const exerciseByDate = new Map<string, number>();
    for (const w of workouts) {
      const date = w.startTime.slice(0, 10);
      exerciseByDate.set(date, (exerciseByDate.get(date) ?? 0) + Math.round((w.durationSeconds ?? 0) / 60));
    }

    // Sort sleep by date
    const sorted = [...sleep].filter((s) => s.totalMinutes != null).sort((a, b) => a.date.localeCompare(b.date));

    // Pair each day's exercise with the next night's sleep
    const buckets = {
      rest: { total: [] as number[], deep: [] as number[], rem: [] as number[] },
      moderate: { total: [] as number[], deep: [] as number[], rem: [] as number[] },
      heavy: { total: [] as number[], deep: [] as number[], rem: [] as number[] },
    };

    for (let i = 0; i < sorted.length - 1; i++) {
      const exDate = sorted[i]!.date;
      const nextSleep = sorted[i + 1]!;
      const exerciseMin = exerciseByDate.get(exDate) ?? 0;

      const bucket = exerciseMin < 30 ? 'rest' : exerciseMin < 60 ? 'moderate' : 'heavy';
      buckets[bucket].total.push(nextSleep.totalMinutes ?? 0);
      buckets[bucket].deep.push(nextSleep.deepMinutes ?? 0);
      buckets[bucket].rem.push(nextSleep.remMinutes ?? 0);
    }

    const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

    const result: ExerciseSleepBucket[] = [
      { label: 'Rest (<30m)', avgTotal: avg(buckets.rest.total), avgDeep: avg(buckets.rest.deep), avgRem: avg(buckets.rest.rem), nights: buckets.rest.total.length },
      { label: 'Moderate', avgTotal: avg(buckets.moderate.total), avgDeep: avg(buckets.moderate.deep), avgRem: avg(buckets.moderate.rem), nights: buckets.moderate.total.length },
      { label: 'Heavy (60m+)', avgTotal: avg(buckets.heavy.total), avgDeep: avg(buckets.heavy.deep), avgRem: avg(buckets.heavy.rem), nights: buckets.heavy.total.length },
    ];

    return result.filter((b) => b.nights > 0);
  }, [sleep, workouts]);

  if (data.length < 2) return null;

  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      <div className="text-xs font-medium text-dim uppercase tracking-wide mb-1">Exercise → Next Night Sleep</div>
      <div className="text-[10px] text-dim mb-4">How previous day&apos;s training affects sleep quality</div>
      <div className="grid grid-cols-3 gap-3">
        {data.map((bucket) => {
          const bestDeep = Math.max(...data.map((d) => d.avgDeep));
          const bestRem = Math.max(...data.map((d) => d.avgRem));
          return (
            <div key={bucket.label} className="text-center">
              <div className="text-[10px] font-medium text-dim uppercase tracking-wide mb-2">{bucket.label}</div>
              <div className="text-lg font-semibold text-heading">{formatMinutes(bucket.avgTotal)}</div>
              <div className="text-[10px] text-dim mb-2">{bucket.nights} nights</div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-dim">Deep</span>
                  <span className={bucket.avgDeep === bestDeep ? 'font-semibold text-heading' : 'text-subtle'}>
                    {formatMinutes(bucket.avgDeep)}
                    {bucket.avgDeep === bestDeep && ' *'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-dim">REM</span>
                  <span className={bucket.avgRem === bestRem ? 'font-semibold text-heading' : 'text-subtle'}>
                    {formatMinutes(bucket.avgRem)}
                    {bucket.avgRem === bestRem && ' *'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-[10px] text-dim text-center mt-3">* = best in category</div>
    </div>
  );
}

// ── Sleep Efficiency Score Card ──

function SleepScoreCard({ sleep }: { sleep: StephSleepSession[] }) {
  const stats = useMemo(() => {
    const valid = sleep.filter((s) => s.totalMinutes != null);
    if (valid.length === 0) return null;

    const totals = valid.map((s) => s.totalMinutes!);
    const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
    const stdDev = Math.sqrt(totals.reduce((s, t) => s + (t - avg) ** 2, 0) / totals.length);
    const avgAwake = valid.reduce((s, v) => s + (v.awakeMinutes ?? 0), 0) / valid.length;
    const efficiency = ((avg - avgAwake) / avg) * 100;
    const under7 = totals.filter((t) => t < 420).length;
    const avgDeep = valid.reduce((s, v) => s + (v.deepMinutes ?? 0), 0) / valid.length;
    const avgRem = valid.reduce((s, v) => s + (v.remMinutes ?? 0), 0) / valid.length;

    // Best restorative night
    const best = valid.reduce((b, s) => {
      const score = (s.deepMinutes ?? 0) + (s.remMinutes ?? 0);
      const bScore = (b.deepMinutes ?? 0) + (b.remMinutes ?? 0);
      return score > bScore ? s : b;
    });
    const bestScore = (best.deepMinutes ?? 0) + (best.remMinutes ?? 0);

    return { avg, stdDev, efficiency, under7, total: valid.length, avgDeep, avgRem, best, bestScore };
  }, [sleep]);

  if (!stats) return null;

  const effColor = stats.efficiency >= 90 ? 'var(--color-steph-hrv)' : stats.efficiency >= 80 ? 'var(--color-steph-acute)' : 'var(--color-steph-rhr)';

  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      <div className="text-xs font-medium text-dim uppercase tracking-wide mb-4">Sleep Quality Overview</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-[10px] text-dim uppercase tracking-wide mb-1">Efficiency</div>
          <div className="text-2xl font-bold" style={{ color: effColor }}>{stats.efficiency.toFixed(1)}%</div>
          <div className="text-[10px] text-dim">time asleep / in bed</div>
        </div>
        <div>
          <div className="text-[10px] text-dim uppercase tracking-wide mb-1">Consistency</div>
          <div className="text-2xl font-semibold text-heading">&plusmn;{Math.round(stats.stdDev)}m</div>
          <div className="text-[10px] text-dim">std deviation</div>
        </div>
        <div>
          <div className="text-[10px] text-dim uppercase tracking-wide mb-1">Under 7h</div>
          <div className="text-2xl font-semibold text-heading">{stats.under7}<span className="text-sm text-dim">/{stats.total}</span></div>
          <div className="text-[10px] text-dim">{Math.round(stats.under7 / stats.total * 100)}% of nights</div>
        </div>
        <div>
          <div className="text-[10px] text-dim uppercase tracking-wide mb-1">Best Night</div>
          <div className="text-lg font-semibold text-heading">{formatMinutes(stats.bestScore)}</div>
          <div className="text-[10px] text-dim">{new Date(stats.best.date + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' })} (deep+REM)</div>
        </div>
      </div>
    </div>
  );
}

// ── Bedtime Distribution ──

function BedtimeDistribution({ sleep }: { sleep: StephSleepSession[] }) {
  const data = useMemo(() => {
    const hourCounts = new Map<number, number>();
    for (const s of sleep) {
      if (!s.bedtime) continue;
      const utcH = parseInt(s.bedtime.slice(11, 13), 10);
      // UTC to MST (-7)
      const localH = ((utcH - 7) % 24 + 24) % 24;
      hourCounts.set(localH, (hourCounts.get(localH) ?? 0) + 1);
    }

    // Show 8 PM to 1 AM range
    const hours = [20, 21, 22, 23, 0];
    return hours.map((h) => {
      const ampm = h < 12 ? 'AM' : 'PM';
      const display = h % 12 || 12;
      return {
        label: `${display}${ampm}`,
        count: hourCounts.get(h) ?? 0,
      };
    });
  }, [sleep]);

  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      <div className="text-xs font-medium text-dim uppercase tracking-wide mb-4">Bedtime Distribution</div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 5, right: 0, left: 5, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
            allowDecimals={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const d = payload[0].payload as { label: string; count: number };
              return (
                <div className="bg-tile border border-stroke rounded-lg p-3 shadow-lg">
                  <div className="text-sm font-semibold text-heading">{d.count} nights</div>
                  <div className="text-xs text-dim">Bedtime: {d.label}</div>
                </div>
              );
            }}
            cursor={{ fill: 'var(--color-stroke)', fillOpacity: 0.3 }}
          />
          <Bar dataKey="count" fill="var(--color-steph-sleep-core)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Main ──

export default function StephSleepInsights({ sleep, workouts }: Props) {
  const validSleep = sleep.filter((s) => s.totalMinutes != null);

  if (validSleep.length < 7) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-8 text-center">
        <div className="text-dim">Not enough sleep data for insights (need 7+ nights)</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SleepScoreCard sleep={validSleep} />

      <MonthlyTrend sleep={validSleep} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DayOfWeekPattern sleep={validSleep} />
        <DurationDistribution sleep={validSleep} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ExerciseSleepCorrelation sleep={validSleep} workouts={workouts} />
        <BedtimeDistribution sleep={validSleep} />
      </div>
    </div>
  );
}
