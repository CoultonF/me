interface Event {
  type: string;
  repo: string;
  message: string | null;
  ref: string | null;
  timestamp: string;
}

interface Props {
  events: Event[];
}

function eventColor(type: string): string {
  switch (type) {
    case 'push': return 'text-green-500';
    case 'pr': return 'text-purple-500';
    case 'issue': return 'text-orange-500';
    case 'review': return 'text-blue-500';
    case 'create': return 'text-teal-500';
    case 'delete': return 'text-red-500';
    default: return 'text-dim';
  }
}

function relativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function EventIcon({ type }: { type: string }) {
  const color = eventColor(type);
  return (
    <div className={`size-6 rounded-full bg-stroke-soft flex items-center justify-center shrink-0 ${color}`}>
      {type === 'push' && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><line x1="1.05" y1="12" x2="7" y2="12"/><line x1="17.01" y1="12" x2="22.96" y2="12"/></svg>
      )}
      {type === 'pr' && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" y1="9" x2="6" y2="21"/></svg>
      )}
      {type === 'issue' && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>
      )}
      {type === 'review' && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      )}
      {type === 'create' && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      )}
      {type === 'delete' && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
      )}
      {!['push', 'pr', 'issue', 'review', 'create', 'delete'].includes(type) && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      )}
    </div>
  );
}

export default function RecentActivity({ events }: Props) {
  if (events.length === 0) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
        <div className="text-xs font-medium text-dim uppercase tracking-wide mb-4">Recent Activity</div>
        <div className="text-sm text-dim text-center py-8">No recent events</div>
      </div>
    );
  }

  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      <div className="text-xs font-medium text-dim uppercase tracking-wide mb-4">Recent Activity</div>

      <div className="max-h-[400px] overflow-y-auto space-y-0">
        {events.map((event, i) => (
          <div key={i} className="flex gap-3 py-2.5 border-b border-stroke-soft last:border-b-0">
            <EventIcon type={event.type} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-body capitalize">{event.type}</span>
                <span className="text-xs text-dim">{event.repo.split('/').pop()}</span>
                <span className="text-xs text-ghost ml-auto shrink-0">{relativeTime(event.timestamp)}</span>
              </div>
              {event.message && (
                <div className="text-xs text-subtle mt-0.5 truncate">{event.message}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
