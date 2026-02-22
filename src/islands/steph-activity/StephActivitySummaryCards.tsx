import type { StephActivityStats } from '../../lib/types/steph-activity';

interface Props {
  stats: StephActivityStats;
}

export default function StephActivitySummaryCards({ stats }: Props) {
  const cards = [
    { label: 'Avg Calories/Day', value: stats.avgCalories || '--', unit: 'kcal' },
    { label: 'Total Exercise', value: stats.totalExercise || '--', unit: 'min' },
    { label: 'Total Steps', value: stats.totalSteps ? stats.totalSteps.toLocaleString() : '--', unit: '' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
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
