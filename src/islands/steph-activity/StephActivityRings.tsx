interface Props {
  activeCalories: number;
  exerciseMinutes: number;
  moveGoal?: number;
  exerciseGoal?: number;
}

export default function StephActivityRings({
  activeCalories,
  exerciseMinutes,
  moveGoal = 400,
  exerciseGoal = 30,
}: Props) {
  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = 14;

  const outerR = (size - strokeWidth) / 2;
  const innerR = outerR - strokeWidth - 4;

  const outerCirc = 2 * Math.PI * outerR;
  const innerCirc = 2 * Math.PI * innerR;

  const movePct = Math.min(activeCalories / moveGoal, 1);
  const exercisePct = Math.min(exerciseMinutes / exerciseGoal, 1);

  const outerOffset = outerCirc * (1 - movePct);
  const innerOffset = innerCirc * (1 - exercisePct);

  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6 flex flex-col items-center">
      <svg width={size} height={size} className="block -rotate-90">
        {/* Outer ring background */}
        <circle
          cx={cx} cy={cy} r={outerR}
          fill="none"
          stroke="var(--color-steph-calories)"
          strokeWidth={strokeWidth}
          opacity={0.2}
        />
        {/* Outer ring foreground */}
        <circle
          cx={cx} cy={cy} r={outerR}
          fill="none"
          stroke="var(--color-steph-calories)"
          strokeWidth={strokeWidth}
          strokeDasharray={outerCirc}
          strokeDashoffset={outerOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
        {/* Inner ring background */}
        <circle
          cx={cx} cy={cy} r={innerR}
          fill="none"
          stroke="var(--color-steph-exercise)"
          strokeWidth={strokeWidth}
          opacity={0.2}
        />
        {/* Inner ring foreground */}
        <circle
          cx={cx} cy={cy} r={innerR}
          fill="none"
          stroke="var(--color-steph-exercise)"
          strokeWidth={strokeWidth}
          strokeDasharray={innerCirc}
          strokeDashoffset={innerOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>

      <div className="flex gap-6 mt-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: 'var(--color-steph-calories)' }} />
          <span className="text-subtle">Move {activeCalories}/{moveGoal} kcal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: 'var(--color-steph-exercise)' }} />
          <span className="text-subtle">Exercise {exerciseMinutes}/{exerciseGoal} min</span>
        </div>
      </div>
    </div>
  );
}
