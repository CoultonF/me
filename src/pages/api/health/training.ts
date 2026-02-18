import type { APIRoute } from 'astro';
import { getCloudflareEnv } from '@/lib/env';
import { createDb } from '@/lib/db/client';
import { getTrainingPlan, getTrainingPlanStats } from '@/lib/db/queries';
import type { TrainingAPIResponse } from '@/lib/types/training';

const emptyResponse: TrainingAPIResponse = {
  workouts: [],
  stats: {
    totalWorkouts: 0,
    totalPlannedKm: 0,
    completedCount: 0,
    skippedCount: 0,
    upcomingCount: 0,
    weeklyVolume: [],
    nextWorkout: null,
  },
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
    const range = url.searchParams.get('range') ?? 'all';

    let startDate: string | undefined;
    let endDate: string | undefined;
    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    if (range === 'upcoming') {
      startDate = today;
    } else if (range === 'week') {
      startDate = today;
      const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      endDate = weekEnd.toISOString().slice(0, 10);
    }
    // range === 'all' leaves both undefined → returns everything

    const [workouts, stats] = await Promise.all([
      getTrainingPlan(db, startDate, endDate),
      getTrainingPlanStats(db),
    ]);

    const body: TrainingAPIResponse = { workouts, stats };

    return new Response(JSON.stringify(body), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[api/health/training]', e);
    return new Response(JSON.stringify(emptyResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
