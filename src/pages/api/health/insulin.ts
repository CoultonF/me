import type { APIRoute } from 'astro';
import { getCloudflareEnv } from '@/lib/env';
import { createDb } from '@/lib/db/client';
import { getInsulinRange, getInsulinDailyTotals, getInsulinStats } from '@/lib/db/queries';
import type { InsulinAPIResponse } from '@/lib/types/insulin';

const RANGE_MS: Record<string, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  '90d': 90 * 24 * 60 * 60 * 1000,
};

const emptyResponse: InsulinAPIResponse = {
  doses: [],
  dailyTotals: [],
  stats: { totalBolus: 0, totalBasal: 0, total: 0, avgDailyTotal: 0, bolusPercent: 0, basalPercent: 0, bolusCount: 0, days: 0 },
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

    const [doses, dailyTotals, stats] = await Promise.all([
      getInsulinRange(db, startDate, endDate),
      getInsulinDailyTotals(db, startDate, endDate),
      getInsulinStats(db, startDate, endDate),
    ]);

    const body: InsulinAPIResponse = { doses, dailyTotals, stats };

    return new Response(JSON.stringify(body), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[api/health/insulin]', e);
    return new Response(JSON.stringify(emptyResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
