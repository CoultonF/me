interface Reading {
  timestamp: string;
  value: number;
}

interface Props {
  readings: Reading[];
  width: number;
  height: number;
}

const Y_MIN = 2.0;
const Y_MAX = 22.0;
const RANGE_LOW = 4.0;
const RANGE_HIGH = 10.0;

function getSegmentColor(v1: number, v2: number): string {
  const avg = (v1 + v2) / 2;
  if (avg < RANGE_LOW) return 'var(--color-glucose-low)';
  if (avg > RANGE_HIGH) return 'var(--color-glucose-very-high)';
  return 'var(--color-glucose-normal)';
}

interface Point {
  x: number;
  y: number;
  value: number;
}

export default function BgSparkline({ readings, width, height }: Props) {
  if (readings.length < 5) return null;

  const yScale = (v: number) => {
    const clamped = Math.max(Y_MIN, Math.min(Y_MAX, v));
    return height - ((clamped - Y_MIN) / (Y_MAX - Y_MIN)) * height;
  };

  const last = readings.length - 1;
  const points: Point[] = readings.map((r, i) => ({
    x: last > 0 ? (i / last) * width : width / 2,
    y: yScale(r.value),
    value: r.value,
  }));

  // Build colored line segments
  const segments: { x1: number; y1: number; x2: number; y2: number; color: string }[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    segments.push({
      x1: a.x,
      y1: a.y,
      x2: b.x,
      y2: b.y,
      color: getSegmentColor(a.value, b.value),
    });
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="block"
    >
      {segments.map((s, i) => (
        <line
          key={i}
          x1={s.x1}
          y1={s.y1}
          x2={s.x2}
          y2={s.y2}
          stroke={s.color}
          strokeWidth={1.2}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
