import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  // Cloudflare Access sets this header on authenticated requests
  const jwt = request.headers.get('Cf-Access-Jwt-Assertion');
  const authenticated = !!jwt;

  return new Response(JSON.stringify({ authenticated }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
