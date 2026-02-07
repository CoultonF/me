import { useState, useEffect, useCallback } from 'react';
import type { RunningAPIResponse } from '../lib/types/running';
import DateRangePicker, { type Range } from './running/DateRangePicker';
import RunningSummaryCards from './running/RunningSummaryCards';
import PaceProgression from './running/PaceProgression';
import DistanceVolume from './running/DistanceVolume';
import TrainingCalendar from './running/TrainingCalendar';
import HRAnalysis from './running/HRAnalysis';
import WorkoutList from './activity/WorkoutList';
import ErrorBoundary from './shared/ErrorBoundary';
import { CardsSkeleton, ChartSkeleton } from './shared/DashboardSkeleton';

interface Props {
  initialRange?: Range;
}

const EMPTY_STATS = {
  totalDistanceKm: 0, totalDurationSeconds: 0, avgPaceSecPerKm: 0, avgHeartRate: 0,
  workoutCount: 0, longestRunKm: 0, fastestPaceSecPerKm: 0, totalElevationGainM: 0, totalActiveCalories: 0,
};

const EMPTY_HR_ZONES = { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 };

export default function RunningDashboard({ initialRange = '90d' }: Props) {
  const [range, setRange] = useState<Range>(initialRange);
  const [data, setData] = useState<RunningAPIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchData = useCallback(async (r: Range) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/health/running?range=${r}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as RunningAPIResponse;
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
          <h2 className="text-lg font-semibold text-heading">Running</h2>
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

  const stats = data?.stats ?? EMPTY_STATS;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-heading">Running</h2>
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
        <div className="space-y-6">
          <CardsSkeleton count={6} columns={3} />
          <ChartSkeleton />
          <ChartSkeleton height={280} />
        </div>
      ) : (
        <>
          <ErrorBoundary fallbackTitle="Summary cards failed to load">
            <RunningSummaryCards stats={stats} />
          </ErrorBoundary>

          <ErrorBoundary fallbackTitle="Pace chart failed to load">
            <PaceProgression paceHistory={data?.paceHistory ?? []} />
          </ErrorBoundary>

          <ErrorBoundary fallbackTitle="Distance chart failed to load">
            <DistanceVolume weeklyDistances={data?.weeklyDistances ?? []} />
          </ErrorBoundary>

          <ErrorBoundary fallbackTitle="Training calendar failed to load">
            <TrainingCalendar />
          </ErrorBoundary>

          <ErrorBoundary fallbackTitle="HR analysis failed to load">
            <HRAnalysis
              hrZones={data?.hrZones ?? EMPTY_HR_ZONES}
              paceHRCorrelation={data?.paceHRCorrelation ?? []}
              workouts={data?.workouts ?? []}
            />
          </ErrorBoundary>

          <ErrorBoundary fallbackTitle="Workout list failed to load">
            <WorkoutList workouts={data?.workouts ?? []} />
          </ErrorBoundary>
        </>
      )}
    </div>
  );
}
