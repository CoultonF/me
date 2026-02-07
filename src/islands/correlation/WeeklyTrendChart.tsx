import { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { MergedDay, WeeklyAggregate } from './types';

interface Props {
  days: MergedDay[];
}

function getISOWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((d.getTime() - jan1.getTime()) / 86400000) + 1;
  const weekNum = Math.ceil(dayOfYear / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function getWeekLabel(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
}

function aggregateByWeek(days: MergedDay[]): WeeklyAggregate[] {
  const weekMap = new Map<string, { label: string; tirValues: number[]; exercise: number; insulinValues: number[] }>();

  for (const d of days) {
    const weekKey = getISOWeek(d.date);
    let entry = weekMap.get(weekKey);
    if (!entry) {
      entry = { label: getWeekLabel(d.date), tirValues: [], exercise: 0, insulinValues: [] };
      weekMap.set(weekKey, entry);
    }
    if (d.tirPercent !== null) entry.tirValues.push(d.tirPercent);
    if (d.exerciseMinutes !== null && d.exerciseMinutes > 0) entry.exercise += d.exerciseMinutes;
    if (d.insulinTotal !== null) entry.insulinValues.push(d.insulinTotal);
  }

  return Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({
      weekLabel: v.label,
      avgTIR:
        v.tirValues.length > 0
          ? Math.round(v.tirValues.reduce((s, x) => s + x, 0) / v.tirValues.length)
          : null,
      totalExercise: v.exercise,
      avgInsulin:
        v.insulinValues.length > 0
          ? +(v.insulinValues.reduce((s, x) => s + x, 0) / v.insulinValues.length).toFixed(1)
          : null,
    }));
}

interface TooltipPayload {
  payload?: WeeklyAggregate;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.[0]?.payload) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-tile border border-stroke rounded-lg p-3 shadow-lg">
      <div className="text-xs text-dim mb-1">Week of {d.weekLabel}</div>
      {d.avgTIR !== null && (
        <div className="flex items-center gap-2 text-sm">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: 'var(--color-glucose-normal)' }} />
          TIR: {d.avgTIR}%
        </div>
      )}
      <div className="flex items-center gap-2 text-sm">
        <span className="size-2.5 rounded-full" style={{ backgroundColor: 'var(--color-activity-exercise)' }} />
        Exercise: {d.totalExercise} min
      </div>
      {d.avgInsulin !== null && (
        <div className="flex items-center gap-2 text-sm">
          <span className="size-2.5 rounded-full bg-indigo-400" />
          Avg insulin: {d.avgInsulin}u
        </div>
      )}
    </div>
  );
}

export default function WeeklyTrendChart({ days }: Props) {
  const weekly = useMemo(() => aggregateByWeek(days), [days]);

  if (weekly.length < 4) return null;

  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      <div className="text-xs font-medium text-dim uppercase tracking-wide mb-4">
        Weekly Trends
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={weekly} margin={{ top: 5, right: 0, left: 5, bottom: 0 }}>
          <XAxis
            dataKey="weekLabel"
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="tir"
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
            unit="%"
          />
          <YAxis
            yAxisId="exercise"
            orientation="right"
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
            unit="m"
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-stroke)', opacity: 0.3 }} />
          <Bar
            yAxisId="exercise"
            dataKey="totalExercise"
            fill="var(--color-activity-exercise)"
            opacity={0.4}
            radius={[3, 3, 0, 0]}
            name="Exercise"
          />
          <Line
            yAxisId="tir"
            type="monotone"
            dataKey="avgTIR"
            stroke="var(--color-glucose-normal)"
            strokeWidth={2}
            dot={false}
            connectNulls
            name="TIR %"
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 mt-3">
        <div className="flex items-center gap-1.5 text-xs text-subtle">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: 'var(--color-glucose-normal)' }} />
          Avg TIR %
        </div>
        <div className="flex items-center gap-1.5 text-xs text-subtle">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: 'var(--color-activity-exercise)' }} />
          Exercise (min)
        </div>
      </div>
    </div>
  );
}
