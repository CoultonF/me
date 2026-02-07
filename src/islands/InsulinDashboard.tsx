import { useState, useEffect, useCallback } from 'react';
import type { InsulinAPIResponse } from '../lib/types/insulin';
import DailyTotals from './insulin/DailyTotals';
import BasalBolusDonut from './insulin/BasalBolusDonut';
import InsulinSummaryCards from './insulin/InsulinSummaryCards';
import DateRangePicker from './insulin/DateRangePicker';
import ErrorBoundary from './shared/ErrorBoundary';
import { CardsSkeleton, ChartSkeleton } from './shared/DashboardSkeleton';
import { useAuth } from './shared/useAuth';

type Range = '7d' | '30d' | '90d';

interface Props {
  initialRange?: Range;
}

const EMPTY_STATS = {
  totalBolus: 0,
  totalBasal: 0,
  total: 0,
  avgDailyTotal: 0,
  bolusPercent: 0,
  basalPercent: 0,
  bolusCount: 0,
  days: 0,
};

export default function InsulinDashboard({ initialRange = '7d' }: Props) {
  const [range, setRange] = useState<Range>(initialRange);
  const [data, setData] = useState<InsulinAPIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const isAdmin = useAuth();

  const fetchData = useCallback(async (r: Range) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/health/insulin?range=${r}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as InsulinAPIResponse;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(range);
  }, [range, fetchData]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/private/api/sync', { method: 'POST' });
      if (!res.ok) throw new Error(`Sync failed: ${res.status}`);
      await fetchData(range);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-heading">Insulin</h2>
          <DateRangePicker selected={range} onChange={setRange} />
        </div>
        <div className="bg-tile border border-stroke rounded-lg p-8 text-center">
          <div className="text-dim">{error}</div>
          <button
            onClick={() => fetchData(range)}
            className="mt-3 text-sm text-accent hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = data?.stats ?? EMPTY_STATS;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-heading">Insulin</h2>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="text-xs font-medium text-subtle border border-stroke rounded-md px-3 py-1.5 hover:text-accent hover:border-accent transition-colors disabled:opacity-50"
            >
              {syncing ? 'Syncing...' : 'Sync'}
            </button>
          )}
          <DateRangePicker selected={range} onChange={setRange} />
        </div>
      </div>

      {loading && !data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2"><ChartSkeleton height={200} /></div>
            <ChartSkeleton height={200} />
          </div>
          <CardsSkeleton count={4} />
        </div>
      ) : (
        <>
          <ErrorBoundary fallbackTitle="Daily totals failed to load">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <DailyTotals dailyTotals={data?.dailyTotals ?? []} />
              </div>
              <BasalBolusDonut stats={stats} />
            </div>
          </ErrorBoundary>

          <ErrorBoundary fallbackTitle="Summary cards failed to load">
            <InsulinSummaryCards stats={stats} />
          </ErrorBoundary>
        </>
      )}
    </div>
  );
}
