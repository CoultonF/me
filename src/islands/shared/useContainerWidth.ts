import { useEffect, useRef, useState } from 'react';

export function useContainerWidth(): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, width];
}

export function computeCellSize(
  availableWidth: number,
  cols: number,
  dayLabelWidth: number,
  gap: number,
  minCell: number,
): number {
  const gridSpace = availableWidth - dayLabelWidth;
  const size = Math.floor((gridSpace - (cols - 1) * gap) / cols);
  return Math.max(size, minCell);
}
