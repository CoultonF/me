import type { APIRoute } from 'astro';
import { isAuthenticated } from '@/lib/auth';

export const GET: APIRoute = async ({ request }) => {
  return new Response(JSON.stringify({ authenticated: isAuthenticated(request) }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
