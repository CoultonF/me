import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../../src/lib/db/schema';
import { syncGlucoseReadings, syncInsulinDoses, syncActivityData } from '../../src/lib/tidepool/sync';

interface Env {
  DB: D1Database;
  TIDEPOOL_EMAIL: string;
  TIDEPOOL_PASSWORD: string;
  SYNC_SECRET?: string;
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
    const db = drizzle(env.DB, { schema });
    const [glucose, insulin, activity] = await Promise.all([
      syncGlucoseReadings(db, env),
      syncInsulinDoses(db, env),
      syncActivityData(db, env),
    ]);
    console.log('[cron] Sync result:', JSON.stringify({ glucose, insulin, activity }));
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
      const [glucose, insulin, activity] = await Promise.all([
        syncGlucoseReadings(db, env),
        syncInsulinDoses(db, env),
        syncActivityData(db, env),
      ]);
      return new Response(JSON.stringify({ glucose, insulin, activity }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404 });
  },
};
