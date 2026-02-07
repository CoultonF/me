import { eq, and, gte, lte, isNull } from 'drizzle-orm';
import { runningSessions } from '../db/schema';
import { refreshAccessToken, fetchActivities } from './client';
import { getRefreshToken } from './client';
import type { StravaActivity } from './client';
import type { Database } from '../db/client';

interface StravaSyncResult {
  matched: number;
  unmatched: number;
  error?: string;
}

interface StravaSyncEnv {
  STRAVA_CLIENT_ID: string;
  STRAVA_CLIENT_SECRET: string;
}

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const DISTANCE_TOLERANCE = 0.2; // 20%

export async function syncStravaHeartRate(
  db: Database,
  env: StravaSyncEnv,
  lookbackDays = 7,
): Promise<StravaSyncResult> {
  // Check if we have a refresh token before attempting anything
  const existingToken = await getRefreshToken(db);
  if (!existingToken) {
    return { matched: 0, unmatched: 0, error: 'No Strava refresh token' };
  }

  let accessToken: string;
  try {
    accessToken = await refreshAccessToken(db, env.STRAVA_CLIENT_ID, env.STRAVA_CLIENT_SECRET);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[strava] Token refresh failed:', msg);
    return { matched: 0, unmatched: 0, error: msg };
  }

  const afterTimestamp = Math.floor((Date.now() - lookbackDays * 24 * 60 * 60 * 1000) / 1000);

  let activities: StravaActivity[];
  try {
    activities = await fetchActivities(accessToken, afterTimestamp);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[strava] Activity fetch failed:', msg);
    return { matched: 0, unmatched: 0, error: msg };
  }

  // Filter to Run/Walk activities that have HR data
  const withHR = activities.filter(
    (a) => a.average_heartrate != null && a.max_heartrate != null,
  );

  if (withHR.length === 0) {
    return { matched: 0, unmatched: withHR.length };
  }

  // Fetch running sessions in the lookback window that are missing HR
  const windowStart = new Date(afterTimestamp * 1000).toISOString();
  const windowEnd = new Date().toISOString();
  const sessions = await db.select().from(runningSessions)
    .where(and(
      gte(runningSessions.startTime, windowStart),
      lte(runningSessions.startTime, windowEnd),
      isNull(runningSessions.avgHeartRate),
    ));

  let matched = 0;
  let unmatched = 0;

  for (const activity of withHR) {
    const stravaStart = new Date(activity.start_date).getTime();
    const stravaDistKm = activity.distance / 1000;

    const match = sessions.find((s) => {
      const sessionStart = new Date(s.startTime).getTime();
      const timeDiff = Math.abs(sessionStart - stravaStart);
      if (timeDiff > FIVE_MINUTES_MS) return false;

      // If either has no distance, match on time alone
      if (!s.distanceKm || stravaDistKm === 0) return true;

      const distDiff = Math.abs(s.distanceKm - stravaDistKm) / Math.max(s.distanceKm, stravaDistKm);
      return distDiff <= DISTANCE_TOLERANCE;
    });

    if (match) {
      await db.update(runningSessions)
        .set({
          avgHeartRate: Math.round(activity.average_heartrate!),
          maxHeartRate: Math.round(activity.max_heartrate!),
        })
        .where(eq(runningSessions.id, match.id));
      matched++;
    } else {
      unmatched++;
    }
  }

  console.log(`[strava] HR sync: ${matched} matched, ${unmatched} unmatched`);
  return { matched, unmatched };
}
