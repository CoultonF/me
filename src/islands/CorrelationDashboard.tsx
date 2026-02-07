import { useState, useEffect } from 'react';
import type { GlucoseAPIResponse } from '../lib/types/glucose';
import type { ActivityAPIResponse } from '../lib/types/activity';
import type { InsulinAPIResponse } from '../lib/types/insulin';
import type { MergedDay } from './correlation/types';
import CorrelationStats from './correlation/CorrelationStats';
import BlendedCalendar from './correlation/BlendedCalendar';
import WeeklyTrendChart from './correlation/WeeklyTrendChart';
import ErrorBoundary from './shared/ErrorBoundary';
import { CardsSkeleton, ChartSkeleton } from './shared/DashboardSkeleton';

function mergeDays(
  glucose: GlucoseAPIResponse | null,
  activity: ActivityAPIResponse | null,
  insulin: InsulinAPIResponse | null,
): MergedDay[] {
  const map = new Map<string, MergedDay>();

  // Initialize 365 days
  const now = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    map.set(key, {
      date: key,
      tirPercent: null,
      glucoseReadingCount: 0,
      exerciseMinutes: null,
      workoutCount: 0,
      workoutNames: [],
      totalDistanceKm: 0,
      insulinTotal: null,
      bolusTotal: 0,
      basalTotal: 0,
    });
  }

  // Merge glucose TIR
  if (glucose?.dailyTIR) {
    for (const tir of glucose.dailyTIR) {
      const entry = map.get(tir.date);
      if (entry) {
        entry.tirPercent = tir.tirPercent;
        entry.glucoseReadingCount = tir.count;
      }
    }
  }

  // Merge activity — exercise from daily summaries, workouts for details
  if (activity) {
    for (const ds of activity.dailySummaries) {
      const entry = map.get(ds.date);
      if (entry) {
        entry.exerciseMinutes = ds.exerciseMinutes ?? 0;
      }
    }
    for (const w of activity.workouts) {
      const key = w.startTime.slice(0, 10);
      const entry = map.get(key);
      if (entry) {
        entry.workoutCount++;
        entry.totalDistanceKm += w.distanceKm ?? 0;
        if (w.activityName && !entry.workoutNames.includes(w.activityName)) {
          entry.workoutNames.push(w.activityName);
        }
      }
    }
  }

  // Merge insulin
  if (insulin) {
    for (const dt of insulin.dailyTotals) {
      const entry = map.get(dt.date);
      if (entry) {
        entry.insulinTotal = dt.bolusTotal + dt.basalTotal;
        entry.bolusTotal = dt.bolusTotal;
        entry.basalTotal = dt.basalTotal;
      }
    }
  }

  return Array.from(map.values());
}

export default function CorrelationDashboard() {
  const [days, setDays] = useState<MergedDay[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const glucoseP = fetch('/api/health/glucose?range=365d')
      .then((r) => r.json() as Promise<GlucoseAPIResponse>)
      .catch(() => null);

    const activityP = fetch('/api/health/activity?range=365d')
      .then((r) => r.json() as Promise<ActivityAPIResponse>)
      .catch(() => null);

    const insulinP = fetch('/api/health/insulin?range=365d')
      .then((r) => r.json() as Promise<InsulinAPIResponse>)
      .catch(() => null);

    Promise.all([glucoseP, activityP, insulinP]).then(([g, a, i]) => {
      setDays(mergeDays(g, a, i));
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-heading">Dashboard</h2>

      {loading || !days ? (
        <div className="space-y-6">
          <CardsSkeleton count={3} columns={3} />
          <ChartSkeleton height={200} />
          <ChartSkeleton height={260} />
        </div>
      ) : (
        <>
          <ErrorBoundary fallbackTitle="Correlation stats failed to load">
            <CorrelationStats days={days} />
          </ErrorBoundary>

          <ErrorBoundary fallbackTitle="Blended calendar failed to load">
            <BlendedCalendar days={days} />
          </ErrorBoundary>

          <ErrorBoundary fallbackTitle="Weekly trend chart failed to load">
            <WeeklyTrendChart days={days} />
          </ErrorBoundary>
        </>
      )}
    </div>
  );
}
