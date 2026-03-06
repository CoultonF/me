import { useState, useEffect } from 'react';
import type { HydrationAPIResponse } from '../../lib/types/hydration';
import HydrationProgress from './HydrationProgress';
import HydrationEntryList from './HydrationEntryList';
import HydrationHistory from './HydrationHistory';

const EMPTY_RESPONSE: HydrationAPIResponse = {
  today: { date: '', totalMl: 0, goalMl: 2500, entries: [] },
  stats: { currentStreak: 0, avgDailyMl: 0, totalDays: 0, dailyTotals: [] },
};

export default function HydrationTracker() {
  const [data, setData] = useState<HydrationAPIResponse>(EMPTY_RESPONSE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toLocaleDateString('en-CA');
    const tz = -new Date().getTimezoneOffset();
    fetch(`/api/health/hydration?today=${today}&tz=${tz}`)
      .then((r) => r.json() as Promise<HydrationAPIResponse>)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-4">
        <div className="text-xs text-dim">Loading hydration...</div>
      </div>
    );
  }

  const { today, stats } = data;
  const pctNum = today.goalMl > 0 ? Math.round((today.totalMl / today.goalMl) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="text-xs font-medium text-dim uppercase tracking-wide">Hydration</div>

      {/* Progress ring */}
      <div className="bg-tile border border-stroke rounded-lg p-4">
        <div className="flex items-center justify-center">
          <HydrationProgress totalMl={today.totalMl} goalMl={today.goalMl} />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-tile border border-stroke rounded-lg px-3 py-2.5 text-center">
          <div className="text-lg font-semibold text-heading">{pctNum}%</div>
          <div className="text-[11px] text-dim">Today</div>
        </div>
        <div className="bg-tile border border-stroke rounded-lg px-3 py-2.5 text-center">
          <div className="text-lg font-semibold text-heading">{stats.currentStreak}</div>
          <div className="text-[11px] text-dim">Day Streak</div>
        </div>
        <div className="bg-tile border border-stroke rounded-lg px-3 py-2.5 text-center">
          <div className="text-lg font-semibold text-heading">{stats.avgDailyMl}</div>
          <div className="text-[11px] text-dim">Avg mL/day</div>
        </div>
      </div>

      {/* Today's entries */}
      {today.entries.length > 0 && (
        <div className="bg-tile border border-stroke rounded-lg p-3">
          <div className="text-[11px] font-medium text-dim uppercase tracking-wide mb-2">Today's Entries</div>
          <HydrationEntryList entries={today.entries} />
        </div>
      )}

      {/* 90-day history chart */}
      <HydrationHistory dailyTotals={stats.dailyTotals} goalMl={today.goalMl} />
    </div>
  );
}
