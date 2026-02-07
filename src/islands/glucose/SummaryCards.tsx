import type { GlucoseStats } from '../../lib/types/glucose';

interface Props {
  stats: GlucoseStats;
}

export default function SummaryCards({ stats }: Props) {
  // eA1C = (avg mg/dL + 46.7) / 28.7  — ADAG formula
  const eA1C = stats.avg ? ((stats.avg * 18.0182 + 46.7) / 28.7).toFixed(1) : null;

  const cards = [
    { label: 'Est. A1C', value: eA1C ?? '—', unit: '%' },
    { label: 'Average', value: stats.avg ? `${stats.avg.toFixed(1)}` : '—', unit: 'mmol/L' },
    { label: 'Min', value: stats.min ? `${stats.min.toFixed(1)}` : '—', unit: 'mmol/L' },
    { label: 'Max', value: stats.max ? `${stats.max.toFixed(1)}` : '—', unit: 'mmol/L' },
    { label: 'Readings', value: stats.count ? `${stats.count}` : '—', unit: '' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
