import type { APIRoute } from 'astro';
import { getCloudflareEnv } from '@/lib/env';
import { createDb } from '@/lib/db/client';
import { getGifts, getGiftsByCategories } from '@/lib/db/queries';
import { decodeAccessToken } from '@/lib/wishlist-access';
import type { GiftsAPIResponse } from '@/lib/types/gifts';

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const cfEnv = await getCloudflareEnv();
    if (!cfEnv) {
      return new Response(JSON.stringify({ error: 'DB not available' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = createDb(cfEnv.DB);

    // Check for CF Access authentication (admin)
    const cookies = request.headers.get('cookie') ?? '';
    const hasCfAuth = cookies.includes('CF_Authorization=');

    if (hasCfAuth) {
      const all = await getGifts(db);
      const categories = [...new Set(all.map((g) => g.category))].sort();
      const body: GiftsAPIResponse = { gifts: all, categories, isAdmin: true };
      return new Response(JSON.stringify(body), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check for access code
    const code = url.searchParams.get('code');
    if (!code) {
      return new Response(JSON.stringify({ error: 'Access code required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = decodeAccessToken(code);
    if (!token || token.categories.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid access code' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const filtered = await getGiftsByCategories(db, token.categories);
    const body: GiftsAPIResponse = {
      gifts: filtered,
      categories: token.categories,
      isAdmin: false,
    };
    return new Response(JSON.stringify(body), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[api/wishlist]', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
