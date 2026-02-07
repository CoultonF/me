import type { APIRoute } from 'astro';
import { getCloudflareEnv } from '@/lib/env';
import { createDb } from '@/lib/db/client';
import {
  getGitHubContributions,
  getGitHubContributionStats,
  getGitHubRepos,
  getGitHubLanguages,
  getGitHubEvents,
} from '@/lib/db/queries';

const RANGE_DAYS: Record<string, number> = {
  '30d': 30,
  '90d': 90,
  '365d': 365,
};

const emptyResponse = {
  contributions: [],
  totalContributions: 0,
  currentStreak: 0,
  longestStreak: 0,
  repos: [],
  languages: [],
  recentEvents: [],
};

export const GET: APIRoute = async ({ url }) => {
  try {
    const cfEnv = await getCloudflareEnv();
    if (!cfEnv) {
      return new Response(JSON.stringify(emptyResponse), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = createDb(cfEnv.DB);
    const range = url.searchParams.get('range') ?? '90d';
    const days = RANGE_DAYS[range] ?? 90;

    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const endDate = now.toISOString().slice(0, 10);

    const [contributions, stats, repos, languages, recentEvents] = await Promise.all([
      getGitHubContributions(db, startDate, endDate),
      getGitHubContributionStats(db, startDate, endDate),
      getGitHubRepos(db, 20),
      getGitHubLanguages(db),
      getGitHubEvents(db, 30),
    ]);

    return new Response(JSON.stringify({
      contributions,
      totalContributions: stats.total,
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      repos,
      languages,
      recentEvents,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[api/code/github]', e);
    return new Response(JSON.stringify(emptyResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
