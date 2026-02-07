import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DailyUsage {
  date: string;
  sessions: number | null;
  linesAdded: number | null;
  linesRemoved: number | null;
  commits: number | null;
  pullRequests: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  costCents: number | null;
}

interface ModelUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  costCents: number;
}

interface Totals {
  sessions: number;
  linesAdded: number;
  linesRemoved: number;
  commits: number;
  pullRequests: number;
  editAcceptRate: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costCents: number;
  days: number;
}

interface Props {
  daily: DailyUsage[];
  byModel: ModelUsage[];
  totals: Totals;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatCost(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 100) return `$${Math.round(dollars)}`;
  if (dollars >= 1) return `$${dollars.toFixed(2)}`;
  if (dollars > 0) return `$${dollars.toFixed(2)}`;
  return '$0';
}

function shortModel(model: string): string {
  if (model.includes('opus-4')) return 'Opus 4';
  if (model.includes('sonnet-4')) return 'Sonnet 4';
  if (model.includes('haiku-4')) return 'Haiku 4';
  if (model.includes('3-5-sonnet') || model.includes('3.5-sonnet')) return 'Sonnet 3.5';
  if (model.includes('3-5-haiku') || model.includes('3.5-haiku')) return 'Haiku 3.5';
  if (model.includes('3-opus')) return 'Opus 3';
  return model.split('-').slice(-2).join(' ') || model;
}

export default function ClaudeUsageChart({ daily, byModel, totals }: Props) {
  const chartData = daily.map((d) => ({
    date: d.date,
    label: new Date(d.date + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' }),
    sessions: d.sessions ?? 0,
    linesAdded: d.linesAdded ?? 0,
    linesRemoved: d.linesRemoved ?? 0,
    input: d.inputTokens ?? 0,
    output: d.outputTokens ?? 0,
  }));

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-tile border border-stroke rounded-lg p-3">
          <div className="text-[10px] text-dim uppercase tracking-wide">Sessions</div>
          <div className="text-lg font-semibold text-heading mt-1">{totals.sessions.toLocaleString()}</div>
        </div>
        <div className="bg-tile border border-stroke rounded-lg p-3">
          <div className="text-[10px] text-dim uppercase tracking-wide">Lines Added</div>
          <div className="text-lg font-semibold text-heading mt-1">+{totals.linesAdded.toLocaleString()}</div>
          <div className="text-[10px] text-dim">-{totals.linesRemoved.toLocaleString()} removed</div>
        </div>
        <div className="bg-tile border border-stroke rounded-lg p-3">
          <div className="text-[10px] text-dim uppercase tracking-wide">Commits / PRs</div>
          <div className="text-lg font-semibold text-heading mt-1">{totals.commits}</div>
          <div className="text-[10px] text-dim">{totals.pullRequests} PRs</div>
        </div>
        <div className="bg-tile border border-stroke rounded-lg p-3">
          <div className="text-[10px] text-dim uppercase tracking-wide">Est. Cost</div>
          <div className="text-lg font-semibold text-heading mt-1">{formatCost(totals.costCents)}</div>
          <div className="text-[10px] text-dim">{totals.editAcceptRate}% accept rate</div>
        </div>
      </div>

      {/* Sessions + lines chart */}
      {chartData.length > 0 && (
        <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
          <div className="text-xs font-medium text-dim uppercase tracking-wide mb-4">Daily Sessions & Lines of Code</div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-stroke-soft)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'var(--color-dim)' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--color-dim)' }}
                  tickLine={false}
                  axisLine={false}
                  width={45}
                />
                <Tooltip
                  content={({ payload, label }) => {
                    if (!payload?.length) return null;
                    const d = payload[0]?.payload as (typeof chartData)[0] | undefined;
                    if (!d) return null;
                    return (
                      <div className="bg-tile border border-stroke rounded-lg px-3 py-2 shadow-lg text-xs">
                        <div className="font-medium text-body mb-1">{label}</div>
                        <div className="text-purple-400">{d.sessions} sessions</div>
                        <div className="text-green-400">+{d.linesAdded.toLocaleString()} lines</div>
                        <div className="text-red-400">-{d.linesRemoved.toLocaleString()} lines</div>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="linesAdded"
                  stroke="#4ade80"
                  fill="#4ade80"
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="sessions"
                  stroke="#a78bfa"
                  fill="#a78bfa"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-end gap-4 mt-2 text-[10px] text-dim">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-sm bg-green-400" />
              Lines Added
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-sm bg-purple-400" />
              Sessions
            </span>
          </div>
        </div>
      )}

      {/* Token usage chart */}
      {chartData.length > 0 && (
        <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
          <div className="text-xs font-medium text-dim uppercase tracking-wide mb-4">Daily Token Usage</div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-stroke-soft)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'var(--color-dim)' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--color-dim)' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatTokens}
                  width={45}
                />
                <Tooltip
                  content={({ payload, label }) => {
                    if (!payload?.length) return null;
                    const input = (payload[0]?.value as number) ?? 0;
                    const output = (payload[1]?.value as number) ?? 0;
                    return (
                      <div className="bg-tile border border-stroke rounded-lg px-3 py-2 shadow-lg text-xs">
                        <div className="font-medium text-body mb-1">{label}</div>
                        <div className="text-blue-400">Input: {formatTokens(input)}</div>
                        <div className="text-orange-400">Output: {formatTokens(output)}</div>
                      </div>
                    );
                  }}
                />
                <Area type="monotone" dataKey="input" stackId="1" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.3} />
                <Area type="monotone" dataKey="output" stackId="1" stroke="#fb923c" fill="#fb923c" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-end gap-4 mt-2 text-[10px] text-dim">
            <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-blue-400" /> Input</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-orange-400" /> Output</span>
          </div>
        </div>
      )}

      {/* Model breakdown */}
      {byModel.length > 0 && (
        <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
          <div className="text-xs font-medium text-dim uppercase tracking-wide mb-3">Usage by Model</div>
          <div className="space-y-2">
            {byModel.map((m) => {
              const total = (m.inputTokens ?? 0) + (m.outputTokens ?? 0);
              const pct = totals.totalTokens > 0 ? (total / totals.totalTokens) * 100 : 0;
              return (
                <div key={m.model} className="flex items-center gap-3">
                  <div className="text-xs text-body w-24 shrink-0 truncate">{shortModel(m.model)}</div>
                  <div className="flex-1 bg-stroke-soft rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${Math.max(pct, 1)}%` }} />
                  </div>
                  <div className="text-xs text-dim w-16 text-right shrink-0">{formatTokens(total)}</div>
                  <div className="text-xs text-dim w-14 text-right shrink-0">{formatCost(m.costCents ?? 0)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
