import { useState, useEffect, useCallback } from 'react';
import type { ActivityAPIResponse } from '../lib/types/activity';
import type { TrainingAPIResponse } from '../lib/types/training';
import type { RaceWithResult, RacesAPIResponse } from '../lib/types/races';
import type { RehabAPIResponse } from '../lib/types/rehab';
import ActivityRings from './activity/ActivityRings';
import WeeklyActivityChart from './activity/WeeklyActivityChart';
import ActivityTrends from './activity/ActivityTrends';
import WorkoutList from './activity/WorkoutList';
import ActivitySummaryCards from './activity/ActivitySummaryCards';
import ActivityCalendar from './activity/ActivityCalendar';
import DateRangePicker from './activity/DateRangePicker';
import RunningSummaryCards from './running/RunningSummaryCards';
import PaceProgression from './running/PaceProgression';
import DistanceVolume from './running/DistanceVolume';
import HRAnalysis from './running/HRAnalysis';
import TargetRaceCountdown from './races/TargetRaceCountdown';
import TrainingSchedule from './training/TrainingSchedule';
import RehabChecklist from './rehab/RehabChecklist';
import ErrorBoundary from './shared/ErrorBoundary';
import { CardsSkeleton, ChartSkeleton } from './shared/DashboardSkeleton';
import { useAuth } from './shared/useAuth';

type Range = string;

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
  longestRunKm: 0,
  fastestPaceSecPerKm: 0,
  totalElevationGainM: 0,
  totalActiveCalories: 0,
};

const EMPTY_HR_ZONES = { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 };

export default function ActivityDashboard({ initialRange = '7d' }: Props) {
  const [range, setRange] = useState<Range>(initialRange);
  const [data, setData] = useState<ActivityAPIResponse | null>(null);
  const [trainingData, setTrainingData] = useState<TrainingAPIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const isAdmin = useAuth();

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

  // One-time fetches for data independent of activity range
  const [races, setRaces] = useState<RaceWithResult[]>([]);
  const [injuryPeriod, setInjuryPeriod] = useState<RehabAPIResponse['injuryPeriod']>(null);

  useEffect(() => {
    fetch('/api/health/training?range=all')
      .then((r) => r.ok ? r.json() as Promise<TrainingAPIResponse> : null)
      .then((d) => { if (d) setTrainingData(d); })
      .catch(() => {});
    fetch('/api/health/races')
      .then((r) => r.ok ? r.json() as Promise<RacesAPIResponse> : null)
      .then((d) => { if (d) setRaces([...d.completed, ...d.upcoming]); })
      .catch(() => {});
    fetch('/api/health/rehab')
      .then((r) => r.ok ? r.json() as Promise<RehabAPIResponse> : null)
      .then((d) => { if (d) setInjuryPeriod(d.injuryPeriod); })
      .catch(() => {});
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/private/api/sync', { method: 'POST' });
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
      <div className="sticky top-0 z-20 bg-page py-3 -mt-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-heading">Activity</h2>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={handleSync}
                disabled={syncing}
                className="text-xs font-medium text-subtle border border-stroke rounded-md px-3 py-1.5 hover:text-accent hover:border-accent transition-colors disabled:opacity-50"
              >
                {syncing ? 'Syncing...' : 'Sync'}
              </button>
            )}
            <DateRangePicker selected={range} onChange={setRange} />
          </div>
        </div>
      </div>

      {loading && !data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ChartSkeleton height={200} />
            <div className="md:col-span-2"><ChartSkeleton height={200} /></div>
          </div>
          <ChartSkeleton height={120} />
          <ChartSkeleton />
          <CardsSkeleton count={6} columns={3} />
          <ChartSkeleton />
          <ChartSkeleton height={280} />
        </div>
      ) : (
        <>
          <ErrorBoundary fallbackTitle="Activity rings failed to load">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ActivityRings activeCalories={todayCalories} exerciseMinutes={todayExercise} />
              <div className="md:col-span-2">
                <WeeklyActivityChart dailySummaries={data?.dailySummaries ?? []} />
              </div>
            </div>
          </ErrorBoundary>

          <ErrorBoundary fallbackTitle="Activity calendar failed to load">
            <ActivityCalendar
              workouts={data?.workouts ?? []}
              range={range}
              races={races}
              trainingWorkouts={trainingData?.workouts}
              injuryPeriod={injuryPeriod}
            />
          </ErrorBoundary>

          <ErrorBoundary fallbackTitle="Activity trends failed to load">
            <ActivityTrends dailySummaries={data?.dailySummaries ?? []} />
          </ErrorBoundary>

          <ErrorBoundary fallbackTitle="Summary cards failed to load">
            <ActivitySummaryCards activityStats={activityStats} />
          </ErrorBoundary>

          {/* ── Target race countdown ── */}
          <ErrorBoundary fallbackTitle="Target race countdown failed to load">
            <TargetRaceCountdown />
          </ErrorBoundary>

          {/* ── Training plan schedule ── */}
          {trainingData && trainingData.stats.totalWorkouts > 0 && (
            <ErrorBoundary fallbackTitle="Training schedule failed to load">
              <TrainingSchedule data={trainingData} />
            </ErrorBoundary>
          )}

          {/* ── Rehab protocol ── */}
          <ErrorBoundary fallbackTitle="Rehab protocol failed to load">
            <RehabChecklist />
          </ErrorBoundary>

          {/* ── Running analytics ── */}
          <ErrorBoundary fallbackTitle="Running summary failed to load">
            <RunningSummaryCards stats={runningStats} />
          </ErrorBoundary>

          <ErrorBoundary fallbackTitle="Pace chart failed to load">
            <PaceProgression paceHistory={data?.paceHistory ?? []} />
          </ErrorBoundary>

          <ErrorBoundary fallbackTitle="Distance chart failed to load">
            <DistanceVolume weeklyDistances={data?.weeklyDistances ?? []} plannedWeeklyVolume={trainingData?.stats.weeklyVolume} />
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
