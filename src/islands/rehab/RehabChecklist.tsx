import { useState, useEffect, useCallback } from 'react';
import type { RehabAPIResponse, RehabStatsResponse } from '../../lib/types/rehab';
import { getExercisesByCategory, TOTAL_EXERCISES } from '../../lib/rehab-exercises';
import type { RehabCategory } from '../../lib/rehab-exercises';
import { useAuth } from '../shared/useAuth';
import RehabStats from './RehabStats';
import RehabCategorySection from './RehabCategorySection';

const CATEGORY_ORDER: RehabCategory[] = ['strengthening', 'mobility', 'pre-run'];
const exercisesByCategory = getExercisesByCategory();

const EMPTY_STATS: RehabStatsResponse = {
  currentStreak: 0,
  totalDays: 0,
  totalExercises: 0,
  dailyCounts: [],
};

export default function RehabChecklist() {
  const isAdmin = useAuth();
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<RehabStatsResponse>(EMPTY_STATS);
  const [injuryPeriod, setInjuryPeriod] = useState<{ start: string; end: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    fetch('/api/health/rehab')
      .then((r) => r.json() as Promise<RehabAPIResponse>)
      .then((data) => {
        setCompletedIds(new Set(data.today.completedIds));
        setStats(data.stats);
        setInjuryPeriod(data.injuryPeriod);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = useCallback(async (exerciseId: string) => {
    // Optimistic update
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }
      return next;
    });

    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await fetch('/private/api/rehab-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', date: today, exerciseId }),
      });
      if (!res.ok) throw new Error('Toggle failed');
    } catch {
      // Rollback
      setCompletedIds((prev) => {
        const next = new Set(prev);
        if (next.has(exerciseId)) {
          next.delete(exerciseId);
        } else {
          next.add(exerciseId);
        }
        return next;
      });
    }
  }, []);

  const handleEndInjury = async () => {
    setEnding(true);
    try {
      const res = await fetch('/private/api/rehab-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end-injury' }),
      });
      if (!res.ok) throw new Error('Failed to mark recovered');
      const data = await res.json() as { ok: boolean; endDate: string };
      setInjuryPeriod((prev) => prev ? { ...prev, end: data.endDate } : null);
    } catch {
      // ignore
    } finally {
      setEnding(false);
    }
  };

  // Don't render if injury has ended
  if (!loading && injuryPeriod?.end) return null;

  if (loading) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-4">
        <div className="text-xs text-dim">Loading rehab protocol...</div>
      </div>
    );
  }

  const todayCount = completedIds.size;
  const allDone = todayCount === TOTAL_EXERCISES;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-dim uppercase tracking-wide">Rehab Protocol</div>
        {isAdmin && injuryPeriod && !injuryPeriod.end && (
          <button
            onClick={handleEndInjury}
            disabled={ending}
            className="text-xs font-medium text-subtle border border-stroke rounded-md px-3 py-1.5 hover:text-green-500 hover:border-green-500 transition-colors disabled:opacity-50"
          >
            {ending ? 'Marking...' : 'Mark Recovered'}
          </button>
        )}
      </div>

      {allDone && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3 text-sm text-green-600">
          All exercises completed for today!
        </div>
      )}

      <RehabStats todayCount={todayCount} stats={stats} />

      <div className="space-y-3">
        {CATEGORY_ORDER.map((cat) => (
          <RehabCategorySection
            key={cat}
            category={cat}
            exercises={exercisesByCategory[cat]}
            completedIds={completedIds}
            interactive={isAdmin}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </div>
  );
}
