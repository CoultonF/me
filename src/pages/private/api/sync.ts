import type { APIRoute } from 'astro';
import { getCloudflareEnv } from '@/lib/env';
import { createDb } from '@/lib/db/client';
import { getTidepoolSession } from '@/lib/tidepool/client';
import { syncGlucoseReadings, syncInsulinDoses, syncActivityData } from '@/lib/tidepool/sync';
import { syncStravaHeartRate } from '@/lib/strava/sync';

export const POST: APIRoute = async ({ url }) => {
  try {
    const cfEnv = await getCloudflareEnv();
    if (!cfEnv) {
      return new Response(JSON.stringify({ error: 'Cloudflare env unavailable' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = createDb(cfEnv.DB);
    const fromParam = url.searchParams.get('from'); // days ago for window start
    const toParam = url.searchParams.get('to');     // days ago for window end (default 0 = now)

    // Normal sync — small default windows, parallel
    if (!fromParam) {
      const [glucose, insulin, activity, strava] = await Promise.all([
        syncGlucoseReadings(db, cfEnv),
        syncInsulinDoses(db, cfEnv),
        syncActivityData(db, cfEnv),
        syncStravaHeartRate(db, cfEnv),
      ]);
      return new Response(JSON.stringify({ glucose, insulin, activity, strava }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Backfill — login once, optionally filter by type to stay within CPU limits
    const session = await getTidepoolSession(cfEnv);
    const fromDays = parseInt(fromParam, 10);
    const toDays = toParam ? parseInt(toParam, 10) : 0;
    const DAY = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const startMs = now - fromDays * DAY;
    const endMs = now - toDays * DAY;
    const typeParam = url.searchParams.get('type');

    const empty = { inserted: 0, skipped: 0 };
    const glucose = (!typeParam || typeParam === 'glucose')
      ? await syncGlucoseReadings(db, cfEnv, startMs, endMs, session) : empty;
    const insulin = (!typeParam || typeParam === 'insulin')
      ? await syncInsulinDoses(db, cfEnv, startMs, endMs, session) : empty;
    const activity = (!typeParam || typeParam === 'activity')
      ? await syncActivityData(db, cfEnv, startMs, endMs, session) : empty;
    const strava = (!typeParam || typeParam === 'strava')
      ? await syncStravaHeartRate(db, cfEnv, fromDays) : { matched: 0, unmatched: 0 };

    return new Response(JSON.stringify({ glucose, insulin, activity, strava }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[private/api/sync]', msg, e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
