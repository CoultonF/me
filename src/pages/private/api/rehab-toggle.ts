import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getCloudflareEnv } from '@/lib/env';
import { createDb } from '@/lib/db/client';
import { toggleRehabExercise, setInjuryEnd } from '@/lib/db/queries';

const toggleSchema = z.object({
  action: z.literal('toggle'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  exerciseId: z.string().min(1),
});

const endInjurySchema = z.object({
  action: z.literal('end-injury'),
});

const bodySchema = z.discriminatedUnion('action', [toggleSchema, endInjurySchema]);

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

    const body = parsed.data;

    if (body.action === 'toggle') {
      const checked = await toggleRehabExercise(db, body.date, body.exerciseId);
      return new Response(JSON.stringify({ ok: true, checked }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (body.action === 'end-injury') {
      const today = new Date().toISOString().slice(0, 10);
      await setInjuryEnd(db, today);
      return new Response(JSON.stringify({ ok: true, endDate: today }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[private/api/rehab-toggle]', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
