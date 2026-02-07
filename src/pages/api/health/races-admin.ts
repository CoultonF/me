import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getCloudflareEnv } from '@/lib/env';
import { createDb } from '@/lib/db/client';
import { insertRace, insertRaceResult, updateRace, updateRaceResult, deleteRace, getRacesWithResults } from '@/lib/db/queries';
import { requireAuth } from '@/lib/auth';

const raceSchema = z.object({
  name: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  location: z.string().nullable().optional(),
  distance: z.string().min(1),
  status: z.enum(['completed', 'upcoming', 'target']),
  resultsUrl: z.string().nullable().optional(),
});

const resultSchema = z.object({
  bibNumber: z.string().nullable().optional(),
  chipTime: z.string().nullable().optional(),
  gunTime: z.string().nullable().optional(),
  pacePerKm: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  division: z.string().nullable().optional(),
  overallPlace: z.coerce.number().nullable().optional(),
  overallTotal: z.coerce.number().nullable().optional(),
  genderPlace: z.coerce.number().nullable().optional(),
  genderTotal: z.coerce.number().nullable().optional(),
  divisionPlace: z.coerce.number().nullable().optional(),
  divisionTotal: z.coerce.number().nullable().optional(),
  resultsUrl: z.string().nullable().optional(),
});

const bodySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('create'),
    race: raceSchema,
    result: resultSchema.optional(),
  }),
  z.object({
    action: z.literal('update'),
    id: z.coerce.number(),
    race: raceSchema.partial().optional(),
    result: resultSchema.optional(),
  }),
  z.object({
    action: z.literal('delete'),
    id: z.coerce.number(),
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
  const denied = requireAuth(request);
  if (denied) return denied;

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

    if (body.action === 'create') {
      const raceData = toNullable(body.race);
      const raceId = await insertRace(db, raceData);
      if (body.result && body.race.status === 'completed') {
        await insertRaceResult(db, { ...toNullable(body.result), raceId });
      }
      return new Response(JSON.stringify({ ok: true, id: raceId }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (body.action === 'update') {
      if (body.race) {
        await updateRace(db, body.id, toNullable(body.race));
      }
      if (body.result) {
        const allRaces = await getRacesWithResults(db);
        const existing = allRaces.find((r) => r.id === body.id);
        if (existing?.result) {
          await updateRaceResult(db, body.id, toNullable(body.result));
        } else {
          await insertRaceResult(db, { ...toNullable(body.result), raceId: body.id });
        }
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (body.action === 'delete') {
      await deleteRace(db, body.id);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[api/health/races-admin]', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
