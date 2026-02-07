import { useState, useEffect, useCallback } from 'react';
import type { GlucoseAPIResponse } from '../lib/types/glucose';
import CurrentReading from './glucose/CurrentReading';
import GlucoseTimeSeries from './glucose/GlucoseTimeSeries';
import GlucoseOverlay24h from './glucose/GlucoseOverlay24h';
import TimeInRangeDonut from './glucose/TimeInRangeDonut';
import SummaryCards from './glucose/SummaryCards';
import DateRangePicker from './glucose/DateRangePicker';
import ErrorBoundary from './shared/ErrorBoundary';
import { CardsSkeleton, ChartSkeleton } from './shared/DashboardSkeleton';

type Range = '24h' | '7d' | '30d' | '90d';

interface Props {
  initialRange?: Range;
}

const EMPTY_STATS = {
  min: 0,
  max: 0,
  avg: 0,
  count: 0,
  timeInRange: { low: 0, normal: 0, high: 0, veryHigh: 0 },
};

export default function GlucoseDashboard({ initialRange = '24h' }: Props) {
  const [range, setRange] = useState<Range>(initialRange);
  const [data, setData] = useState<GlucoseAPIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchData = useCallback(async (r: Range) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/health/glucose?range=${r}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as GlucoseAPIResponse;
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

  const handleRangeChange = (r: Range) => {
    setRange(r);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/health/sync', { method: 'POST' });
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
          <h2 className="text-lg font-semibold text-heading">Glucose</h2>
          <DateRangePicker selected={range} onChange={handleRangeChange} />
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
        <h2 className="text-lg font-semibold text-heading">Glucose</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="text-xs font-medium text-subtle border border-stroke rounded-md px-3 py-1.5 hover:text-accent hover:border-accent transition-colors disabled:opacity-50"
          >
            {syncing ? 'Syncing...' : 'Sync'}
          </button>
          <DateRangePicker selected={range} onChange={handleRangeChange} />
        </div>
      </div>

      {loading && !data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ChartSkeleton height={160} />
            <div className="md:col-span-2"><ChartSkeleton height={160} /></div>
          </div>
          <ChartSkeleton />
          <CardsSkeleton count={4} />
        </div>
      ) : (
        <>
          <ErrorBoundary fallbackTitle="Current reading failed to load">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <CurrentReading reading={data?.latest ?? null} />
              <div className="md:col-span-2">
                <TimeInRangeDonut stats={stats} />
              </div>
            </div>
          </ErrorBoundary>

          <ErrorBoundary fallbackTitle="Glucose chart failed to load">
            <GlucoseTimeSeries readings={data?.readings ?? []} range={range} />
          </ErrorBoundary>

          {range === '24h' && (
            <ErrorBoundary fallbackTitle="Glucose overlay failed to load">
              <GlucoseOverlay24h readings={data?.readings ?? []} />
            </ErrorBoundary>
          )}

          <ErrorBoundary fallbackTitle="Summary cards failed to load">
            <SummaryCards stats={stats} />
          </ErrorBoundary>
        </>
      )}
    </div>
  );
}
