import { eq } from 'drizzle-orm';
import { settings } from '../db/schema';
import type { Database } from '../db/client';

const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';
const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

export interface StravaActivity {
  id: number;
  type: string;
  start_date: string; // ISO 8601
  distance: number; // metres
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  average_heartrate?: number;
  max_heartrate?: number;
  total_elevation_gain?: number;
}

export async function getRefreshToken(db: Database): Promise<string | null> {
  const row = await db.select().from(settings).where(eq(settings.key, 'strava_refresh_token')).get();
  return row?.value ?? null;
}

export async function saveRefreshToken(db: Database, token: string): Promise<void> {
  await db.insert(settings).values({ key: 'strava_refresh_token', value: token })
    .onConflictDoUpdate({ target: settings.key, set: { value: token } });
}

export async function refreshAccessToken(
  db: Database,
  clientId: string,
  clientSecret: string,
): Promise<string> {
  const refreshToken = await getRefreshToken(db);
  if (!refreshToken) {
    throw new Error('No Strava refresh token found in settings');
  }

  const res = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Strava token refresh failed (${res.status}): ${text}`);
  }

  const data = await res.json() as { access_token: string; refresh_token: string };

  // Strava rotates refresh tokens — persist the new one
  await saveRefreshToken(db, data.refresh_token);

  return data.access_token;
}

export async function fetchActivities(
  accessToken: string,
  after: number, // unix timestamp (seconds)
  perPage = 50,
): Promise<StravaActivity[]> {
  const url = `${STRAVA_API_BASE}/athlete/activities?after=${after}&per_page=${perPage}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Strava activities fetch failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<StravaActivity[]>;
}
