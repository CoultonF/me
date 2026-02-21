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
          <div className="flex items-center gap-2">
            <RecoveryGuidelines />
            <button
              onClick={handleEndInjury}
              disabled={ending}
              className="text-xs font-medium text-subtle border border-stroke rounded-md px-3 py-1.5 hover:text-green-500 hover:border-green-500 transition-colors disabled:opacity-50"
            >
              {ending ? 'Marking...' : 'Mark Recovered'}
            </button>
          </div>
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

function RecoveryGuidelines() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`size-7 flex items-center justify-center rounded-md transition-colors hover:bg-panel ${open ? 'text-accent' : 'text-ghost'}`}
        aria-label="Recovery guidelines"
      >
        <svg className="size-4" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6.5 6.5a1.5 1.5 0 1 1 2.1 1.38c-.42.18-.6.46-.6.87V9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-20 w-72 bg-tile border border-stroke rounded-lg p-3 shadow-lg text-xs text-subtle leading-relaxed space-y-1.5">
          <div className="font-medium text-heading text-[11px] uppercase tracking-wide">When to mark recovered</div>
          <ul className="list-disc pl-4 space-y-1">
            <li>No pain during or after running for 2+ consecutive weeks</li>
            <li>Single-leg calf raise pain-free with full range of motion</li>
            <li>Can hop on the affected foot 10+ times without discomfort</li>
            <li>No morning stiffness or tenderness along the inner ankle</li>
          </ul>
          <p className="text-dim">If pain returns during a run, stop and continue rehab exercises before marking recovered.</p>
        </div>
      )}
    </div>
  );
}
