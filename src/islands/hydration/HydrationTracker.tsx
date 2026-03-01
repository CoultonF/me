import { useState, useEffect, useCallback } from 'react';
import type { HydrationAPIResponse, HydrationEntry } from '../../lib/types/hydration';
import { useAuth } from '../shared/useAuth';
import HydrationProgress from './HydrationProgress';
import HydrationQuickAdd from './HydrationQuickAdd';
import HydrationEntryList from './HydrationEntryList';
import HydrationHistory from './HydrationHistory';

const EMPTY_RESPONSE: HydrationAPIResponse = {
  today: { date: '', totalMl: 0, goalMl: 2500, entries: [] },
  stats: { currentStreak: 0, avgDailyMl: 0, totalDays: 0, dailyTotals: [] },
};

export default function HydrationTracker() {
  const isAdmin = useAuth();
  const [data, setData] = useState<HydrationAPIResponse>(EMPTY_RESPONSE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/health/hydration')
      .then((r) => r.json() as Promise<HydrationAPIResponse>)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = useCallback(async (amountMl: number) => {
    const timestamp = new Date().toISOString();
    const tempId = -Date.now(); // negative temp ID for optimistic entry

    // Optimistic update
    const optimisticEntry: HydrationEntry = { id: tempId, timestamp, amountMl, note: null };
    setData((prev) => ({
      ...prev,
      today: {
        ...prev.today,
        totalMl: prev.today.totalMl + amountMl,
        entries: [optimisticEntry, ...prev.today.entries],
      },
    }));

    try {
      const res = await fetch('/private/api/hydration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', amountMl, timestamp }),
      });
      if (!res.ok) throw new Error('Failed to add');
      const { id } = await res.json() as { ok: boolean; id: number };

      // Replace temp ID with real ID
      setData((prev) => ({
        ...prev,
        today: {
          ...prev.today,
          entries: prev.today.entries.map((e) => e.id === tempId ? { ...e, id } : e),
        },
      }));
    } catch {
      // Rollback
      setData((prev) => ({
        ...prev,
        today: {
          ...prev.today,
          totalMl: prev.today.totalMl - amountMl,
          entries: prev.today.entries.filter((e) => e.id !== tempId),
        },
      }));
    }
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    const entry = data.today.entries.find((e) => e.id === id);
    if (!entry) return;

    // Optimistic update
    setData((prev) => ({
      ...prev,
      today: {
        ...prev.today,
        totalMl: prev.today.totalMl - entry.amountMl,
        entries: prev.today.entries.filter((e) => e.id !== id),
      },
    }));

    try {
      const res = await fetch('/private/api/hydration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      if (!res.ok) throw new Error('Failed to delete');
    } catch {
      // Rollback
      setData((prev) => ({
        ...prev,
        today: {
          ...prev.today,
          totalMl: prev.today.totalMl + entry.amountMl,
          entries: [...prev.today.entries, entry].sort(
            (a, b) => b.timestamp.localeCompare(a.timestamp),
          ),
        },
      }));
    }
  }, [data.today.entries]);

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

      {/* Progress + Quick-add side by side */}
      <div className="bg-tile border border-stroke rounded-lg p-4">
        <div className="flex items-center gap-6">
          <div className="relative shrink-0">
            <HydrationProgress totalMl={today.totalMl} goalMl={today.goalMl} />
          </div>
          <div className="flex-1 min-w-0">
            <HydrationQuickAdd onAdd={handleAdd} disabled={!isAdmin} />
          </div>
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
          <HydrationEntryList entries={today.entries} onDelete={handleDelete} interactive={isAdmin} />
        </div>
      )}

      {/* 90-day history chart */}
      <HydrationHistory dailyTotals={stats.dailyTotals} goalMl={today.goalMl} />
    </div>
  );
}
