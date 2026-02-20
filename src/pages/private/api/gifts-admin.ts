import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getCloudflareEnv } from '@/lib/env';
import { createDb } from '@/lib/db/client';
import { getGifts, insertGift, updateGift, deleteGift } from '@/lib/db/queries';

const giftSchema = z.object({
  name: z.string().min(1),
  price: z.coerce.number().nullable().optional(),
  url: z.string().nullable().optional(),
  store: z.string().nullable().optional(),
  rating: z.coerce.number().min(1).max(5).nullable().optional(),
  dateAdded: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.string().min(1),
  notes: z.string().nullable().optional(),
  purchased: z.boolean().optional(),
});

const bodySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('create'),
    gift: giftSchema,
  }),
  z.object({
    action: z.literal('update'),
    id: z.coerce.number(),
    gift: giftSchema.partial(),
  }),
  z.object({
    action: z.literal('delete'),
    id: z.coerce.number(),
  }),
  z.object({
    action: z.literal('list'),
  }),
]);

/** Convert undefined values to null so exactOptionalPropertyTypes is satisfied */
function toNullable<T extends Record<string, unknown>>(obj: T): { [K in keyof T]: Exclude<T[K], undefined> } {
  const out = {} as Record<string, unknown>;
  for (const [k, v] of Object.entries(obj)) {
    out[k] = v === undefined ? null : v;
  }
  return out as { [K in keyof T]: Exclude<T[K], undefined> };
}

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

    if (body.action === 'list') {
      const all = await getGifts(db);
      return new Response(JSON.stringify({ gifts: all }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (body.action === 'create') {
      const giftData = toNullable(body.gift);
      const id = await insertGift(db, giftData);
      return new Response(JSON.stringify({ ok: true, id }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (body.action === 'update') {
      const updates = toNullable(body.gift);
      await updateGift(db, body.id, updates);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (body.action === 'delete') {
      await deleteGift(db, body.id);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[private/api/gifts-admin]', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
