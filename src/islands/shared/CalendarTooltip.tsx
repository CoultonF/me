import { useState, useRef, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  content: ReactNode | null;
  children: ReactNode;
}

export function CalendarTooltip({ content, children }: Props) {
  const [pos, setPos] = useState<{ x: number; y: number; above: boolean } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const show = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const above = rect.top > 120;
    const y = above ? rect.top - 8 : rect.bottom + 8;
    setPos({ x: centerX, y, above });
  }, []);

  const hide = useCallback(() => setPos(null), []);

  return (
    <div ref={ref} onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {pos && content &&
        createPortal(
          <div
            className="fixed z-50 pointer-events-none"
            style={{
              left: pos.x,
              top: pos.above ? pos.y : pos.y,
              transform: pos.above ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
            }}
          >
            <div className="bg-tile border border-stroke rounded-lg px-3 py-2 shadow-lg whitespace-nowrap text-xs">
              {content}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
