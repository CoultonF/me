import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { InsulinDailyTotal } from '../../lib/types/insulin';

interface Props {
  dailyTotals: InsulinDailyTotal[];
}

function formatDate(date: string): string {
  return new Date(date + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' });
}

interface TooltipPayload {
  payload?: InsulinDailyTotal;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.[0]?.payload) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-tile border border-stroke rounded-lg p-3 shadow-lg">
      <div className="text-xs text-dim mb-1">{formatDate(d.date)}</div>
      <div className="flex items-center gap-2 text-sm">
        <span className="size-2.5 rounded-full" style={{ backgroundColor: 'var(--color-insulin-bolus)' }} />
        Bolus: {d.bolusTotal.toFixed(1)}u
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="size-2.5 rounded-full" style={{ backgroundColor: 'var(--color-insulin-basal)' }} />
        Basal: {d.basalTotal.toFixed(1)}u
      </div>
      <div className="text-xs text-dim mt-1">
        Total: {(d.bolusTotal + d.basalTotal).toFixed(1)}u
      </div>
    </div>
  );
}

export default function DailyTotals({ dailyTotals }: Props) {
  if (dailyTotals.length === 0) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-8 text-center">
        <div className="text-dim">No insulin data for this period</div>
      </div>
    );
  }

  const data = dailyTotals.map((d) => ({
    ...d,
    dateLabel: formatDate(d.date),
  }));

  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      <div className="text-xs font-medium text-dim uppercase tracking-wide mb-4">Daily Insulin Totals</div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 0, left: 5, bottom: 0 }}>
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--color-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-stroke)' }}
            unit="u"
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-stroke)', opacity: 0.3 }} />
          <Bar dataKey="bolusTotal" stackId="insulin" fill="var(--color-insulin-bolus)" radius={[0, 0, 0, 0]} name="Bolus" />
          <Bar dataKey="basalTotal" stackId="insulin" fill="var(--color-insulin-basal)" radius={[4, 4, 0, 0]} name="Basal" />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 mt-3">
        <div className="flex items-center gap-1.5 text-xs text-subtle">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: 'var(--color-insulin-bolus)' }} />
          Bolus
        </div>
        <div className="flex items-center gap-1.5 text-xs text-subtle">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: 'var(--color-insulin-basal)' }} />
          Basal
        </div>
      </div>
    </div>
  );
}
