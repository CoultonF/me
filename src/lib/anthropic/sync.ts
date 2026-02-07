import { claudeCodeDaily, claudeCodeModels } from '../db/schema';
import { fetchClaudeCodeDay } from './client';
import type { ClaudeCodeRecord } from './client';
import type { Database } from '../db/client';

interface AnthropicSyncEnv {
  ANTHROPIC_ADMIN_KEY: string;
}

interface SyncResult {
  days: number;
  totalSessions: number;
  error?: string;
}

function aggregateDay(records: ClaudeCodeRecord[]) {
  let sessions = 0, linesAdded = 0, linesRemoved = 0, commits = 0, prs = 0;
  let editAccepted = 0, editRejected = 0, writeAccepted = 0, writeRejected = 0;
  let inputTokens = 0, outputTokens = 0, cacheRead = 0, cacheCreation = 0, costCents = 0;
  const modelMap = new Map<string, { input: number; output: number; cacheRead: number; cacheCreation: number; cost: number }>();

  for (const r of records) {
    sessions += r.core_metrics?.num_sessions ?? 0;
    linesAdded += r.core_metrics?.lines_of_code?.added ?? 0;
    linesRemoved += r.core_metrics?.lines_of_code?.removed ?? 0;
    commits += r.core_metrics?.commits_by_claude_code ?? 0;
    prs += r.core_metrics?.pull_requests_by_claude_code ?? 0;

    const ta = r.tool_actions ?? {};
    editAccepted += (ta.edit_tool?.accepted ?? 0) + (ta.multi_edit_tool?.accepted ?? 0);
    editRejected += (ta.edit_tool?.rejected ?? 0) + (ta.multi_edit_tool?.rejected ?? 0);
    writeAccepted += ta.write_tool?.accepted ?? 0;
    writeRejected += ta.write_tool?.rejected ?? 0;

    for (const mb of r.model_breakdown ?? []) {
      const t = mb.tokens ?? { input: 0, output: 0, cache_read: 0, cache_creation: 0 };
      inputTokens += t.input;
      outputTokens += t.output;
      cacheRead += t.cache_read;
      cacheCreation += t.cache_creation;
      const c = mb.estimated_cost?.amount ?? 0;
      costCents += c;

      const model = mb.model ?? 'unknown';
      const existing = modelMap.get(model) ?? { input: 0, output: 0, cacheRead: 0, cacheCreation: 0, cost: 0 };
      existing.input += t.input;
      existing.output += t.output;
      existing.cacheRead += t.cache_read;
      existing.cacheCreation += t.cache_creation;
      existing.cost += c;
      modelMap.set(model, existing);
    }
  }

  return {
    daily: { sessions, linesAdded, linesRemoved, commits, pullRequests: prs, editAccepted, editRejected, writeAccepted, writeRejected, inputTokens, outputTokens, cacheReadTokens: cacheRead, cacheCreationTokens: cacheCreation, costCents },
    models: modelMap,
  };
}

export async function syncClaudeUsage(db: Database, env: AnthropicSyncEnv): Promise<SyncResult> {
  const { ANTHROPIC_ADMIN_KEY: adminKey } = env;

  if (!adminKey) {
    return { days: 0, totalSessions: 0, error: 'Missing ANTHROPIC_ADMIN_KEY' };
  }

  try {
    const now = new Date();
    let daysProcessed = 0;
    let totalSessions = 0;

    // Fetch last 30 days, one day at a time (Cloudflare has a 50 subrequest limit)
    for (let i = 30; i >= 1; i--) {
      const d = new Date(now);
      d.setUTCDate(d.getUTCDate() - i);
      const date = d.toISOString().slice(0, 10);

      const records = await fetchClaudeCodeDay(adminKey, date);
      if (records.length === 0) continue;

      const { daily, models } = aggregateDay(records);
      totalSessions += daily.sessions;

      // Upsert daily aggregate
      await db
        .insert(claudeCodeDaily)
        .values({ date, ...daily })
        .onConflictDoUpdate({
          target: claudeCodeDaily.date,
          set: {
            sessions: claudeCodeDaily.sessions,
            linesAdded: claudeCodeDaily.linesAdded,
            linesRemoved: claudeCodeDaily.linesRemoved,
            commits: claudeCodeDaily.commits,
            pullRequests: claudeCodeDaily.pullRequests,
            editAccepted: claudeCodeDaily.editAccepted,
            editRejected: claudeCodeDaily.editRejected,
            writeAccepted: claudeCodeDaily.writeAccepted,
            writeRejected: claudeCodeDaily.writeRejected,
            inputTokens: claudeCodeDaily.inputTokens,
            outputTokens: claudeCodeDaily.outputTokens,
            cacheReadTokens: claudeCodeDaily.cacheReadTokens,
            cacheCreationTokens: claudeCodeDaily.cacheCreationTokens,
            costCents: claudeCodeDaily.costCents,
          },
        });

      // Upsert per-model breakdowns
      for (const [model, m] of models) {
        await db
          .insert(claudeCodeModels)
          .values({
            date,
            model,
            inputTokens: m.input,
            outputTokens: m.output,
            cacheReadTokens: m.cacheRead,
            cacheCreationTokens: m.cacheCreation,
            costCents: m.cost,
          })
          .onConflictDoUpdate({
            target: [claudeCodeModels.date, claudeCodeModels.model],
            set: {
              inputTokens: claudeCodeModels.inputTokens,
              outputTokens: claudeCodeModels.outputTokens,
              cacheReadTokens: claudeCodeModels.cacheReadTokens,
              cacheCreationTokens: claudeCodeModels.cacheCreationTokens,
              costCents: claudeCodeModels.costCents,
            },
          });
      }

      daysProcessed++;
    }

    console.log(`[sync-claude] days=${daysProcessed} sessions=${totalSessions}`);
    return { days: daysProcessed, totalSessions };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[sync-claude]', msg);
    return { days: 0, totalSessions: 0, error: msg };
  }
}
