interface Props {
  totalMl: number;
  goalMl: number;
}

export default function HydrationProgress({ totalMl, goalMl }: Props) {
  const pct = Math.min(totalMl / goalMl, 1);
  const goalMet = totalMl >= goalMl;

  // SVG circular progress
  const size = 120;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-stroke)"
          strokeWidth={stroke}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={goalMet ? 'var(--color-hydration-goal)' : 'var(--color-hydration)'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.3s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <div className="text-lg font-semibold text-heading">{totalMl}</div>
        <div className="text-[11px] text-dim">/ {goalMl} mL</div>
      </div>
    </div>
  );
}
