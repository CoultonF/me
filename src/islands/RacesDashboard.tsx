import { useState, useEffect } from 'react';
import type { RacesAPIResponse } from '../lib/types/races';
import type { TrainingStats, TrainingAPIResponse } from '../lib/types/training';
import TargetRaceWidget from './races/TargetRaceWidget';
import RaceStatsCards from './races/RaceStatsCards';
import PersonalBests from './races/PersonalBests';
import UpcomingRaces from './races/UpcomingRaces';
import RaceHistory from './races/RaceHistory';
import ErrorBoundary from './shared/ErrorBoundary';
import { CardsSkeleton, ChartSkeleton } from './shared/DashboardSkeleton';

const emptyResponse: RacesAPIResponse = {
  completed: [],
  upcoming: [],
  target: null,
  stats: { totalRaces: 0, personalBests: [] },
};

export default function RacesDashboard() {
  const [data, setData] = useState<RacesAPIResponse | null>(null);
  const [trainingStats, setTrainingStats] = useState<TrainingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/health/races');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as RacesAPIResponse;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Fetch training stats for the target race widget
  useEffect(() => {
    fetch('/api/health/training?range=all')
      .then((r) => r.ok ? r.json() as Promise<TrainingAPIResponse> : null)
      .then((d) => { if (d) setTrainingStats(d.stats); })
      .catch(() => {});
  }, []);

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-heading">Races</h2>
        <div className="bg-tile border border-stroke rounded-lg p-8 text-center">
          <div className="text-dim">{error}</div>
          <button onClick={fetchData} className="mt-3 text-sm text-accent hover:underline">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { completed, upcoming, target, stats } = data ?? emptyResponse;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-heading">Races</h2>

      {loading && !data ? (
        <div className="space-y-6">
          <ChartSkeleton height={120} />
          <CardsSkeleton count={2} columns={2} />
          <ChartSkeleton height={100} />
          <ChartSkeleton />
        </div>
      ) : (
        <>
          {target && (
            <ErrorBoundary fallbackTitle="Target race widget failed to load">
              <TargetRaceWidget target={target} trainingStats={trainingStats} />
            </ErrorBoundary>
          )}

          <ErrorBoundary fallbackTitle="Race stats failed to load">
            <RaceStatsCards stats={stats} />
          </ErrorBoundary>

          {stats.personalBests.length > 0 && (
            <ErrorBoundary fallbackTitle="Personal bests failed to load">
              <PersonalBests personalBests={stats.personalBests} />
            </ErrorBoundary>
          )}

          {upcoming.length > 0 && (
            <ErrorBoundary fallbackTitle="Upcoming races failed to load">
              <UpcomingRaces races={upcoming} />
            </ErrorBoundary>
          )}

          <ErrorBoundary fallbackTitle="Race history failed to load">
            <RaceHistory races={completed} />
          </ErrorBoundary>
        </>
      )}
    </div>
  );
}
