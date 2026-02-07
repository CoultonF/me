import type { APIRoute } from 'astro';
import { getCloudflareEnv } from '@/lib/env';
import { createDb } from '@/lib/db/client';
import { getWorkouts, getActivityRange, getActivityStats, getRunningStats } from '@/lib/db/queries';
import type { ActivityAPIResponse } from '@/lib/types/activity';

const RANGE_MS: Record<string, number> = {
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  '90d': 90 * 24 * 60 * 60 * 1000,
};

const emptyResponse: ActivityAPIResponse = {
  workouts: [],
  dailySummaries: [],
  activityStats: { totalCalories: 0, totalExerciseMinutes: 0, avgCalories: 0, avgExerciseMinutes: 0, days: 0 },
  runningStats: { totalDistanceKm: 0, totalDurationSeconds: 0, avgPaceSecPerKm: 0, avgHeartRate: 0, workoutCount: 0 },
};

export const GET: APIRoute = async ({ url }) => {
  try {
    const cfEnv = await getCloudflareEnv();
    if (!cfEnv) {
      return new Response(JSON.stringify(emptyResponse), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = createDb(cfEnv.DB);

    const range = url.searchParams.get('range') ?? '7d';
    const ms = RANGE_MS[range] ?? RANGE_MS['7d']!;

    const now = new Date();
    const startDate = new Date(now.getTime() - ms).toISOString();
    const endDate = now.toISOString();

    const [workouts, dailySummaries, activityStats, runningStats] = await Promise.all([
      getWorkouts(db, startDate, endDate),
      getActivityRange(db, startDate, endDate),
      getActivityStats(db, startDate, endDate),
      getRunningStats(db, startDate, endDate),
    ]);

    const body: ActivityAPIResponse = { workouts, dailySummaries, activityStats, runningStats };

    return new Response(JSON.stringify(body), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[api/health/activity]', e);
    return new Response(JSON.stringify(emptyResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
