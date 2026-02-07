/** Check if the request has a valid Cloudflare Access JWT header */
export function isAuthenticated(request: Request): boolean {
  return !!request.headers.get('Cf-Access-Jwt-Assertion');
}

const UNAUTHORIZED = new Response(JSON.stringify({ error: 'Unauthorized' }), {
  status: 401,
  headers: { 'Content-Type': 'application/json' },
});

/** Return a 401 response if the request lacks CF Access auth */
export function requireAuth(request: Request): Response | null {
  if (!isAuthenticated(request)) return UNAUTHORIZED;
  return null;
}
