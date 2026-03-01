import type { HydrationEntry } from '../../lib/types/hydration';

interface Props {
  entries: HydrationEntry[];
  onDelete: (id: number) => void;
  interactive: boolean;
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function HydrationEntryList({ entries, onDelete, interactive }: Props) {
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
          className="flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm hover:bg-panel transition-colors group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs text-dim shrink-0">{formatTime(entry.timestamp)}</span>
            <span className="text-heading font-medium">{entry.amountMl} mL</span>
            {entry.note && <span className="text-xs text-subtle truncate">{entry.note}</span>}
          </div>
          {interactive && (
            <button
              onClick={() => onDelete(entry.id)}
              className="text-ghost hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2"
              aria-label="Delete entry"
            >
              <svg className="size-3.5" viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
