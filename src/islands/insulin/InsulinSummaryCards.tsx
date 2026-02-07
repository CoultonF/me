import type { InsulinStats } from '../../lib/types/insulin';

interface Props {
  stats: InsulinStats;
}

export default function InsulinSummaryCards({ stats }: Props) {
  const cards = [
    { label: 'Avg Daily', value: stats.avgDailyTotal ? `${stats.avgDailyTotal}` : '—', unit: 'units' },
    { label: 'Total Bolus', value: stats.totalBolus ? `${stats.totalBolus}` : '—', unit: 'units' },
    { label: 'Total Basal', value: stats.totalBasal ? `${stats.totalBasal}` : '—', unit: 'units' },
    { label: 'Bolus Count', value: stats.bolusCount ? `${stats.bolusCount}` : '—', unit: '' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="bg-tile border border-stroke rounded-lg p-4">
          <div className="text-xs font-medium text-dim uppercase tracking-wide mb-2">
            {card.label}
          </div>
          <div className="text-2xl font-semibold text-heading leading-none">
            {card.value}
          </div>
          {card.unit && <div className="text-xs text-dim mt-1">{card.unit}</div>}
        </div>
      ))}
    </div>
  );
}
