import { useState, useEffect, useCallback } from 'react';
import type { ActivityAPIResponse } from '../lib/types/activity';
import ActivityRings from './activity/ActivityRings';
import WeeklyActivityChart from './activity/WeeklyActivityChart';
import ActivityTrends from './activity/ActivityTrends';
import WorkoutList from './activity/WorkoutList';
import ActivitySummaryCards from './activity/ActivitySummaryCards';
import DateRangePicker from './activity/DateRangePicker';

type Range = '7d' | '30d' | '90d';

interface Props {
  initialRange?: Range;
}

const EMPTY_ACTIVITY_STATS = {
  totalCalories: 0,
  totalExerciseMinutes: 0,
  avgCalories: 0,
  avgExerciseMinutes: 0,
  days: 0,
};

const EMPTY_RUNNING_STATS = {
  totalDistanceKm: 0,
  totalDurationSeconds: 0,
  avgPaceSecPerKm: 0,
  avgHeartRate: 0,
  workoutCount: 0,
};

export default function ActivityDashboard({ initialRange = '7d' }: Props) {
  const [range, setRange] = useState<Range>(initialRange);
  const [data, setData] = useState<ActivityAPIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchData = useCallback(async (r: Range) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/health/activity?range=${r}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as ActivityAPIResponse;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(range);
  }, [range, fetchData]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/health/sync', { method: 'POST' });
      if (!res.ok) throw new Error(`Sync failed: ${res.status}`);
      await fetchData(range);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-heading">Activity</h2>
          <DateRangePicker selected={range} onChange={setRange} />
        </div>
        <div className="bg-tile border border-stroke rounded-lg p-8 text-center">
          <div className="text-dim">{error}</div>
          <button
            onClick={() => fetchData(range)}
            className="mt-3 text-sm text-accent hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const activityStats = data?.activityStats ?? EMPTY_ACTIVITY_STATS;
  const runningStats = data?.runningStats ?? EMPTY_RUNNING_STATS;

  // Compute today's totals for rings from daily summaries
  const today = new Date().toISOString().slice(0, 10);
  const todaySummary = data?.dailySummaries.find((d) => d.date === today);
  const todayCalories = todaySummary?.activeCalories ?? 0;
  const todayExercise = todaySummary?.exerciseMinutes ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-heading">Activity</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="text-xs font-medium text-subtle border border-stroke rounded-md px-3 py-1.5 hover:text-accent hover:border-accent transition-colors disabled:opacity-50"
          >
            {syncing ? 'Syncing...' : 'Sync'}
          </button>
          <DateRangePicker selected={range} onChange={setRange} />
        </div>
      </div>

      {loading && !data ? (
        <div className="bg-tile border border-stroke rounded-lg p-8 text-center">
          <div className="text-dim">Loading activity data...</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ActivityRings activeCalories={todayCalories} exerciseMinutes={todayExercise} />
            <div className="md:col-span-2">
              <WeeklyActivityChart dailySummaries={data?.dailySummaries ?? []} />
            </div>
          </div>
          <ActivityTrends dailySummaries={data?.dailySummaries ?? []} />
          <WorkoutList workouts={data?.workouts ?? []} />
          <ActivitySummaryCards activityStats={activityStats} runningStats={runningStats} />
        </>
      )}
    </div>
  );
}
