import type { APIRoute } from 'astro';
import { getCloudflareEnv } from '@/lib/env';
import { createDb } from '@/lib/db/client';
import { getRacesWithResults, getTargetRace, getRaceStats, getRunningStats } from '@/lib/db/queries';
import { predictFromRace, formatPace } from '@/lib/vdot';
import type { RacesAPIResponse, RaceWithResult, TargetRaceInfo } from '@/lib/types/races';

const emptyResponse: RacesAPIResponse = {
  completed: [],
  upcoming: [],
  target: null,
  stats: { totalRaces: 0, personalBests: [] },
};

async function buildTargetRaceInfo(
  db: ReturnType<typeof createDb>,
  allRaces: RaceWithResult[],
): Promise<TargetRaceInfo | null> {
  const targetRace = await getTargetRace(db);
  if (!targetRace) return null;

  const now = new Date();
  const raceDate = new Date(targetRace.date + 'T00:00:00');
  const daysUntil = Math.max(0, Math.ceil((raceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  // Find best completed race for VDOT predictions
  const completedWithResults = allRaces
    .filter((r) => r.status === 'completed' && r.result?.chipTime);

  let predictions = predictFromRace('', '', []);
  if (completedWithResults.length > 0) {
    // Use the most recent completed race with a chip time
    const best = completedWithResults[0]!;
    predictions = predictFromRace(best.result!.chipTime!, best.distance);
  }

  // Recent 30-day training pace
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const runStats = await getRunningStats(db, thirtyDaysAgo, now.toISOString());
  const recentAvgPace = runStats.avgPaceSecPerKm > 0
    ? formatPace(runStats.avgPaceSecPerKm)
    : null;

  return {
    ...targetRace,
    status: 'target' as const,
    daysUntil,
    predictions,
    recentAvgPace,
  };
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const cfEnv = await getCloudflareEnv();
    if (!cfEnv) {
      return new Response(JSON.stringify(emptyResponse), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = createDb(cfEnv.DB);
    const targetOnly = url.searchParams.get('target') === '1';

    if (targetOnly) {
      const allRaces = await getRacesWithResults(db);
      const target = await buildTargetRaceInfo(db, allRaces);
      return new Response(JSON.stringify({ target }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const [allRaces, stats] = await Promise.all([
      getRacesWithResults(db),
      getRaceStats(db),
    ]);

    const completed = allRaces.filter((r) => r.status === 'completed');
    const upcoming = allRaces.filter((r) => r.status === 'upcoming' || r.status === 'target');
    const target = await buildTargetRaceInfo(db, allRaces);

    const body: RacesAPIResponse = { completed, upcoming, target, stats };

    return new Response(JSON.stringify(body), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[api/health/races]', e);
    return new Response(JSON.stringify(emptyResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
