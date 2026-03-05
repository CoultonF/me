import { sql } from 'drizzle-orm';
import type { Database } from '../db/client';
import { heartRateDaily, hydrationLog } from '../db/schema';
import type {
  AppleHealthSyncPayload,
  HeartRateDailyPayload,
  HydrationPayload,
  SyncResult,
} from './types';

const D1_BATCH_LIMIT = 500;
const RESTING_HR_CAP = 60;

function buildHeartRateDailyQueries(db: Database, rows: HeartRateDailyPayload[]) {
  return rows.map((row) => {
    const restingHR = row.restingHR != null && row.restingHR > RESTING_HR_CAP ? null : (row.restingHR ?? null);
    return db.insert(heartRateDaily).values({
      date: row.date,
      restingHR,
      walkingHRAvg: row.walkingHRAvg ?? null,
      hrv: row.hrv ?? null,
      updatedAt: sql`datetime('now')`,
    }).onConflictDoUpdate({
      target: heartRateDaily.date,
      set: {
        restingHR: sql`excluded.resting_hr`,
        walkingHRAvg: sql`excluded.walking_hr_avg`,
        hrv: sql`excluded.hrv`,
        updatedAt: sql`datetime('now')`,
      },
    });
  });
}

function buildHydrationQueries(db: Database, rows: HydrationPayload[]) {
  return rows.map((row) =>
    db.insert(hydrationLog).values({
      timestamp: row.timestamp,
      amountMl: row.amountMl,
    }).onConflictDoNothing()
  );
}

export async function ingestHealthDataMain(
  db: Database,
  payload: AppleHealthSyncPayload,
): Promise<SyncResult> {
  const result: SyncResult = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allQueries: any[] = [];

  if (payload.heartRateDaily?.length) {
    const queries = buildHeartRateDailyQueries(db, payload.heartRateDaily);
    allQueries.push(...queries);
    result.heartRateDaily = payload.heartRateDaily.length;
  }

  if (payload.hydration?.length) {
    const queries = buildHydrationQueries(db, payload.hydration);
    allQueries.push(...queries);
    result.hydration = payload.hydration.length;
  }

  // Execute in chunks of D1_BATCH_LIMIT
  for (let i = 0; i < allQueries.length; i += D1_BATCH_LIMIT) {
    const chunk = allQueries.slice(i, i + D1_BATCH_LIMIT);
    await db.batch(chunk as [typeof chunk[0], ...typeof chunk]);
  }

  return result;
}
