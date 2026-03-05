import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getCloudflareEnv } from '@/lib/env';
import { createDb } from '@/lib/db/client';
import { setHydrationGoal } from '@/lib/db/queries';

const setGoalSchema = z.object({
  action: z.literal('set-goal'),
  goalMl: z.number().int().positive(),
});

const bodySchema = setGoalSchema;

export const POST: APIRoute = async ({ request }) => {
  try {
    const cfEnv = await getCloudflareEnv();
    if (!cfEnv) {
      return new Response(JSON.stringify({ error: 'DB not available' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = createDb(cfEnv.DB);
    const raw = await request.json();
    const parsed = bodySchema.safeParse(raw);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: parsed.error.issues }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await setHydrationGoal(db, parsed.data.goalMl);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[private/api/hydration]', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
