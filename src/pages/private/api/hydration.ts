import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getCloudflareEnv } from '@/lib/env';
import { createDb } from '@/lib/db/client';
import { insertHydrationEntry, deleteHydrationEntry, setHydrationGoal } from '@/lib/db/queries';

const addSchema = z.object({
  action: z.literal('add'),
  amountMl: z.number().int().positive(),
  timestamp: z.string().min(1),
  note: z.string().nullable().optional(),
});

const deleteSchema = z.object({
  action: z.literal('delete'),
  id: z.number().int().positive(),
});

const setGoalSchema = z.object({
  action: z.literal('set-goal'),
  goalMl: z.number().int().positive(),
});

const bodySchema = z.discriminatedUnion('action', [addSchema, deleteSchema, setGoalSchema]);

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

    if (body.action === 'add') {
      const id = await insertHydrationEntry(db, body.timestamp, body.amountMl, body.note);
      return new Response(JSON.stringify({ ok: true, id }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (body.action === 'delete') {
      await deleteHydrationEntry(db, body.id);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (body.action === 'set-goal') {
      await setHydrationGoal(db, body.goalMl);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
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
