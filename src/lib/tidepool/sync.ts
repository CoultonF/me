import { glucoseReadings } from '../db/schema';
import { getTidepoolSession, fetchCGMData } from './client';
import type { Database } from '../db/client';

interface SyncResult {
  inserted: number;
  skipped: number;
  error?: string;
}

interface SyncEnv {
  TIDEPOOL_EMAIL: string;
  TIDEPOOL_PASSWORD: string;
}

export async function syncGlucoseReadings(db: Database, env: SyncEnv): Promise<SyncResult> {
  let session;
  try {
    session = await getTidepoolSession(env);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown login error';
    console.error('[sync] Tidepool login failed:', msg);
    return { inserted: 0, skipped: 0, error: msg };
  }

  let readings;
  try {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    readings = await fetchCGMData(
      session.token,
      session.userId,
      twoHoursAgo.toISOString(),
      now.toISOString(),
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown fetch error';
    console.error('[sync] Tidepool data fetch failed:', msg);
    return { inserted: 0, skipped: 0, error: msg };
  }

  if (readings.length === 0) {
    return { inserted: 0, skipped: 0 };
  }

  // Batch insert with conflict handling (unique index on timestamp)
  const BATCH_SIZE = 100;
  let inserted = 0;

  for (let i = 0; i < readings.length; i += BATCH_SIZE) {
    const batch = readings.slice(i, i + BATCH_SIZE);
    const result = await db
      .insert(glucoseReadings)
      .values(
        batch.map((r) => ({
          timestamp: r.timestamp,
          value: r.value,
          trend: r.trend,
          source: 'tidepool' as const,
        })),
      )
      .onConflictDoNothing()
      .returning();
    inserted += result.length;
  }

  const skipped = readings.length - inserted;
  console.log(`[sync] Inserted ${inserted}, skipped ${skipped} (duplicates)`);

  return { inserted, skipped };
}
