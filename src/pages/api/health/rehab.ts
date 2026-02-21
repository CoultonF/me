import type { APIRoute } from 'astro';
import { getCloudflareEnv } from '@/lib/env';
import { createDb } from '@/lib/db/client';
import { getRehabLog, getRehabStats, getInjuryPeriod } from '@/lib/db/queries';
import type { RehabAPIResponse } from '@/lib/types/rehab';

const emptyResponse: RehabAPIResponse = {
  today: { date: '', completedIds: [] },
  stats: { currentStreak: 0, totalDays: 0, totalExercises: 0, dailyCounts: [] },
  injuryPeriod: null,
};

export const GET: APIRoute = async () => {
  try {
    const cfEnv = await getCloudflareEnv();
    if (!cfEnv) {
      return new Response(JSON.stringify(emptyResponse), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = createDb(cfEnv.DB);
    const today = new Date().toISOString().slice(0, 10);
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const [completedIds, stats, injuryPeriod] = await Promise.all([
      getRehabLog(db, today),
      getRehabStats(db, ninetyDaysAgo, today),
      getInjuryPeriod(db),
    ]);

    const body: RehabAPIResponse = {
      today: { date: today, completedIds },
      stats,
      injuryPeriod,
    };

    return new Response(JSON.stringify(body), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[api/health/rehab]', e);
    return new Response(JSON.stringify(emptyResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
