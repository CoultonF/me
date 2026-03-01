import type { APIRoute } from 'astro';
import { getCloudflareEnv } from '@/lib/env';
import { createDb } from '@/lib/db/client';
import { getHydrationToday, getHydrationStats, getHydrationGoal } from '@/lib/db/queries';
import type { HydrationAPIResponse } from '@/lib/types/hydration';

const emptyResponse: HydrationAPIResponse = {
  today: { date: '', totalMl: 0, goalMl: 2500, entries: [] },
  stats: { currentStreak: 0, avgDailyMl: 0, totalDays: 0, dailyTotals: [] },
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

    const [entries, goalMl] = await Promise.all([
      getHydrationToday(db, today),
      getHydrationGoal(db),
    ]);

    const totalMl = entries.reduce((s, e) => s + e.amountMl, 0);
    const stats = await getHydrationStats(db, ninetyDaysAgo, today, goalMl);

    const body: HydrationAPIResponse = {
      today: { date: today, totalMl, goalMl, entries },
      stats,
    };

    return new Response(JSON.stringify(body), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[api/health/hydration]', e);
    return new Response(JSON.stringify(emptyResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
