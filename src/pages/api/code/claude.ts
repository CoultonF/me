import type { APIRoute } from 'astro';
import { getCloudflareEnv } from '@/lib/env';
import { createDb } from '@/lib/db/client';
import { getClaudeCodeDaily, getClaudeCodeByModel, getClaudeCodeTotals } from '@/lib/db/queries';

const RANGE_DAYS: Record<string, number> = {
  '30d': 30,
  '90d': 90,
};

const emptyResponse = {
  daily: [],
  byModel: [],
  totals: { sessions: 0, linesAdded: 0, linesRemoved: 0, commits: 0, pullRequests: 0, editAcceptRate: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0, costCents: 0, days: 0 },
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
    const range = url.searchParams.get('range') ?? '30d';
    const days = RANGE_DAYS[range] ?? 30;

    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const endDate = now.toISOString().slice(0, 10);

    const [daily, byModel, totals] = await Promise.all([
      getClaudeCodeDaily(db, startDate, endDate),
      getClaudeCodeByModel(db, startDate, endDate),
      getClaudeCodeTotals(db, startDate, endDate),
    ]);

    return new Response(JSON.stringify({ daily, byModel, totals }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[api/code/claude]', e);
    return new Response(JSON.stringify(emptyResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
