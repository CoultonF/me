import type { RunningExtendedStats } from '../../lib/types/running';

interface Props {
  stats: RunningExtendedStats;
}

function formatPace(secPerKm: number): string {
  if (!secPerKm || secPerKm <= 0) return '--';
  const min = Math.floor(secPerKm / 60);
  const sec = secPerKm % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export default function RunningSummaryCards({ stats }: Props) {
  const cards = [
    { label: 'Total Distance', value: stats.totalDistanceKm ? `${stats.totalDistanceKm}` : '--', unit: 'km' },
    { label: 'Avg Pace', value: formatPace(stats.avgPaceSecPerKm), unit: '/km' },
    { label: 'Workouts', value: stats.workoutCount ? `${stats.workoutCount}` : '--', unit: '' },
    { label: 'Avg Heart Rate', value: stats.avgHeartRate ? `${stats.avgHeartRate}` : '--', unit: 'bpm' },
    { label: 'Longest Run', value: stats.longestRunKm ? `${stats.longestRunKm}` : '--', unit: 'km' },
    { label: 'Fastest Pace', value: formatPace(stats.fastestPaceSecPerKm), unit: '/km' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
