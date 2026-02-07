import type { ActivityStats } from '../../lib/types/activity';

interface Props {
  activityStats: ActivityStats;
}

export default function ActivitySummaryCards({ activityStats }: Props) {
  const cards = [
    { label: 'Avg Calories/Day', value: activityStats.avgCalories ? `${activityStats.avgCalories}` : '—', unit: 'kcal' },
    { label: 'Total Exercise', value: activityStats.totalExerciseMinutes ? `${activityStats.totalExerciseMinutes}` : '—', unit: 'min' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
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
