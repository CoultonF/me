interface PB {
  distance: string;
  chipTime: string;
  raceName: string;
  date: string;
}

interface Props {
  personalBests: PB[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Derive pace from chip time and distance label */
function derivePace(chipTime: string, distance: string): string {
  const DISTANCE_KM: Record<string, number> = {
    '5K': 5, '10K': 10, 'Half Marathon': 21.0975, 'Marathon': 42.195,
  };
  const km = DISTANCE_KM[distance];
  if (!km) return '';
  const parts = chipTime.split(':').map(Number);
  let totalSec = 0;
  if (parts.length === 3) totalSec = parts[0]! * 3600 + parts[1]! * 60 + parts[2]!;
  else if (parts.length === 2) totalSec = parts[0]! * 60 + parts[1]!;
  if (totalSec <= 0) return '';
  const paceSec = totalSec / km;
  const min = Math.floor(paceSec / 60);
  const sec = Math.round(paceSec % 60);
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}/km`;
}

export default function PersonalBests({ personalBests }: Props) {
  return (
    <div className="space-y-3">
      <div className="text-xs font-medium text-dim uppercase tracking-wide">Personal Bests</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {personalBests.map((pb) => (
          <div key={pb.distance} className="bg-tile border border-stroke rounded-lg p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-semibold text-heading">{pb.distance}</div>
              <div className="text-lg font-bold text-accent">{pb.chipTime}</div>
            </div>
            <div className="text-xs text-dim">
              {pb.raceName} &middot; {formatDate(pb.date)}
              {derivePace(pb.chipTime, pb.distance) && ` · ${derivePace(pb.chipTime, pb.distance)}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
