import { useCallback, useEffect, useState } from 'react';

import { useWideGrid } from '@/hooks/useWideGrid';

type GridMode = 'off' | 'columns' | 'guides';

const STORAGE_KEY = 'medbench-grid-overlay';

export function GridOverlay() {
  const isDev =
    typeof import.meta !== 'undefined' &&
    (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV;

  const [mode, setMode] = useState<GridMode>(() => {
    if (!isDev) return 'off';
    try {
      return (localStorage.getItem(STORAGE_KEY) as GridMode) || 'off';
    } catch {
      return 'off';
    }
  });

  const cycle = useCallback(() => {
    setMode((prev) => {
      const next: GridMode = prev === 'off' ? 'columns' : prev === 'columns' ? 'guides' : 'off';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // noop
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.target as HTMLElement).isContentEditable) return;
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        cycle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cycle]);

  const wide = useWideGrid();
  const totalCols = wide ? 16 : 14;
  const gutterCols = wide ? 2 : 1;

  if (!isDev || mode === 'off') return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[9999]">
      <div className="flex h-full items-stretch justify-center">
        <div
          className="hidden h-full w-full gap-4 md:grid"
          style={{
            gridTemplateColumns: `repeat(${totalCols}, 1fr)`,
            margin: '0 auto',
            maxWidth: 'var(--grid-max-w)',
          }}
        >
          {Array.from({ length: totalCols }).map((_, i) => {
            const isGutter = i < gutterCols || i >= totalCols - gutterCols;
            return (
              <div
                key={i}
                className="h-full"
                style={{
                  backgroundColor: isGutter ? 'rgba(255, 0, 0, 0.04)' : 'rgba(255, 0, 0, 0.07)',
                  outline: `1px ${isGutter ? 'dashed' : 'solid'} rgba(255, 0, 0, 0.25)`,
                }}
              />
            );
          })}
        </div>
        <div
          className="grid h-full w-full gap-4 px-4 md:hidden"
          style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-full"
              style={{
                backgroundColor: 'rgba(255, 0, 0, 0.07)',
                outline: '1px solid rgba(255, 0, 0, 0.25)',
              }}
            />
          ))}
        </div>
      </div>

      {mode === 'guides' && (
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                'repeating-linear-gradient(to bottom, transparent, transparent 63px, rgba(0, 200, 255, 0.3) 63px, rgba(0, 200, 255, 0.3) 64px)',
            }}
          />
        </div>
      )}

      <div className="fixed right-3 bottom-3 rounded-md bg-black/70 px-2 py-1 font-mono text-[10px] text-white">
        grid: {mode} <span className="text-white/50">(g)</span>
      </div>
    </div>
  );
}
