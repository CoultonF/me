import type { APIRoute } from 'astro';
import { getCloudflareEnv } from '@/lib/env';
import { createDb } from '@/lib/db/client';
import { getHydrationToday, getHydrationStats, getHydrationGoal } from '@/lib/db/queries';
import type { HydrationAPIResponse } from '@/lib/types/hydration';

const emptyResponse: HydrationAPIResponse = {
  today: { date: '', totalMl: 0, goalMl: 2500, entries: [] },
  stats: { currentStreak: 0, avgDailyMl: 0, totalDays: 0, dailyTotals: [] },
};

export const GET: APIRoute = async ({ request }) => {
  try {
    const cfEnv = await getCloudflareEnv();
    if (!cfEnv) {
      return new Response(JSON.stringify(emptyResponse), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = createDb(cfEnv.DB);
    const url = new URL(request.url);
    const todayParam = url.searchParams.get('today');
    const today = todayParam && /^\d{4}-\d{2}-\d{2}$/.test(todayParam)
      ? todayParam
      : new Date().toISOString().slice(0, 10);
    const tzParam = parseInt(url.searchParams.get('tz') ?? '', 10);
    const tzOffset = !isNaN(tzParam) && tzParam >= -720 && tzParam <= 840 ? tzParam : 0;
    const ninetyDaysAgo = (() => {
      const d = new Date(today + 'T00:00:00');
      d.setDate(d.getDate() - 90);
      return d.toISOString().slice(0, 10);
    })();

    const [entries, goalMl] = await Promise.all([
      getHydrationToday(db, today, tzOffset),
      getHydrationGoal(db),
    ]);

    const totalMl = entries.reduce((s, e) => s + e.amountMl, 0);
    const stats = await getHydrationStats(db, ninetyDaysAgo, today, goalMl, tzOffset);

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
