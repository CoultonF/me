import type { GlucoseReading } from '../../lib/types/glucose';

interface Props {
  reading: GlucoseReading | null;
}

const TREND_ARROWS: Record<string, string> = {
  'constant': '→',
  'slowRise': '↗',
  'slowFall': '↘',
  'rise': '↑',
  'fall': '↓',
  'rapidRise': '⇈',
  'rapidFall': '⇊',
  // Dexcom trend names
  'flat': '→',
  'fortyFiveUp': '↗',
  'fortyFiveDown': '↘',
  'singleUp': '↑',
  'singleDown': '↓',
  'doubleUp': '⇈',
  'doubleDown': '⇊',
};

function getGlucoseColor(value: number): string {
  if (value < 3.9) return 'text-glucose-low';
  if (value <= 10.0) return 'text-glucose-normal';
  if (value <= 13.9) return 'text-glucose-high';
  return 'text-glucose-very-high';
}

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m ago`;
}

export default function CurrentReading({ reading }: Props) {
  if (!reading) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-6">
        <div className="text-xs font-medium text-dim uppercase tracking-wide mb-3">Current Glucose</div>
        <div className="text-4xl font-semibold text-heading leading-none mb-1">&mdash;</div>
        <div className="text-sm text-dim">No data available</div>
      </div>
    );
  }

  const arrow = reading.trend ? TREND_ARROWS[reading.trend] ?? '' : '';
  const colorClass = getGlucoseColor(reading.value);

  return (
    <div className="bg-tile border border-stroke rounded-lg p-6">
      <div className="text-xs font-medium text-dim uppercase tracking-wide mb-3">Current Glucose</div>
      <div className="flex items-baseline gap-2">
        <span className={`text-5xl font-bold leading-none ${colorClass}`}>
          {reading.value.toFixed(1)}
        </span>
        {arrow && <span className={`text-3xl ${colorClass}`}>{arrow}</span>}
      </div>
      <div className="text-sm text-dim mt-1">mmol/L</div>
      <div className="text-xs text-ghost mt-3 pt-3 border-t border-stroke">
        {timeAgo(reading.timestamp)}
      </div>
    </div>
  );
}
