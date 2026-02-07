import { glucoseReadings, insulinDoses, runningSessions, activitySummaries } from '../db/schema';
import { getTidepoolSession, fetchCGMData, fetchInsulinData, fetchActivityData } from './client';
import type { TidepoolPhysicalActivity } from './client';
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

export async function syncGlucoseReadings(db: Database, env: SyncEnv, startMs?: number, endMs?: number, session?: { token: string; userId: string }): Promise<SyncResult> {
  if (!session) {
    try {
      session = await getTidepoolSession(env);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown login error';
      console.error('[sync] Tidepool login failed:', msg);
      return { inserted: 0, skipped: 0, error: msg };
    }
  }

  let readings;
  try {
    const end = endMs ? new Date(endMs) : new Date();
    const start = startMs ? new Date(startMs) : new Date(end.getTime() - 2 * 60 * 60 * 1000);
    readings = await fetchCGMData(
      session.token,
      session.userId,
      start.toISOString(),
      end.toISOString(),
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
  // D1 has a 100-binding limit per query; each row = 5 params
  const BATCH_SIZE = 20;
  let inserted = 0;

  for (let i = 0; i < readings.length; i += BATCH_SIZE) {
    const batch = readings.slice(i, i + BATCH_SIZE);
    try {
      await db
        .insert(glucoseReadings)
        .values(
          batch.map((r) => ({
            timestamp: r.timestamp,
            value: r.value,
            trend: r.trend,
            source: 'tidepool' as const,
          })),
        )
        .onConflictDoNothing();
      inserted += batch.length;
    } catch {
      console.error(`[sync] Glucose batch failed at offset ${i}, skipping`);
    }
  }

  console.log(`[sync] Glucose: processed ${inserted} readings`);

  return { inserted, skipped: 0 };
}

export async function syncInsulinDoses(db: Database, env: SyncEnv, startMs?: number, endMs?: number, session?: { token: string; userId: string }): Promise<SyncResult> {
  if (!session) {
    try {
      session = await getTidepoolSession(env);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown login error';
      console.error('[sync] Tidepool login failed:', msg);
      return { inserted: 0, skipped: 0, error: msg };
    }
  }

  let data;
  try {
    const end = endMs ? new Date(endMs) : new Date();
    const start = startMs ? new Date(startMs) : new Date(end.getTime() - 2 * 60 * 60 * 1000);
    data = await fetchInsulinData(session.token, session.userId, start.toISOString(), end.toISOString());
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown fetch error';
    console.error('[sync] Insulin fetch failed:', msg);
    return { inserted: 0, skipped: 0, error: msg };
  }

  const rows = [
    ...data.boluses.map((b) => ({
      timestamp: b.time,
      units: (b.normal ?? 0) + (b.extended ?? 0),
      type: 'bolus' as const,
      subType: b.subType,
      duration: null as number | null,
      source: 'tidepool' as const,
    })),
    ...data.basals.map((b) => ({
      timestamp: b.time,
      units: b.rate ?? 0, // units/hr — queries compute total via rate * duration / 3600000
      type: 'basal' as const,
      subType: b.deliveryType,
      duration: b.duration,
      source: 'tidepool' as const,
    })),
  ];

  if (rows.length === 0) {
    return { inserted: 0, skipped: 0 };
  }

  // D1 has a 100-binding limit; each row = 7 params (incl auto id)
  const BATCH_SIZE = 14;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    try {
      await db.insert(insulinDoses).values(batch).onConflictDoNothing();
      inserted += batch.length;
    } catch {
      console.error(`[sync] Insulin batch failed at offset ${i}, skipping`);
    }
  }

  console.log(`[sync] Insulin: processed ${inserted} doses`);

  return { inserted, skipped: 0 };
}

function convertDistance(value: number, units: string): number {
  if (units === 'miles') return value * 1.60934;
  if (units === 'meters' || units === 'm') return value / 1000;
  return value; // assume km
}

function convertDuration(value: number, units: string): number {
  if (units === 'hours') return value * 3600;
  if (units === 'minutes') return value * 60;
  if (units === 'milliseconds' || units === 'ms') return value / 1000;
  return value; // assume seconds
}

function extractActivityType(name: string): string {
  // "Running - 6.50 miles" → "Running"
  const dash = name.indexOf(' - ');
  return dash > 0 ? name.slice(0, dash) : name;
}

export async function syncActivityData(db: Database, env: SyncEnv, startMs?: number, endMs?: number, session?: { token: string; userId: string }): Promise<SyncResult> {
  if (!session) {
    try {
      session = await getTidepoolSession(env);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown login error';
      console.error('[sync] Tidepool login failed:', msg);
      return { inserted: 0, skipped: 0, error: msg };
    }
  }

  let activities: TidepoolPhysicalActivity[];
  try {
    const end = endMs ? new Date(endMs) : new Date();
    const start = startMs ? new Date(startMs) : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    activities = await fetchActivityData(session.token, session.userId, start.toISOString(), end.toISOString());
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown fetch error';
    console.error('[sync] Activity fetch failed:', msg);
    return { inserted: 0, skipped: 0, error: msg };
  }

  if (activities.length === 0) {
    return { inserted: 0, skipped: 0 };
  }

  const workoutRows = activities.map((a) => {
    const durationSec = a.duration ? convertDuration(a.duration.value, a.duration.units) : null;
    const distKm = a.distance ? convertDistance(a.distance.value, a.distance.units) : null;
    const calories = a.energy ? Math.round(a.energy.value) : null;
    const endTime = durationSec
      ? new Date(new Date(a.time).getTime() + durationSec * 1000).toISOString()
      : null;
    const pace = distKm && durationSec && distKm > 0
      ? Math.round(durationSec / distKm)
      : null;

    return {
      startTime: a.time,
      endTime,
      distanceKm: distKm,
      durationSeconds: durationSec ? Math.round(durationSec) : null,
      avgPaceSecPerKm: pace,
      activityName: extractActivityType(a.name),
      activeCalories: calories,
      source: 'tidepool' as const,
    };
  });

  // Insert workouts — D1 has a 100-binding limit; each row = 8 params
  const BATCH_SIZE = 12;
  let inserted = 0;

  for (let i = 0; i < workoutRows.length; i += BATCH_SIZE) {
    const batch = workoutRows.slice(i, i + BATCH_SIZE);
    await db
      .insert(runningSessions)
      .values(batch)
      .onConflictDoNothing();
    inserted += batch.length;
  }

  // Aggregate into activitySummaries by date
  const byDate = new Map<string, { calories: number; minutes: number }>();
  for (const w of workoutRows) {
    const date = w.startTime.slice(0, 10); // YYYY-MM-DD
    const existing = byDate.get(date) ?? { calories: 0, minutes: 0 };
    existing.calories += w.activeCalories ?? 0;
    existing.minutes += w.durationSeconds ? w.durationSeconds / 60 : 0;
    byDate.set(date, existing);
  }

  for (const [date, agg] of Array.from(byDate.entries())) {
    await db
      .insert(activitySummaries)
      .values({
        date,
        activeCalories: Math.round(agg.calories),
        exerciseMinutes: Math.round(agg.minutes),
      })
      .onConflictDoUpdate({
        target: activitySummaries.date,
        set: {
          activeCalories: Math.round(agg.calories),
          exerciseMinutes: Math.round(agg.minutes),
        },
      });
  }

  console.log(`[sync] Activity: processed ${inserted} workouts`);

  return { inserted, skipped: 0 };
}
