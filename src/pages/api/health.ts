import type { APIRoute } from 'astro';
import { getCloudflareEnv } from '@/lib/env';

export const GET: APIRoute = async () => {
  try {
    const cfEnv = await getCloudflareEnv();
    if (!cfEnv) throw new Error('D1 unavailable');
    await cfEnv.DB.prepare('SELECT 1 FROM sqlite_master LIMIT 1').first();
    return new Response(JSON.stringify({ status: 'ok', db: 'connected' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ status: 'ok', db: 'unavailable' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
