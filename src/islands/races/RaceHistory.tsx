import { useState, useMemo } from 'react';
import type { RaceWithResult } from '../../lib/types/races';

interface Props {
  races: RaceWithResult[];
}

type SortKey = 'date' | 'name' | 'distance' | 'chipTime' | 'pace' | 'overall' | 'division';
type SortDir = 'asc' | 'desc';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function getSortValue(race: RaceWithResult, key: SortKey): string | number {
  switch (key) {
    case 'date': return race.date;
    case 'name': return race.name.toLowerCase();
    case 'distance': return race.distance;
    case 'chipTime': return race.result?.chipTime ?? 'zzz';
    case 'pace': return race.result?.pacePerKm ?? 'zzz';
    case 'overall': return race.result?.overallPlace ?? 99999;
    case 'division': return race.result?.divisionPlace ?? 99999;
  }
}

export default function RaceHistory({ races }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sorted = useMemo(() => {
    return [...races].sort((a, b) => {
      const aVal = getSortValue(a, sortKey);
      const bVal = getSortValue(b, sortKey);
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [races, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'date' ? 'desc' : 'asc');
    }
  };

  if (races.length === 0) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-8 text-center">
        <div className="text-dim">No completed races yet</div>
      </div>
    );
  }

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return '';
    return sortDir === 'asc' ? ' \u25B2' : ' \u25BC';
  };

  const thClass = 'text-left text-xs font-medium text-dim uppercase tracking-wide py-2 px-3 cursor-pointer hover:text-body select-none whitespace-nowrap';

  return (
    <div className="space-y-3">
      <div className="text-xs font-medium text-dim uppercase tracking-wide">Race History</div>
      <div className="bg-tile border border-stroke rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-stroke">
            <tr>
              <th className={thClass} onClick={() => handleSort('date')}>Date{sortIndicator('date')}</th>
              <th className={thClass} onClick={() => handleSort('name')}>Race{sortIndicator('name')}</th>
              <th className={thClass} onClick={() => handleSort('distance')}>Dist{sortIndicator('distance')}</th>
              <th className={thClass} onClick={() => handleSort('chipTime')}>Chip Time{sortIndicator('chipTime')}</th>
              <th className={thClass} onClick={() => handleSort('pace')}>Pace{sortIndicator('pace')}</th>
              <th className={thClass} onClick={() => handleSort('overall')}>Overall{sortIndicator('overall')}</th>
              <th className={thClass} onClick={() => handleSort('division')}>Division{sortIndicator('division')}</th>
              <th className="py-2 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((race) => (
              <tr key={race.id} className="border-b border-stroke last:border-b-0 hover:bg-page/50">
                <td className="py-2.5 px-3 text-subtle whitespace-nowrap">{formatDate(race.date)}</td>
                <td className="py-2.5 px-3 font-medium text-heading">{race.name}</td>
                <td className="py-2.5 px-3 text-body">{race.distance}</td>
                <td className="py-2.5 px-3 font-medium text-heading whitespace-nowrap">{race.result?.chipTime ?? '—'}</td>
                <td className="py-2.5 px-3 text-body whitespace-nowrap">{race.result?.pacePerKm ? `${race.result.pacePerKm}/km` : '—'}</td>
                <td className="py-2.5 px-3 text-body whitespace-nowrap">
                  {race.result?.overallPlace && race.result.overallTotal
                    ? `${race.result.overallPlace}/${race.result.overallTotal}`
                    : '—'}
                </td>
                <td className="py-2.5 px-3 text-body whitespace-nowrap">
                  {race.result?.divisionPlace && race.result.divisionTotal
                    ? `${race.result.divisionPlace}/${race.result.divisionTotal}`
                    : '—'}
                </td>
                <td className="py-2.5 px-3">
                  {(race.result?.resultsUrl ?? race.resultsUrl) && (
                    <a
                      href={race.result?.resultsUrl ?? race.resultsUrl ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-accent hover:underline"
                    >
                      Results
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
