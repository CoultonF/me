import type { APIRoute } from 'astro';
import { getCloudflareEnv } from '@/lib/env';
import { createDb } from '@/lib/db/client';
import { getLatestGlucose, getGlucoseRange, getGlucoseStats } from '@/lib/db/queries';
import type { GlucoseAPIResponse } from '@/lib/types/glucose';

const RANGE_MS: Record<string, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

const emptyResponse: GlucoseAPIResponse = {
  latest: null,
  readings: [],
  stats: { min: 0, max: 0, avg: 0, count: 0, timeInRange: { low: 0, normal: 0, high: 0, veryHigh: 0 } },
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

    const range = url.searchParams.get('range') ?? '24h';
    const ms = RANGE_MS[range] ?? RANGE_MS['24h']!;

    const now = new Date();
    const startDate = new Date(now.getTime() - ms).toISOString();
    const endDate = now.toISOString();

    const [latest, readings, stats] = await Promise.all([
      getLatestGlucose(db),
      getGlucoseRange(db, startDate, endDate),
      getGlucoseStats(db, startDate, endDate),
    ]);

    const body: GlucoseAPIResponse = {
      latest: latest ? { timestamp: latest.timestamp, value: latest.value, trend: latest.trend } : null,
      readings: readings.map((r) => ({ timestamp: r.timestamp, value: r.value, trend: r.trend })),
      stats,
    };

    return new Response(JSON.stringify(body), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[api/health/glucose]', e);
    return new Response(JSON.stringify(emptyResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
