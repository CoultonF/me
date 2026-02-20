import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../../src/lib/db/schema';
import { syncGlucoseReadings, syncInsulinDoses, syncActivityData } from '../../src/lib/tidepool/sync';
import { syncStravaHeartRate } from '../../src/lib/strava/sync';
import { syncGitHub } from '../../src/lib/github/sync';

interface Env {
  DB: D1Database;
  TIDEPOOL_EMAIL: string;
  TIDEPOOL_PASSWORD: string;
  STRAVA_CLIENT_ID: string;
  STRAVA_CLIENT_SECRET: string;
  GITHUB_TOKEN: string;
  GITHUB_USERNAME: string;
  SYNC_SECRET?: string;
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
    const db = drizzle(env.DB, { schema });

    // Daily at 8am UTC: sync GitHub contributions
    if (event.cron === '0 8 * * *') {
      const github = await syncGitHub(db, env);
      console.log('[cron] GitHub sync result:', JSON.stringify(github));
      return;
    }

    // Every 15 min: sync health data
    const [glucose, insulin, activity, strava] = await Promise.all([
      syncGlucoseReadings(db, env),
      syncInsulinDoses(db, env),
      syncActivityData(db, env),
      syncStravaHeartRate(db, env),
    ]);
    console.log('[cron] Sync result:', JSON.stringify({ glucose, insulin, activity, strava }));
  },

  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/sync') {
      // Protect manual sync with a secret header
      if (env.SYNC_SECRET) {
        const provided = request.headers.get('x-sync-secret');
        if (provided !== env.SYNC_SECRET) {
          return new Response('Unauthorized', { status: 401 });
        }
      }

      const db = drizzle(env.DB, { schema });
      const [glucose, insulin, activity, strava] = await Promise.all([
        syncGlucoseReadings(db, env),
        syncInsulinDoses(db, env),
        syncActivityData(db, env),
        syncStravaHeartRate(db, env),
      ]);
      return new Response(JSON.stringify({ glucose, insulin, activity, strava }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404 });
  },
};
