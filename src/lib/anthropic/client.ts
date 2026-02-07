interface ModelBreakdown {
  model: string;
  tokens: {
    input: number;
    output: number;
    cache_read: number;
    cache_creation: number;
  };
  estimated_cost: {
    currency: string;
    amount: number; // cents USD
  };
}

export interface ClaudeCodeRecord {
  date: string;
  core_metrics: {
    num_sessions: number;
    lines_of_code: { added: number; removed: number };
    commits_by_claude_code: number;
    pull_requests_by_claude_code: number;
  };
  tool_actions: {
    edit_tool?: { accepted: number; rejected: number };
    multi_edit_tool?: { accepted: number; rejected: number };
    write_tool?: { accepted: number; rejected: number };
    notebook_edit_tool?: { accepted: number; rejected: number };
  };
  model_breakdown: ModelBreakdown[];
}

interface AnalyticsResponse {
  data?: ClaudeCodeRecord[];
  has_more?: boolean;
  next_page?: string | null;
}

/**
 * Fetch Claude Code analytics for a single day.
 * Uses /v1/organizations/usage_report/claude_code (Admin API).
 */
export async function fetchClaudeCodeDay(
  adminKey: string,
  date: string,
): Promise<ClaudeCodeRecord[]> {
  const records: ClaudeCodeRecord[] = [];
  let page: string | undefined;

  do {
    const params = new URLSearchParams({ starting_at: date, limit: '1000' });
    if (page) params.set('page', page);

    const url = `https://api.anthropic.com/v1/organizations/usage_report/claude_code?${params}`;
    const res = await fetch(url, {
      headers: {
        'x-api-key': adminKey,
        'anthropic-version': '2023-06-01',
        'User-Agent': 'coultonf-site/1.0',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Claude Code Analytics API: ${res.status} ${text.slice(0, 200)}`);
    }

    const json = await res.json() as AnalyticsResponse;
    if (json.data) records.push(...json.data);
    page = json.has_more ? (json.next_page ?? undefined) : undefined;
  } while (page);

  return records;
}
