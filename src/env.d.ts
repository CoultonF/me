/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

declare module 'cloudflare:workers' {
  const env: {
    DB: D1Database;
    TIDEPOOL_EMAIL: string;
    TIDEPOOL_PASSWORD: string;
    STRAVA_CLIENT_ID: string;
    STRAVA_CLIENT_SECRET: string;
  };
}
