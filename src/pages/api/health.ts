import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const db = (locals as App.Locals).runtime.env.DB;
    // Simple connectivity check — D1 always has sqlite_master
    await db.prepare('SELECT 1 FROM sqlite_master LIMIT 1').first();
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
