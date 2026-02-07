import type { APIRoute } from 'astro';
import { getCloudflareEnv } from '@/lib/env';
import { createDb } from '@/lib/db/client';
import { syncGitHub } from '@/lib/github/sync';
import { syncClaudeUsage } from '@/lib/anthropic/sync';

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

    const [github, claude] = await Promise.all([
      syncGitHub(db, cfEnv),
      syncClaudeUsage(db, cfEnv),
    ]);

    return new Response(JSON.stringify({ github, claude }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[private/api/sync-code]', msg, e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
