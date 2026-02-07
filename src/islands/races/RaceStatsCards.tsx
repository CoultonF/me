import type { RaceStats } from '../../lib/types/races';

interface Props {
  stats: RaceStats;
}

export default function RaceStatsCards({ stats }: Props) {
  const cards = [
    { label: 'Total Races', value: stats.totalRaces ? `${stats.totalRaces}` : '0' },
    { label: 'Distances with PBs', value: stats.personalBests.length ? `${stats.personalBests.length}` : '0' },
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
        </div>
      ))}
    </div>
  );
}
