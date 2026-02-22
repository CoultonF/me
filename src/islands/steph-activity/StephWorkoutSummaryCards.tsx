import type { StephWorkoutStats } from '../../lib/types/steph-activity';

interface Props {
  stats: StephWorkoutStats;
}

function formatDuration(seconds: number): string {
  if (!seconds) return '--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function StephWorkoutSummaryCards({ stats }: Props) {
  const cards = [
    { label: 'Workouts', value: stats.count || '--', unit: '' },
    { label: 'Total Distance', value: stats.totalDistanceKm ? `${stats.totalDistanceKm}` : '--', unit: 'km' },
    { label: 'Avg Heart Rate', value: stats.avgHR || '--', unit: 'bpm' },
    { label: 'Total Duration', value: formatDuration(stats.totalDurationSeconds), unit: '' },
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
