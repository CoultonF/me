import { useState, useEffect, useCallback } from 'react';
import type { StephActivityAPIResponse } from '../lib/types/steph-activity';
import StephActivityRings from './steph-activity/StephActivityRings';
import StephDailyCaloriesChart from './steph-activity/StephDailyCaloriesChart';
import StephActivityTrends from './steph-activity/StephActivityTrends';
import StephActivitySummaryCards from './steph-activity/StephActivitySummaryCards';
import StephWorkoutSummaryCards from './steph-activity/StephWorkoutSummaryCards';
import StephWeeklyVolume from './steph-activity/StephWeeklyVolume';
import WorkoutTypeBreakdownChart from './steph-activity/WorkoutTypeBreakdown';
import StephWorkoutList from './steph-activity/StephWorkoutList';
import StephHRTrends from './steph-activity/StephHRTrends';
import StephHRZoneBar from './steph-activity/StephHRZoneBar';
import StephSleepCharts from './steph-activity/StephSleepCharts';
import TrainingLoadChart from './steph-activity/TrainingLoadChart';
import RecoveryReadiness from './steph-activity/RecoveryReadiness';
import DateRangePicker from './activity/DateRangePicker';
import ErrorBoundary from './shared/ErrorBoundary';
import { CardsSkeleton, ChartSkeleton } from './shared/DashboardSkeleton';

type Range = '7d' | '30d' | '90d';

interface Props {
  initialRange?: Range;
}

const EMPTY_ACTIVITY_STATS = { avgCalories: 0, totalExercise: 0, totalSteps: 0, days: 0 };
const EMPTY_WORKOUT_STATS = { count: 0, totalDistanceKm: 0, avgHR: 0, totalDurationSeconds: 0 };
const EMPTY_SLEEP_STATS = { avgTotalMinutes: 0, avgRemMinutes: 0, avgDeepMinutes: 0, avgCoreMinutes: 0, avgAwakeMinutes: 0, nights: 0 };
const EMPTY_HR_ZONES = { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 };

export default function StephActivityDashboard({ initialRange = '30d' }: Props) {
  const [range, setRange] = useState<Range>(initialRange);
  const [data, setData] = useState<StephActivityAPIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (r: Range) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/private/api/steph-activity?range=${r}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as StephActivityAPIResponse;
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

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-heading">Steph&apos;s Activity</h2>
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
  const workoutStats = data?.workoutStats ?? EMPTY_WORKOUT_STATS;
  const sleepStats = data?.sleepStats ?? EMPTY_SLEEP_STATS;

  // Today's totals for rings
  const today = new Date().toISOString().slice(0, 10);
  const todaySummary = data?.dailyActivity.find((d) => d.date === today);
  const todayCalories = todaySummary?.activeCalories ?? 0;
  const todayExercise = todaySummary?.exerciseMinutes ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-heading">Steph&apos;s Activity</h2>
        <DateRangePicker selected={range} onChange={setRange} />
      </div>

      {loading && !data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ChartSkeleton height={200} />
            <div className="md:col-span-2"><ChartSkeleton height={200} /></div>
          </div>
          <ChartSkeleton />
          <CardsSkeleton count={3} columns={3} />
          <ChartSkeleton height={280} />
          <ChartSkeleton />
          <CardsSkeleton count={4} columns={4} />
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      ) : (
        <>
          {/* ── Activity ── */}
          <ErrorBoundary fallbackTitle="Activity rings failed to load">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StephActivityRings activeCalories={todayCalories} exerciseMinutes={todayExercise} />
              <div className="md:col-span-2">
                <StephDailyCaloriesChart dailyActivity={data?.dailyActivity ?? []} />
              </div>
            </div>
          </ErrorBoundary>

          <ErrorBoundary fallbackTitle="Activity trends failed to load">
            <StephActivityTrends dailyActivity={data?.dailyActivity ?? []} />
          </ErrorBoundary>

          <ErrorBoundary fallbackTitle="Summary cards failed to load">
            <StephActivitySummaryCards stats={activityStats} />
          </ErrorBoundary>

          {/* ── Training Load & Injury Risk ── */}
          <div className="space-y-2 mt-8">
            <div className="text-xs font-medium text-dim uppercase tracking-wide">Training Load & Injury Risk</div>
          </div>

          <ErrorBoundary fallbackTitle="Training load chart failed to load">
            <TrainingLoadChart trainingLoadActivity={data?.trainingLoadActivity ?? []} />
          </ErrorBoundary>

          <ErrorBoundary fallbackTitle="Recovery readiness failed to load">
            <RecoveryReadiness
              heartRate={data?.heartRate ?? []}
              sleep={data?.sleep ?? []}
            />
          </ErrorBoundary>

          {/* ── Workouts ── */}
          <div className="space-y-2 mt-8">
            <div className="text-xs font-medium text-dim uppercase tracking-wide">Workouts</div>
          </div>

          <ErrorBoundary fallbackTitle="Workout summary failed to load">
            <StephWorkoutSummaryCards stats={workoutStats} />
          </ErrorBoundary>

          <ErrorBoundary fallbackTitle="Weekly volume failed to load">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StephWeeklyVolume weeklyVolume={data?.weeklyWorkoutVolume ?? []} />
              <WorkoutTypeBreakdownChart breakdown={data?.workoutTypeBreakdown ?? []} />
            </div>
          </ErrorBoundary>

          <ErrorBoundary fallbackTitle="Workout list failed to load">
            <StephWorkoutList workouts={data?.workouts ?? []} />
          </ErrorBoundary>

          {/* ── Heart Rate & Recovery ── */}
          <div className="space-y-2 mt-8">
            <div className="text-xs font-medium text-dim uppercase tracking-wide">Heart Rate & Recovery</div>
          </div>

          <ErrorBoundary fallbackTitle="HR trends failed to load">
            <StephHRTrends heartRate={data?.heartRate ?? []} />
          </ErrorBoundary>

          <ErrorBoundary fallbackTitle="HR zones failed to load">
            <StephHRZoneBar hrZones={data?.hrZones ?? EMPTY_HR_ZONES} />
          </ErrorBoundary>

          {/* ── Sleep ── */}
          <div className="space-y-2 mt-8">
            <div className="text-xs font-medium text-dim uppercase tracking-wide">Sleep</div>
          </div>

          <ErrorBoundary fallbackTitle="Sleep charts failed to load">
            <StephSleepCharts sleep={data?.sleep ?? []} sleepStats={sleepStats} />
          </ErrorBoundary>
        </>
      )}
    </div>
  );
}
