import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import type { StephActivityDay } from '../../lib/types/steph-activity';

interface Props {
  trainingLoadActivity: StephActivityDay[];
}

interface LoadDay {
  date: string;
  dailyLoad: number;
  acuteLoad: number;
  chronicLoad: number;
  acwr: number | null;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getRiskColor(acwr: number | null): string {
  if (acwr == null) return 'var(--color-dim)';
  if (acwr < 0.8) return 'var(--color-steph-chronic)'; // undertrained
  if (acwr <= 1.3) return 'var(--color-steph-hrv)';    // optimal
  if (acwr <= 1.5) return 'var(--color-steph-acute)';   // caution
  return 'var(--color-steph-rhr)';                       // danger
}

function getRiskLabel(acwr: number | null): string {
  if (acwr == null) return 'N/A';
  if (acwr < 0.8) return 'Undertrained';
  if (acwr <= 1.3) return 'Optimal';
  if (acwr <= 1.5) return 'Caution';
  return 'Danger';
}

function LoadTooltip({ active, payload }: { active?: boolean; payload?: { payload?: LoadDay }[] }) {
  if (!active || !payload?.[0]?.payload) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-tile border border-stroke rounded-lg p-3 shadow-lg">
      <div className="text-xs text-dim mb-1">{formatDate(d.date)}</div>
      <div className="text-xs text-subtle">Daily: {d.dailyLoad} min</div>
      <div className="text-xs" style={{ color: 'var(--color-steph-acute)' }}>Acute (7d): {d.acuteLoad} min</div>
      <div className="text-xs" style={{ color: 'var(--color-steph-chronic)' }}>Chronic (28d): {d.chronicLoad.toFixed(0)} min</div>
      {d.acwr != null && (
        <div className="text-xs font-medium mt-1" style={{ color: getRiskColor(d.acwr) }}>
          ACWR: {d.acwr.toFixed(2)} - {getRiskLabel(d.acwr)}
        </div>
      )}
    </div>
  );
}

const SMOOTH_THRESHOLD = 90;

function smoothLoadToWeekly(data: LoadDay[]): { data: LoadDay[]; smoothed: boolean } {
  if (data.length <= SMOOTH_THRESHOLD) return { data, smoothed: false };

  const weekMap = new Map<string, LoadDay[]>();
  for (const item of data) {
    const d = new Date(item.date + 'T12:00:00');
    const day = d.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + mondayOffset);
    const weekKey = monday.toISOString().slice(0, 10);
    const group = weekMap.get(weekKey);
    if (group) group.push(item);
    else weekMap.set(weekKey, [item]);
  }

  const result: LoadDay[] = [];
  for (const [weekDate, items] of weekMap) {
    const last = items[items.length - 1]!;
    const totalLoad = items.reduce((sum, i) => sum + i.dailyLoad, 0);
    result.push({
      date: weekDate,
      dailyLoad: totalLoad,
      acuteLoad: last.acuteLoad,
      chronicLoad: last.chronicLoad,
      acwr: last.acwr,
    });
  }

  return { data: result.sort((a, b) => a.date.localeCompare(b.date)), smoothed: true };
}

export default function TrainingLoadChart({ trainingLoadActivity }: Props) {
  const loadData = useMemo(() => {
    if (trainingLoadActivity.length === 0) return [];

    // Build date -> exercise minutes map
    const dateMap = new Map<string, number>();
    for (const d of trainingLoadActivity) {
      dateMap.set(d.date, d.exerciseMinutes ?? 0);
    }

    // Generate all dates in range
    const sorted = [...trainingLoadActivity].sort((a, b) => a.date.localeCompare(b.date));
    const startDate = new Date(sorted[0]!.date + 'T12:00:00');
    const endDate = new Date(sorted[sorted.length - 1]!.date + 'T12:00:00');

    const allDates: string[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      allDates.push(d.toISOString().slice(0, 10));
    }

    // Compute rolling loads
    const result: LoadDay[] = [];
    for (let i = 0; i < allDates.length; i++) {
      const date = allDates[i]!;
      const dailyLoad = dateMap.get(date) ?? 0;

      // 7-day acute load (sum)
      let acuteLoad = 0;
      for (let j = Math.max(0, i - 6); j <= i; j++) {
        acuteLoad += dateMap.get(allDates[j]!) ?? 0;
      }

      // 28-day chronic load (daily average)
      let chronicSum = 0;
      const chronicDays = Math.min(i + 1, 28);
      for (let j = Math.max(0, i - 27); j <= i; j++) {
        chronicSum += dateMap.get(allDates[j]!) ?? 0;
      }
      const chronicLoad = chronicSum / chronicDays;

      // ACWR - only valid after 28 days
      const acwr = i >= 27 && chronicLoad > 0 ? acuteLoad / (chronicLoad * 7) : null;

      result.push({ date, dailyLoad, acuteLoad, chronicLoad: chronicLoad * 7, acwr });
    }

    return result;
  }, [trainingLoadActivity]);

  const { data: chartLoadData, smoothed } = useMemo(
    () => smoothLoadToWeekly(loadData),
    [loadData],
  );

  if (chartLoadData.length === 0) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-8 text-center">
        <div className="text-dim">No training load data available</div>
      </div>
    );
  }

  // Current ACWR for the badge (from unsmoothed data for accuracy)
  const latestACWR = loadData[loadData.length - 1]?.acwr ?? null;

  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-medium text-dim uppercase tracking-wide">
          Training Load{smoothed && ' (weekly)'}
        </div>
        {latestACWR != null && (
          <div
            className="text-xs font-medium px-2 py-1 rounded-full"
            style={{
              color: getRiskColor(latestACWR),
              background: getRiskColor(latestACWR) + '20',
            }}
          >
            ACWR: {latestACWR.toFixed(2)} - {getRiskLabel(latestACWR)}
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartLoadData} margin={{ top: 5, right: 0, left: 5, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
            unit=" min"
          />
          <Tooltip content={<LoadTooltip />} />
          <ReferenceLine y={0} stroke="var(--color-stroke)" />
          <Bar dataKey="dailyLoad" fill="var(--color-stroke)" fillOpacity={0.4} isAnimationActive={false} />
          <Line
            dataKey="acuteLoad"
            type="monotone"
            stroke="var(--color-steph-acute)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            dataKey="chronicLoad"
            type="monotone"
            stroke="var(--color-steph-chronic)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Legend
            content={() => (
              <div className="flex justify-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-subtle">
                  <span className="size-2.5 rounded-sm" style={{ background: 'var(--color-stroke)', opacity: 0.4 }} />
                  Daily
                </div>
                <div className="flex items-center gap-1.5 text-xs text-subtle">
                  <span className="w-4 h-0 border-t-2" style={{ borderColor: 'var(--color-steph-acute)' }} />
                  Acute (7d)
                </div>
                <div className="flex items-center gap-1.5 text-xs text-subtle">
                  <span className="w-4 h-0 border-t-2" style={{ borderColor: 'var(--color-steph-chronic)' }} />
                  Chronic (28d)
                </div>
              </div>
            )}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
