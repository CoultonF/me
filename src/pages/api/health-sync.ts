import type { APIRoute } from 'astro';
import { getCloudflareEnv } from '@/lib/env';
import { createDb } from '@/lib/db/client';
import { createWifeDb } from '@/lib/db/wife-client';
import { ingestHealthDataMain } from '@/lib/apple-health/ingest-main';
import { ingestAppleHealthData } from '@/lib/apple-health/ingest';
import { syncPayloadSchema } from '@/lib/apple-health/types';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const cfEnv = await getCloudflareEnv();
    if (!cfEnv) {
      return jsonResponse({ error: 'Environment unavailable' }, 503);
    }

    const secret = request.headers.get('x-sync-secret');

    // Route by secret: SYNC_SECRET → main DB, WIFE_SYNC_SECRET → wife DB
    let target: 'main' | 'wife' | null = null;
    if (cfEnv.SYNC_SECRET && secret === cfEnv.SYNC_SECRET) {
      target = 'main';
    } else if (cfEnv.WIFE_SYNC_SECRET && secret === cfEnv.WIFE_SYNC_SECRET) {
      target = 'wife';
    }

    if (!target) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    // Parse JSON body (decompress if Content-Encoding: deflate)
    let raw: unknown;
    try {
      const encoding = request.headers.get('content-encoding');
      if (encoding === 'deflate') {
        const ds = new DecompressionStream('deflate-raw');
        const decompressed = request.body!.pipeThrough(ds);
        const text = await new Response(decompressed).text();
        raw = JSON.parse(text);
      } else {
        raw = await request.json();
      }
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }

    // Validate with Zod
    const parsed = syncPayloadSchema.safeParse(raw);
    if (!parsed.success) {
      return jsonResponse({
        error: 'Validation failed',
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      }, 400);
    }

    if (target === 'main') {
      const db = createDb(cfEnv.DB);
      const result = await ingestHealthDataMain(db, parsed.data);
      return jsonResponse({ ok: true, result });
    } else {
      const db = createWifeDb(cfEnv.WIFE_DB);
      const result = await ingestAppleHealthData(db, parsed.data);
      return jsonResponse({ ok: true, result });
    }
  } catch (e) {
    console.error('[api/health-sync]', e);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
};
