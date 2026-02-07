import type { APIRoute } from 'astro';
import { getCloudflareEnv } from '@/lib/env';
import { createDb } from '@/lib/db/client';
import { syncGlucoseReadings, syncInsulinDoses, syncActivityData } from '@/lib/tidepool/sync';

export const POST: APIRoute = async () => {
  try {
    const cfEnv = await getCloudflareEnv();
    if (!cfEnv) {
      return new Response(JSON.stringify({ error: 'Cloudflare env unavailable' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = createDb(cfEnv.DB);

    const [glucose, insulin, activity] = await Promise.all([
      syncGlucoseReadings(db, cfEnv),
      syncInsulinDoses(db, cfEnv),
      syncActivityData(db, cfEnv),
    ]);

    return new Response(JSON.stringify({ glucose, insulin, activity }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[api/health/sync]', e);
    return new Response(JSON.stringify({ error: 'Sync failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
