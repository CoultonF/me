import type { ActivityStats, RunningStats } from '../../lib/types/activity';

interface Props {
  activityStats: ActivityStats;
  runningStats: RunningStats;
}

export default function ActivitySummaryCards({ activityStats, runningStats }: Props) {
  const cards = [
    { label: 'Total Workouts', value: runningStats.workoutCount ? `${runningStats.workoutCount}` : '—', unit: '' },
    { label: 'Total Distance', value: runningStats.totalDistanceKm ? `${runningStats.totalDistanceKm}` : '—', unit: 'km' },
    { label: 'Avg Calories/Day', value: activityStats.avgCalories ? `${activityStats.avgCalories}` : '—', unit: 'kcal' },
    { label: 'Total Exercise', value: activityStats.totalExerciseMinutes ? `${activityStats.totalExerciseMinutes}` : '—', unit: 'min' },
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
