interface Props {
  activeCalories: number;
  exerciseMinutes: number;
  moveGoal?: number;
  exerciseGoal?: number;
}

export default function ActivityRings({
  activeCalories,
  exerciseMinutes,
  moveGoal = 500,
  exerciseGoal = 30,
}: Props) {
  const moveProgress = Math.min(activeCalories / moveGoal, 1);
  const exerciseProgress = Math.min(exerciseMinutes / exerciseGoal, 1);

  const size = 200;
  const center = size / 2;
  const strokeWidth = 18;
  const gap = 6;

  const outerRadius = (size - strokeWidth) / 2;
  const innerRadius = outerRadius - strokeWidth - gap;

  function ringPath(radius: number): string {
    return `M ${center} ${center - radius} A ${radius} ${radius} 0 1 1 ${center - 0.001} ${center - radius}`;
  }

  function circumference(radius: number): number {
    return 2 * Math.PI * radius;
  }

  const outerCirc = circumference(outerRadius);
  const innerCirc = circumference(innerRadius);

  return (
    <div className="bg-tile border border-stroke rounded-lg p-6">
      <div className="text-xs font-medium text-dim uppercase tracking-wide mb-3">Activity Rings</div>
      <div className="flex items-center justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Move ring (outer) — background */}
          <circle
            cx={center}
            cy={center}
            r={outerRadius}
            fill="none"
            stroke="var(--color-activity-move)"
            strokeWidth={strokeWidth}
            opacity={0.2}
          />
          {/* Move ring (outer) — foreground */}
          <path
            d={ringPath(outerRadius)}
            fill="none"
            stroke="var(--color-activity-move)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={outerCirc}
            strokeDashoffset={outerCirc * (1 - moveProgress)}
            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
          />

          {/* Exercise ring (inner) — background */}
          <circle
            cx={center}
            cy={center}
            r={innerRadius}
            fill="none"
            stroke="var(--color-activity-exercise)"
            strokeWidth={strokeWidth}
            opacity={0.2}
          />
          {/* Exercise ring (inner) — foreground */}
          <path
            d={ringPath(innerRadius)}
            fill="none"
            stroke="var(--color-activity-exercise)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={innerCirc}
            strokeDashoffset={innerCirc * (1 - exerciseProgress)}
            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
          />
        </svg>
      </div>
      <div className="flex justify-center gap-6 mt-3">
        <div className="flex items-center gap-1.5 text-xs text-subtle">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: 'var(--color-activity-move)' }} />
          Move {activeCalories}/{moveGoal} kcal
        </div>
        <div className="flex items-center gap-1.5 text-xs text-subtle">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: 'var(--color-activity-exercise)' }} />
          Exercise {exerciseMinutes}/{exerciseGoal} min
        </div>
      </div>
    </div>
  );
}
