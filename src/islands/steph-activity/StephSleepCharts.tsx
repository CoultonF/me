import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { StephSleepSession, StephSleepStats } from '../../lib/types/steph-activity';

interface Props {
  sleep: StephSleepSession[];
  sleepStats: StephSleepStats;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function SleepTooltip({ active, payload }: { active?: boolean; payload?: { payload?: StephSleepSession }[] }) {
  if (!active || !payload?.[0]?.payload) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-tile border border-stroke rounded-lg p-3 shadow-lg">
      <div className="text-xs text-dim mb-1">{formatDate(d.date)}</div>
      <div className="text-sm font-semibold text-heading">{formatMinutes(d.totalMinutes ?? 0)} total</div>
      {d.deepMinutes != null && <div className="text-xs text-subtle">Deep: {formatMinutes(d.deepMinutes)}</div>}
      {d.coreMinutes != null && <div className="text-xs text-subtle">Core: {formatMinutes(d.coreMinutes)}</div>}
      {d.remMinutes != null && <div className="text-xs text-subtle">REM: {formatMinutes(d.remMinutes)}</div>}
      {d.awakeMinutes != null && <div className="text-xs text-subtle">Awake: {formatMinutes(d.awakeMinutes)}</div>}
    </div>
  );
}

export default function StephSleepCharts({ sleep, sleepStats }: Props) {
  const sleepWithStages = sleep.filter((s) => s.totalMinutes != null);

  if (sleepWithStages.length === 0) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-8 text-center">
        <div className="text-dim">No sleep data available</div>
      </div>
    );
  }

  const stageData = sleepWithStages.map((s) => ({
    date: s.date,
    deep: s.deepMinutes ?? 0,
    core: s.coreMinutes ?? 0,
    rem: s.remMinutes ?? 0,
    awake: s.awakeMinutes ?? 0,
    totalMinutes: s.totalMinutes,
    deepMinutes: s.deepMinutes,
    coreMinutes: s.coreMinutes,
    remMinutes: s.remMinutes,
    awakeMinutes: s.awakeMinutes,
  }));

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Avg Total', value: formatMinutes(sleepStats.avgTotalMinutes) },
          { label: 'Avg Deep', value: formatMinutes(sleepStats.avgDeepMinutes) },
          { label: 'Avg Core', value: formatMinutes(sleepStats.avgCoreMinutes) },
          { label: 'Avg REM', value: formatMinutes(sleepStats.avgRemMinutes) },
          { label: 'Nights', value: `${sleepStats.nights}` },
        ].map((card) => (
          <div key={card.label} className="bg-tile border border-stroke rounded-lg p-3">
            <div className="text-[10px] font-medium text-dim uppercase tracking-wide mb-1">{card.label}</div>
            <div className="text-lg font-semibold text-heading leading-none">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Stacked bar chart */}
      <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
        <div className="text-xs font-medium text-dim uppercase tracking-wide mb-4">Sleep Stages</div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={stageData} margin={{ top: 5, right: 0, left: 5, bottom: 0 }}>
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
              tickFormatter={(v: number) => `${Math.round(v / 60)}h`}
            />
            <Tooltip content={<SleepTooltip />} cursor={{ fill: 'var(--color-stroke)', fillOpacity: 0.3 }} />
            <Bar dataKey="deep" stackId="sleep" fill="var(--color-steph-sleep-deep)" isAnimationActive={false} />
            <Bar dataKey="core" stackId="sleep" fill="var(--color-steph-sleep-core)" isAnimationActive={false} />
            <Bar dataKey="rem" stackId="sleep" fill="var(--color-steph-sleep-rem)" radius={[0, 0, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="awake" stackId="sleep" fill="var(--color-steph-sleep-awake)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            <Legend
              content={() => (
                <div className="flex justify-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5 text-xs text-subtle">
                    <span className="size-2.5 rounded-sm" style={{ background: 'var(--color-steph-sleep-deep)' }} />
                    Deep
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-subtle">
                    <span className="size-2.5 rounded-sm" style={{ background: 'var(--color-steph-sleep-core)' }} />
                    Core
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-subtle">
                    <span className="size-2.5 rounded-sm" style={{ background: 'var(--color-steph-sleep-rem)' }} />
                    REM
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-subtle">
                    <span className="size-2.5 rounded-sm" style={{ background: 'var(--color-steph-sleep-awake)' }} />
                    Awake
                  </div>
                </div>
              )}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
