interface Props {
  height?: string | number;
  width?: string | number;
  className?: string;
}

export default function Skeleton({ height = 20, width = '100%', className = '' }: Props) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ height, width }}
    />
  );
}
