import type { StephHRZoneDistribution } from '../../lib/types/steph-activity';

interface Props {
  hrZones: StephHRZoneDistribution;
}

const ZONE_COLORS = [
  'var(--color-running-hr-zone1)',
  'var(--color-running-hr-zone2)',
  'var(--color-running-hr-zone3)',
  'var(--color-running-hr-zone4)',
  'var(--color-running-hr-zone5)',
];

const ZONE_LABELS = ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5'];
const ZONE_RANGES = ['<60%', '60-70%', '70-80%', '80-90%', '90%+'];

export default function StephHRZoneBar({ hrZones }: Props) {
  const zones = [
    { name: 'Zone 1', value: hrZones.zone1, range: ZONE_RANGES[0] },
    { name: 'Zone 2', value: hrZones.zone2, range: ZONE_RANGES[1] },
    { name: 'Zone 3', value: hrZones.zone3, range: ZONE_RANGES[2] },
    { name: 'Zone 4', value: hrZones.zone4, range: ZONE_RANGES[3] },
    { name: 'Zone 5', value: hrZones.zone5, range: ZONE_RANGES[4] },
  ];

  const total = zones.reduce((s, z) => s + z.value, 0);
  if (total === 0) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-6 text-center">
        <div className="text-dim">No heart rate zone data</div>
      </div>
    );
  }

  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      <div className="text-xs font-medium text-dim uppercase tracking-wide mb-4">HR Zone Distribution</div>

      <div className="flex rounded-md overflow-hidden h-8 mb-4">
        {zones.map((z, i) => z.value > 0 && (
          <div
            key={i}
            className="flex items-center justify-center text-[10px] font-medium text-white"
            style={{ width: `${z.value}%`, background: ZONE_COLORS[i], minWidth: z.value > 3 ? undefined : 0 }}
          >
            {z.value >= 8 && `${z.value}%`}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-2">
        {zones.map((z, i) => (
          <div key={i} className="text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <span className="size-2 rounded-full" style={{ background: ZONE_COLORS[i] }} />
              <span className="text-[10px] text-dim">{ZONE_LABELS[i]}</span>
            </div>
            <div className="text-xs font-medium text-body">{z.value}%</div>
            <div className="text-[10px] text-dim">{z.range}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
