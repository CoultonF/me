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
const RANGE_LOW = 3.9;
const RANGE_HIGH = 10.0;

export default function BgSparkline({ readings, width, height }: Props) {
  if (readings.length < 5) return null;

  const yScale = (v: number) => {
    const clamped = Math.max(Y_MIN, Math.min(Y_MAX, v));
    return height - ((clamped - Y_MIN) / (Y_MAX - Y_MIN)) * height;
  };

  const rangeTop = yScale(RANGE_HIGH);
  const rangeBottom = yScale(RANGE_LOW);

  // Map readings to minutes-in-day for X axis
  const points = readings.map((r) => {
    const d = new Date(r.timestamp);
    const minuteOfDay = d.getHours() * 60 + d.getMinutes();
    const x = (minuteOfDay / 1440) * width;
    const y = yScale(r.value);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="block"
    >
      <rect
        x={0}
        y={rangeTop}
        width={width}
        height={rangeBottom - rangeTop}
        fill="var(--color-glucose-normal)"
        opacity={0.1}
      />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="var(--color-glucose-normal)"
        strokeWidth={1.2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
