import { desc, asc, and, gte, lte, eq, sql, count, min } from 'drizzle-orm';
import type { Database } from './client';
import { glucoseReadings, insulinDoses, runningSessions, activitySummaries, races, raceResults, githubContributions, githubRepos, githubEvents, githubLanguages, claudeCodeDaily, claudeCodeModels } from './schema';

export async function getLatestGlucose(db: Database) {
  const rows = await db
    .select({
      id: glucoseReadings.id,
      timestamp: glucoseReadings.timestamp,
      value: glucoseReadings.value,
      trend: glucoseReadings.trend,
      source: glucoseReadings.source,
    })
    .from(glucoseReadings)
    .orderBy(desc(glucoseReadings.timestamp))
    .limit(1);
  return rows[0] ?? null;
}

export async function getGlucoseRange(db: Database, startDate: string, endDate: string) {
  return db
    .select({
      id: glucoseReadings.id,
      timestamp: glucoseReadings.timestamp,
      value: glucoseReadings.value,
      trend: glucoseReadings.trend,
    })
    .from(glucoseReadings)
    .where(and(gte(glucoseReadings.timestamp, startDate), lte(glucoseReadings.timestamp, endDate)))
    .orderBy(glucoseReadings.timestamp);
}

export async function getGlucoseStats(db: Database, startDate: string, endDate: string) {
  const range = and(gte(glucoseReadings.timestamp, startDate), lte(glucoseReadings.timestamp, endDate));

  const [agg] = await db
    .select({
      min: sql<number>`min(${glucoseReadings.value})`,
      max: sql<number>`max(${glucoseReadings.value})`,
      avg: sql<number>`avg(${glucoseReadings.value})`,
      count: count(),
    })
    .from(glucoseReadings)
    .where(range);

  if (!agg || agg.count === 0) {
    return { min: 0, max: 0, avg: 0, count: 0, timeInRange: { low: 0, normal: 0, high: 0, veryHigh: 0 } };
  }

  const [tir] = await db
    .select({
      low: sql<number>`sum(case when ${glucoseReadings.value} < 3.9 then 1 else 0 end)`,
      normal: sql<number>`sum(case when ${glucoseReadings.value} >= 3.9 and ${glucoseReadings.value} <= 10.0 then 1 else 0 end)`,
      high: sql<number>`sum(case when ${glucoseReadings.value} > 10.0 and ${glucoseReadings.value} <= 13.9 then 1 else 0 end)`,
      veryHigh: sql<number>`sum(case when ${glucoseReadings.value} > 13.9 then 1 else 0 end)`,
    })
    .from(glucoseReadings)
    .where(range);

  const total = agg.count;
  return {
    min: Math.round(agg.min * 10) / 10,
    max: Math.round(agg.max * 10) / 10,
    avg: Math.round(agg.avg * 10) / 10,
    count: total,
    timeInRange: {
      low: Math.round(((tir?.low ?? 0) / total) * 100),
      normal: Math.round(((tir?.normal ?? 0) / total) * 100),
      high: Math.round(((tir?.high ?? 0) / total) * 100),
      veryHigh: Math.round(((tir?.veryHigh ?? 0) / total) * 100),
    },
  };
}

export async function getGlucoseRangeDownsampled(db: Database, startDate: string, endDate: string, sampleEvery: number) {
  return db
    .select({
      timestamp: glucoseReadings.timestamp,
      value: glucoseReadings.value,
      trend: glucoseReadings.trend,
    })
    .from(glucoseReadings)
    .where(
      and(
        gte(glucoseReadings.timestamp, startDate),
        lte(glucoseReadings.timestamp, endDate),
        sql`rowid % ${sampleEvery} = 0`,
      ),
    )
    .orderBy(glucoseReadings.timestamp);
}

export async function getGlucoseReadings(db: Database, limit = 288) {
  return db
    .select()
    .from(glucoseReadings)
    .orderBy(desc(glucoseReadings.timestamp))
    .limit(limit);
}

export async function getLatestRun(db: Database) {
  const rows = await db
    .select()
    .from(runningSessions)
    .orderBy(desc(runningSessions.startTime))
    .limit(1);
  return rows[0] ?? null;
}

export async function getRecentActivity(db: Database, days = 7) {
  return db
    .select()
    .from(activitySummaries)
    .orderBy(desc(activitySummaries.date))
    .limit(days);
}

// ── Insulin queries ──

export async function getInsulinRange(db: Database, startDate: string, endDate: string) {
  return db
    .select({
      timestamp: insulinDoses.timestamp,
      units: insulinDoses.units,
      type: insulinDoses.type,
      subType: insulinDoses.subType,
      duration: insulinDoses.duration,
    })
    .from(insulinDoses)
    .where(and(gte(insulinDoses.timestamp, startDate), lte(insulinDoses.timestamp, endDate)))
    .orderBy(insulinDoses.timestamp);
}

export async function getInsulinDailyTotals(db: Database, startDate: string, endDate: string) {
  const range = and(gte(insulinDoses.timestamp, startDate), lte(insulinDoses.timestamp, endDate));

  const rows = await db
    .select({
      date: sql<string>`date(${insulinDoses.timestamp})`.as('date'),
      type: insulinDoses.type,
      total: sql<number>`sum(case when ${insulinDoses.type} = 'bolus' then ${insulinDoses.units} else ${insulinDoses.units} * ${insulinDoses.duration} / 3600000.0 end)`.as('total'),
    })
    .from(insulinDoses)
    .where(range)
    .groupBy(sql`date(${insulinDoses.timestamp})`, insulinDoses.type);

  // Pivot into { date, bolusTotal, basalTotal }
  const byDate = new Map<string, { bolusTotal: number; basalTotal: number }>();
  for (const row of rows) {
    const existing = byDate.get(row.date) ?? { bolusTotal: 0, basalTotal: 0 };
    if (row.type === 'bolus') {
      existing.bolusTotal = Math.round((row.total ?? 0) * 10) / 10;
    } else {
      existing.basalTotal = Math.round((row.total ?? 0) * 10) / 10;
    }
    byDate.set(row.date, existing);
  }

  return Array.from(byDate.entries()).map(([date, totals]) => ({
    date,
    ...totals,
  })).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getInsulinStats(
  db: Database,
  startDate: string,
  endDate: string,
  precomputedDailyTotals?: Awaited<ReturnType<typeof getInsulinDailyTotals>>,
) {
  const dailyTotals = precomputedDailyTotals ?? await getInsulinDailyTotals(db, startDate, endDate);

  if (dailyTotals.length === 0) {
    return { totalBolus: 0, totalBasal: 0, total: 0, avgDailyTotal: 0, bolusPercent: 0, basalPercent: 0, bolusCount: 0, days: 0 };
  }

  const totalBolus = dailyTotals.reduce((s, d) => s + d.bolusTotal, 0);
  const totalBasal = dailyTotals.reduce((s, d) => s + d.basalTotal, 0);
  const total = totalBolus + totalBasal;
  const days = dailyTotals.length;
  const avgDailyTotal = Math.round((total / days) * 10) / 10;

  // Count bolus events
  const range = and(
    gte(insulinDoses.timestamp, startDate),
    lte(insulinDoses.timestamp, endDate),
    eq(insulinDoses.type, 'bolus'),
  );
  const [countRow] = await db.select({ n: count() }).from(insulinDoses).where(range);

  return {
    totalBolus: Math.round(totalBolus * 10) / 10,
    totalBasal: Math.round(totalBasal * 10) / 10,
    total: Math.round(total * 10) / 10,
    avgDailyTotal,
    bolusPercent: total > 0 ? Math.round((totalBolus / total) * 100) : 0,
    basalPercent: total > 0 ? Math.round((totalBasal / total) * 100) : 0,
    bolusCount: countRow?.n ?? 0,
    days,
  };
}

export async function getLatestInsulin(db: Database) {
  const rows = await db
    .select({
      timestamp: insulinDoses.timestamp,
      units: insulinDoses.units,
      type: insulinDoses.type,
    })
    .from(insulinDoses)
    .where(eq(insulinDoses.type, 'bolus'))
    .orderBy(desc(insulinDoses.timestamp))
    .limit(1);
  return rows[0] ?? null;
}

// ── Activity queries ──

export async function getWorkouts(db: Database, startDate: string, endDate: string) {
  return db
    .select({
      startTime: runningSessions.startTime,
      distanceKm: runningSessions.distanceKm,
      durationSeconds: runningSessions.durationSeconds,
      avgPaceSecPerKm: runningSessions.avgPaceSecPerKm,
      avgHeartRate: runningSessions.avgHeartRate,
      activityName: runningSessions.activityName,
      activeCalories: runningSessions.activeCalories,
    })
    .from(runningSessions)
    .where(and(gte(runningSessions.startTime, startDate), lte(runningSessions.startTime, endDate)))
    .orderBy(desc(runningSessions.startTime));
}

export async function getActivityRange(db: Database, startDate: string, endDate: string) {
  return db
    .select()
    .from(activitySummaries)
    .where(and(gte(activitySummaries.date, startDate.slice(0, 10)), lte(activitySummaries.date, endDate.slice(0, 10))))
    .orderBy(activitySummaries.date);
}

export async function getActivityStats(db: Database, startDate: string, endDate: string) {
  const range = and(
    gte(activitySummaries.date, startDate.slice(0, 10)),
    lte(activitySummaries.date, endDate.slice(0, 10)),
  );

  const [agg] = await db
    .select({
      totalCalories: sql<number>`coalesce(sum(${activitySummaries.activeCalories}), 0)`,
      totalExerciseMinutes: sql<number>`coalesce(sum(${activitySummaries.exerciseMinutes}), 0)`,
      days: count(),
    })
    .from(activitySummaries)
    .where(range);

  const days = agg?.days ?? 0;
  return {
    totalCalories: agg?.totalCalories ?? 0,
    totalExerciseMinutes: agg?.totalExerciseMinutes ?? 0,
    avgCalories: days > 0 ? Math.round((agg?.totalCalories ?? 0) / days) : 0,
    avgExerciseMinutes: days > 0 ? Math.round((agg?.totalExerciseMinutes ?? 0) / days) : 0,
    days,
  };
}

export async function getRunningStats(db: Database, startDate: string, endDate: string) {
  const range = and(
    gte(runningSessions.startTime, startDate),
    lte(runningSessions.startTime, endDate),
  );

  const [agg] = await db
    .select({
      totalDistanceKm: sql<number>`coalesce(sum(${runningSessions.distanceKm}), 0)`,
      totalDurationSeconds: sql<number>`coalesce(sum(${runningSessions.durationSeconds}), 0)`,
      avgHeartRate: sql<number>`coalesce(avg(${runningSessions.avgHeartRate}), 0)`,
      workoutCount: count(),
    })
    .from(runningSessions)
    .where(range);

  const totalDist = agg?.totalDistanceKm ?? 0;
  const totalDur = agg?.totalDurationSeconds ?? 0;

  return {
    totalDistanceKm: Math.round(totalDist * 100) / 100,
    totalDurationSeconds: totalDur,
    avgPaceSecPerKm: totalDist > 0 ? Math.round(totalDur / totalDist) : 0,
    avgHeartRate: Math.round(agg?.avgHeartRate ?? 0),
    workoutCount: agg?.workoutCount ?? 0,
  };
}

export async function getWeeklyDistances(db: Database, startDate: string, endDate: string) {
  const range = and(
    gte(runningSessions.startTime, startDate),
    lte(runningSessions.startTime, endDate),
  );

  const rows = await db
    .select({
      weekStart: sql<string>`date(${runningSessions.startTime}, 'weekday 1', '-7 days')`.as('week_start'),
      totalDistanceKm: sql<number>`coalesce(sum(${runningSessions.distanceKm}), 0)`,
      runCount: count(),
      runningDistanceKm: sql<number>`coalesce(sum(case when ${runningSessions.activityName} = 'Running' then ${runningSessions.distanceKm} else 0 end), 0)`,
      cyclingDistanceKm: sql<number>`coalesce(sum(case when ${runningSessions.activityName} = 'Cycling' then ${runningSessions.distanceKm} else 0 end), 0)`,
    })
    .from(runningSessions)
    .where(range)
    .groupBy(sql`date(${runningSessions.startTime}, 'weekday 1', '-7 days')`)
    .orderBy(sql`week_start`);

  return rows.map((r) => ({
    weekStart: r.weekStart,
    totalDistanceKm: Math.round(r.totalDistanceKm * 100) / 100,
    runCount: r.runCount,
    runningDistanceKm: Math.round(r.runningDistanceKm * 100) / 100,
    cyclingDistanceKm: Math.round(r.cyclingDistanceKm * 100) / 100,
  }));
}

export async function getPaceHistory(db: Database, startDate: string, endDate: string) {
  const range = and(
    gte(runningSessions.startTime, startDate),
    lte(runningSessions.startTime, endDate),
  );

  return db
    .select({
      startTime: runningSessions.startTime,
      avgPaceSecPerKm: runningSessions.avgPaceSecPerKm,
      distanceKm: runningSessions.distanceKm,
      activityName: runningSessions.activityName,
    })
    .from(runningSessions)
    .where(range)
    .orderBy(runningSessions.startTime);
}

export async function getRunningExtendedStats(db: Database, startDate: string, endDate: string) {
  const range = and(
    gte(runningSessions.startTime, startDate),
    lte(runningSessions.startTime, endDate),
  );

  const [agg] = await db
    .select({
      totalDistanceKm: sql<number>`coalesce(sum(${runningSessions.distanceKm}), 0)`,
      totalDurationSeconds: sql<number>`coalesce(sum(${runningSessions.durationSeconds}), 0)`,
      avgHeartRate: sql<number>`coalesce(avg(${runningSessions.avgHeartRate}), 0)`,
      workoutCount: count(),
      longestRunKm: sql<number>`coalesce(max(${runningSessions.distanceKm}), 0)`,
      fastestPaceSecPerKm: sql<number>`min(case when ${runningSessions.avgPaceSecPerKm} > 0 then ${runningSessions.avgPaceSecPerKm} else null end)`,
      totalElevationGainM: sql<number>`coalesce(sum(${runningSessions.elevationGainM}), 0)`,
      totalActiveCalories: sql<number>`coalesce(sum(${runningSessions.activeCalories}), 0)`,
    })
    .from(runningSessions)
    .where(range);

  const totalDist = agg?.totalDistanceKm ?? 0;
  const totalDur = agg?.totalDurationSeconds ?? 0;

  return {
    totalDistanceKm: Math.round(totalDist * 100) / 100,
    totalDurationSeconds: totalDur,
    avgPaceSecPerKm: totalDist > 0 ? Math.round(totalDur / totalDist) : 0,
    avgHeartRate: Math.round(agg?.avgHeartRate ?? 0),
    workoutCount: agg?.workoutCount ?? 0,
    longestRunKm: Math.round((agg?.longestRunKm ?? 0) * 100) / 100,
    fastestPaceSecPerKm: agg?.fastestPaceSecPerKm ?? 0,
    totalElevationGainM: Math.round((agg?.totalElevationGainM ?? 0) * 10) / 10,
    totalActiveCalories: agg?.totalActiveCalories ?? 0,
  };
}

export async function getGlucoseDailyTIR(db: Database, startDate: string, endDate: string) {
  const rows = await db
    .select({
      date: sql<string>`date(${glucoseReadings.timestamp})`.as('date'),
      count: count(),
      inRange: sql<number>`sum(case when ${glucoseReadings.value} >= 3.9 and ${glucoseReadings.value} <= 10.0 then 1 else 0 end)`,
    })
    .from(glucoseReadings)
    .where(and(gte(glucoseReadings.timestamp, startDate), lte(glucoseReadings.timestamp, endDate)))
    .groupBy(sql`date(${glucoseReadings.timestamp})`)
    .orderBy(sql`date(${glucoseReadings.timestamp})`);

  return rows.map((r) => ({
    date: r.date,
    tirPercent: Math.round(((r.inRange ?? 0) / r.count) * 100),
    count: r.count,
  }));
}

export async function getPaceHRCorrelation(db: Database, startDate: string, endDate: string) {
  const range = and(
    gte(runningSessions.startTime, startDate),
    lte(runningSessions.startTime, endDate),
  );

  return db
    .select({
      avgPaceSecPerKm: runningSessions.avgPaceSecPerKm,
      avgHeartRate: runningSessions.avgHeartRate,
      distanceKm: runningSessions.distanceKm,
      startTime: runningSessions.startTime,
    })
    .from(runningSessions)
    .where(
      and(
        range,
        sql`${runningSessions.avgHeartRate} IS NOT NULL`,
        sql`${runningSessions.avgPaceSecPerKm} IS NOT NULL`,
        sql`${runningSessions.avgPaceSecPerKm} > 0`,
      ),
    )
    .orderBy(runningSessions.startTime);
}

// ── Race queries ──

export async function getRacesWithResults(db: Database) {
  const rows = await db
    .select({
      id: races.id,
      name: races.name,
      date: races.date,
      location: races.location,
      distance: races.distance,
      status: races.status,
      resultsUrl: races.resultsUrl,
      resultId: raceResults.id,
      raceId: raceResults.raceId,
      bibNumber: raceResults.bibNumber,
      chipTime: raceResults.chipTime,
      gunTime: raceResults.gunTime,
      pacePerKm: raceResults.pacePerKm,
      city: raceResults.city,
      division: raceResults.division,
      overallPlace: raceResults.overallPlace,
      overallTotal: raceResults.overallTotal,
      genderPlace: raceResults.genderPlace,
      genderTotal: raceResults.genderTotal,
      divisionPlace: raceResults.divisionPlace,
      divisionTotal: raceResults.divisionTotal,
      resultResultsUrl: raceResults.resultsUrl,
    })
    .from(races)
    .leftJoin(raceResults, eq(races.id, raceResults.raceId))
    .orderBy(desc(races.date));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    date: r.date,
    location: r.location,
    distance: r.distance,
    status: r.status as 'completed' | 'upcoming' | 'target',
    resultsUrl: r.resultsUrl,
    result: r.resultId
      ? {
          id: r.resultId,
          raceId: r.raceId!,
          bibNumber: r.bibNumber,
          chipTime: r.chipTime,
          gunTime: r.gunTime,
          pacePerKm: r.pacePerKm,
          city: r.city,
          division: r.division,
          overallPlace: r.overallPlace,
          overallTotal: r.overallTotal,
          genderPlace: r.genderPlace,
          genderTotal: r.genderTotal,
          divisionPlace: r.divisionPlace,
          divisionTotal: r.divisionTotal,
          resultsUrl: r.resultResultsUrl,
        }
      : null,
  }));
}

export async function getTargetRace(db: Database) {
  const rows = await db
    .select({
      id: races.id,
      name: races.name,
      date: races.date,
      location: races.location,
      distance: races.distance,
      status: races.status,
      resultsUrl: races.resultsUrl,
    })
    .from(races)
    .where(eq(races.status, 'target'))
    .orderBy(asc(races.date))
    .limit(1);

  return rows[0] ?? null;
}

export async function getRacesByStatus(db: Database, status: 'completed' | 'upcoming' | 'target') {
  return db
    .select()
    .from(races)
    .where(eq(races.status, status))
    .orderBy(desc(races.date));
}

export async function getRaceStats(db: Database) {
  // Total completed races
  const [countRow] = await db
    .select({ n: count() })
    .from(races)
    .where(eq(races.status, 'completed'));

  const totalRaces = countRow?.n ?? 0;

  // PBs per distance: find the fastest chip time per distance
  // Using min on chip time string works because "0:47:41" < "0:52:00" lexicographically
  // for same-length time strings (H:MM:SS format)
  const pbRows = await db
    .select({
      distance: races.distance,
      chipTime: min(raceResults.chipTime).as('best_chip_time'),
    })
    .from(races)
    .innerJoin(raceResults, eq(races.id, raceResults.raceId))
    .where(eq(races.status, 'completed'))
    .groupBy(races.distance);

  // For each PB, get the race name and date
  const personalBests = [];
  for (const pb of pbRows) {
    if (!pb.chipTime) continue;
    const [raceRow] = await db
      .select({ name: races.name, date: races.date })
      .from(races)
      .innerJoin(raceResults, eq(races.id, raceResults.raceId))
      .where(
        and(
          eq(races.distance, pb.distance),
          eq(raceResults.chipTime, pb.chipTime),
          eq(races.status, 'completed'),
        ),
      )
      .limit(1);

    if (raceRow) {
      personalBests.push({
        distance: pb.distance,
        chipTime: pb.chipTime,
        raceName: raceRow.name,
        date: raceRow.date,
      });
    }
  }

  return { totalRaces, personalBests };
}

export async function insertRace(
  db: Database,
  data: { name: string; date: string; location?: string | null; distance: string; status: 'completed' | 'upcoming' | 'target'; resultsUrl?: string | null },
) {
  const rows = await db.insert(races).values({
    name: data.name,
    date: data.date,
    location: data.location ?? null,
    distance: data.distance,
    status: data.status,
    resultsUrl: data.resultsUrl ?? null,
  }).returning({ id: races.id });
  return rows[0]!.id;
}

export async function insertRaceResult(
  db: Database,
  data: {
    raceId: number;
    bibNumber?: string | null;
    chipTime?: string | null;
    gunTime?: string | null;
    pacePerKm?: string | null;
    city?: string | null;
    division?: string | null;
    overallPlace?: number | null;
    overallTotal?: number | null;
    genderPlace?: number | null;
    genderTotal?: number | null;
    divisionPlace?: number | null;
    divisionTotal?: number | null;
    resultsUrl?: string | null;
  },
) {
  await db.insert(raceResults).values({
    raceId: data.raceId,
    bibNumber: data.bibNumber ?? null,
    chipTime: data.chipTime ?? null,
    gunTime: data.gunTime ?? null,
    pacePerKm: data.pacePerKm ?? null,
    city: data.city ?? null,
    division: data.division ?? null,
    overallPlace: data.overallPlace ?? null,
    overallTotal: data.overallTotal ?? null,
    genderPlace: data.genderPlace ?? null,
    genderTotal: data.genderTotal ?? null,
    divisionPlace: data.divisionPlace ?? null,
    divisionTotal: data.divisionTotal ?? null,
    resultsUrl: data.resultsUrl ?? null,
  });
}

export async function updateRace(
  db: Database,
  id: number,
  updates: Partial<{ name: string; date: string; location: string | null; distance: string; status: 'completed' | 'upcoming' | 'target'; resultsUrl: string | null }>,
) {
  await db.update(races).set(updates).where(eq(races.id, id));
}

export async function updateRaceResult(
  db: Database,
  raceId: number,
  updates: Partial<{
    bibNumber: string | null;
    chipTime: string | null;
    gunTime: string | null;
    pacePerKm: string | null;
    city: string | null;
    division: string | null;
    overallPlace: number | null;
    overallTotal: number | null;
    genderPlace: number | null;
    genderTotal: number | null;
    divisionPlace: number | null;
    divisionTotal: number | null;
    resultsUrl: string | null;
  }>,
) {
  await db.update(raceResults).set(updates).where(eq(raceResults.raceId, raceId));
}

export async function deleteRace(db: Database, id: number) {
  await db.delete(raceResults).where(eq(raceResults.raceId, id));
  await db.delete(races).where(eq(races.id, id));
}

// ── GitHub queries ──

export async function getGitHubContributions(db: Database, startDate: string, endDate: string) {
  return db
    .select({ date: githubContributions.date, count: githubContributions.count })
    .from(githubContributions)
    .where(and(gte(githubContributions.date, startDate), lte(githubContributions.date, endDate)))
    .orderBy(githubContributions.date);
}

export async function getGitHubContributionStats(db: Database, startDate: string, endDate: string) {
  const contributions = await getGitHubContributions(db, startDate, endDate);

  const total = contributions.reduce((s, c) => s + c.count, 0);

  // Calculate current streak (consecutive days with count > 0 ending today or yesterday)
  let currentStreak = 0;
  for (let i = contributions.length - 1; i >= 0; i--) {
    if (contributions[i]!.count > 0) {
      currentStreak++;
    } else if (currentStreak > 0) {
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let streak = 0;
  for (const c of contributions) {
    if (c.count > 0) {
      streak++;
      if (streak > longestStreak) longestStreak = streak;
    } else {
      streak = 0;
    }
  }

  return { total, currentStreak, longestStreak };
}

export async function getGitHubRepos(db: Database, limit = 50) {
  return db
    .select({
      name: githubRepos.name,
      fullName: githubRepos.fullName,
      description: githubRepos.description,
      url: githubRepos.url,
      language: githubRepos.language,
      stars: githubRepos.stars,
      forks: githubRepos.forks,
      isArchived: githubRepos.isArchived,
      isFork: githubRepos.isFork,
      pushedAt: githubRepos.pushedAt,
    })
    .from(githubRepos)
    .where(eq(githubRepos.isFork, false))
    .orderBy(desc(githubRepos.pushedAt))
    .limit(limit);
}

export async function getGitHubLanguages(db: Database) {
  const rows = await db
    .select({
      language: githubLanguages.language,
      totalBytes: sql<number>`sum(${githubLanguages.bytes})`.as('total_bytes'),
    })
    .from(githubLanguages)
    .groupBy(githubLanguages.language)
    .orderBy(desc(sql`total_bytes`));

  const grandTotal = rows.reduce((s, r) => s + r.totalBytes, 0);

  return rows.map((r) => ({
    language: r.language,
    bytes: r.totalBytes,
    percentage: grandTotal > 0 ? Math.round((r.totalBytes / grandTotal) * 1000) / 10 : 0,
  }));
}

export async function getGitHubEvents(db: Database, limit = 30) {
  return db
    .select({
      type: githubEvents.type,
      repo: githubEvents.repo,
      message: githubEvents.message,
      ref: githubEvents.ref,
      timestamp: githubEvents.timestamp,
    })
    .from(githubEvents)
    .orderBy(desc(githubEvents.timestamp))
    .limit(limit);
}

// ── Claude Code usage queries ──

export async function getClaudeCodeDaily(db: Database, startDate: string, endDate: string) {
  return db
    .select()
    .from(claudeCodeDaily)
    .where(and(gte(claudeCodeDaily.date, startDate), lte(claudeCodeDaily.date, endDate)))
    .orderBy(claudeCodeDaily.date);
}

export async function getClaudeCodeByModel(db: Database, startDate: string, endDate: string) {
  const range = and(gte(claudeCodeModels.date, startDate), lte(claudeCodeModels.date, endDate));

  return db
    .select({
      model: claudeCodeModels.model,
      inputTokens: sql<number>`sum(${claudeCodeModels.inputTokens})`.as('input_tokens'),
      outputTokens: sql<number>`sum(${claudeCodeModels.outputTokens})`.as('output_tokens'),
      costCents: sql<number>`sum(${claudeCodeModels.costCents})`.as('cost_cents'),
    })
    .from(claudeCodeModels)
    .where(range)
    .groupBy(claudeCodeModels.model)
    .orderBy(desc(sql`cost_cents`));
}

export async function getClaudeCodeTotals(db: Database, startDate: string, endDate: string) {
  const range = and(gte(claudeCodeDaily.date, startDate), lte(claudeCodeDaily.date, endDate));

  const [agg] = await db
    .select({
      sessions: sql<number>`coalesce(sum(${claudeCodeDaily.sessions}), 0)`,
      linesAdded: sql<number>`coalesce(sum(${claudeCodeDaily.linesAdded}), 0)`,
      linesRemoved: sql<number>`coalesce(sum(${claudeCodeDaily.linesRemoved}), 0)`,
      commits: sql<number>`coalesce(sum(${claudeCodeDaily.commits}), 0)`,
      pullRequests: sql<number>`coalesce(sum(${claudeCodeDaily.pullRequests}), 0)`,
      editAccepted: sql<number>`coalesce(sum(${claudeCodeDaily.editAccepted}), 0)`,
      editRejected: sql<number>`coalesce(sum(${claudeCodeDaily.editRejected}), 0)`,
      inputTokens: sql<number>`coalesce(sum(${claudeCodeDaily.inputTokens}), 0)`,
      outputTokens: sql<number>`coalesce(sum(${claudeCodeDaily.outputTokens}), 0)`,
      costCents: sql<number>`coalesce(sum(${claudeCodeDaily.costCents}), 0)`,
      days: sql<number>`count(*)`,
    })
    .from(claudeCodeDaily)
    .where(range);

  return {
    sessions: agg?.sessions ?? 0,
    linesAdded: agg?.linesAdded ?? 0,
    linesRemoved: agg?.linesRemoved ?? 0,
    commits: agg?.commits ?? 0,
    pullRequests: agg?.pullRequests ?? 0,
    editAcceptRate: (agg?.editAccepted ?? 0) + (agg?.editRejected ?? 0) > 0
      ? Math.round(((agg?.editAccepted ?? 0) / ((agg?.editAccepted ?? 0) + (agg?.editRejected ?? 0))) * 100)
      : 0,
    inputTokens: agg?.inputTokens ?? 0,
    outputTokens: agg?.outputTokens ?? 0,
    totalTokens: (agg?.inputTokens ?? 0) + (agg?.outputTokens ?? 0),
    costCents: agg?.costCents ?? 0,
    days: agg?.days ?? 0,
  };
}
