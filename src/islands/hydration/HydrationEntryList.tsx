import type { HydrationEntry } from '../../lib/types/hydration';

interface Props {
  entries: HydrationEntry[];
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function HydrationEntryList({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <div className="text-xs text-dim text-center py-3">No entries today</div>
    );
  }

  return (
    <div className="space-y-1">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm"
        >
          <span className="text-xs text-dim shrink-0">{formatTime(entry.timestamp)}</span>
          <span className="text-heading font-medium">{entry.amountMl} mL</span>
          {entry.note && <span className="text-xs text-subtle truncate">{entry.note}</span>}
        </div>
      ))}
    </div>
  );
}
