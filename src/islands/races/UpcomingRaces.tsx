import type { RaceWithResult } from '../../lib/types/races';

interface Props {
  races: RaceWithResult[];
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  const raceDate = new Date(dateStr + 'T00:00:00');
  return Math.max(0, Math.ceil((raceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export default function UpcomingRaces({ races }: Props) {
  // Sort upcoming by date ascending
  const sorted = [...races].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-3">
      <div className="text-xs font-medium text-dim uppercase tracking-wide">Upcoming Races</div>
      {sorted.map((race) => {
        const days = daysUntil(race.date);
        return (
          <div key={race.id} className="bg-tile border border-stroke rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="font-medium text-heading text-sm">{race.name}</div>
              <div className="text-xs text-dim">
                {race.distance} &middot; {formatDate(race.date)}
                {race.location ? ` · ${race.location}` : ''}
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-4">
              <div className="text-xl font-bold text-accent leading-none">{days}</div>
              <div className="text-xs text-dim">days</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
