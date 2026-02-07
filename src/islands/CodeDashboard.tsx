import { useState, useEffect, useCallback } from 'react';
import ContributionCalendar from './code/ContributionCalendar';
import LanguageBreakdown from './code/LanguageBreakdown';
import RecentActivity from './code/RecentActivity';
import ProjectCards from './code/ProjectCards';
import ClaudeUsageChart from './code/ClaudeUsageChart';
import ErrorBoundary from './shared/ErrorBoundary';
import { ChartSkeleton, CardsSkeleton } from './shared/DashboardSkeleton';
import { useAuth } from './shared/useAuth';

type GitHubRange = '30d' | '90d' | '365d';
type ClaudeRange = '30d' | '90d';

interface GitHubData {
  contributions: { date: string; count: number }[];
  totalContributions: number;
  currentStreak: number;
  longestStreak: number;
  repos: {
    name: string;
    fullName: string;
    description: string | null;
    url: string;
    language: string | null;
    stars: number;
    forks: number;
    isArchived: boolean;
    isFork: boolean;
    pushedAt: string | null;
  }[];
  languages: { language: string; bytes: number; percentage: number }[];
  recentEvents: { type: string; repo: string; message: string | null; ref: string | null; timestamp: string }[];
}

interface ClaudeData {
  daily: { date: string; sessions: number | null; linesAdded: number | null; linesRemoved: number | null; commits: number | null; pullRequests: number | null; inputTokens: number | null; outputTokens: number | null; costCents: number | null }[];
  byModel: { model: string; inputTokens: number; outputTokens: number; costCents: number }[];
  totals: { sessions: number; linesAdded: number; linesRemoved: number; commits: number; pullRequests: number; editAcceptRate: number; inputTokens: number; outputTokens: number; totalTokens: number; costCents: number; days: number };
}

interface Props {
  initialRange?: GitHubRange;
}

const GITHUB_RANGES: GitHubRange[] = ['30d', '90d', '365d'];
const CLAUDE_RANGES: ClaudeRange[] = ['30d', '90d'];

export default function CodeDashboard({ initialRange = '90d' }: Props) {
  const [ghRange, setGhRange] = useState<GitHubRange>(initialRange);
  const [claudeRange, setClaudeRange] = useState<ClaudeRange>('30d');
  const [ghData, setGhData] = useState<GitHubData | null>(null);
  const [claudeData, setClaudeData] = useState<ClaudeData | null>(null);
  const [ghLoading, setGhLoading] = useState(true);
  const [claudeLoading, setClaudeLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const isAdmin = useAuth();

  const fetchGitHub = useCallback(async (r: GitHubRange) => {
    setGhLoading(true);
    try {
      const res = await fetch(`/api/code/github?range=${r}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setGhData(await res.json() as GitHubData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load GitHub data');
    } finally {
      setGhLoading(false);
    }
  }, []);

  const fetchClaude = useCallback(async (r: ClaudeRange) => {
    setClaudeLoading(true);
    try {
      const res = await fetch(`/api/code/claude?range=${r}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setClaudeData(await res.json() as ClaudeData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load Claude data');
    } finally {
      setClaudeLoading(false);
    }
  }, []);

  useEffect(() => { fetchGitHub(ghRange); }, [ghRange, fetchGitHub]);
  useEffect(() => { fetchClaude(claudeRange); }, [claudeRange, fetchClaude]);

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch('/private/api/sync-code', { method: 'POST' });
      if (!res.ok) throw new Error(`Sync failed: ${res.status}`);
      await Promise.all([fetchGitHub(ghRange), fetchClaude(claudeRange)]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-heading">Code</h2>
        {isAdmin && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="text-xs font-medium text-subtle border border-stroke rounded-md px-3 py-1.5 hover:text-accent hover:border-accent transition-colors disabled:opacity-50"
          >
            {syncing ? 'Syncing...' : 'Sync'}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-tile border border-stroke rounded-lg p-4 text-center">
          <div className="text-sm text-dim">{error}</div>
          <button
            onClick={() => { setError(null); fetchGitHub(ghRange); fetchClaude(claudeRange); }}
            className="mt-2 text-sm text-accent hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── GitHub Section ── */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-heading uppercase tracking-wide">GitHub</h3>
          <div className="flex gap-1">
            {GITHUB_RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setGhRange(r)}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                  r === ghRange
                    ? 'bg-accent text-white'
                    : 'text-subtle hover:text-body border border-stroke hover:border-accent'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {ghLoading && !ghData ? (
          <div className="space-y-4">
            <ChartSkeleton height={150} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ChartSkeleton height={200} />
              <ChartSkeleton height={200} />
            </div>
            <CardsSkeleton count={4} columns={2} />
          </div>
        ) : ghData ? (
          <div className="space-y-4">
            <ErrorBoundary fallbackTitle="Contribution calendar failed to load">
              <ContributionCalendar
                contributions={ghData.contributions}
                totalContributions={ghData.totalContributions}
                currentStreak={ghData.currentStreak}
                longestStreak={ghData.longestStreak}
              />
            </ErrorBoundary>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ErrorBoundary fallbackTitle="Language chart failed to load">
                <LanguageBreakdown languages={ghData.languages} />
              </ErrorBoundary>

              <ErrorBoundary fallbackTitle="Recent activity failed to load">
                <RecentActivity events={ghData.recentEvents} />
              </ErrorBoundary>
            </div>

            <ErrorBoundary fallbackTitle="Projects failed to load">
              <ProjectCards repos={ghData.repos} />
            </ErrorBoundary>
          </div>
        ) : null}
      </section>

      {/* ── Claude AI Section ── */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-heading uppercase tracking-wide">Claude AI Usage</h3>
          <div className="flex gap-1">
            {CLAUDE_RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setClaudeRange(r)}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                  r === claudeRange
                    ? 'bg-accent text-white'
                    : 'text-subtle hover:text-body border border-stroke hover:border-accent'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {claudeLoading && !claudeData ? (
          <div className="space-y-4">
            <CardsSkeleton count={4} />
            <ChartSkeleton height={240} />
          </div>
        ) : claudeData ? (
          <ErrorBoundary fallbackTitle="Claude usage failed to load">
            <ClaudeUsageChart
              daily={claudeData.daily}
              byModel={claudeData.byModel}
              totals={claudeData.totals}
            />
          </ErrorBoundary>
        ) : null}
      </section>
    </div>
  );
}
