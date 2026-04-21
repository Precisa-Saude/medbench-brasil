import { cn } from '@precisa-saude/ui/utils';

export interface SlidingToggleItem<T extends string> {
  label: string;
  value: T;
}

/**
 * Pill com indicador deslizante animado, standalone (sem dependência de
 * Radix Tabs) — uso direto com value/onChange.
 */
export function SlidingToggle<T extends string>({
  className,
  items,
  onChange,
  value,
}: {
  className?: string;
  items: readonly SlidingToggleItem<T>[];
  onChange: (v: T) => void;
  value: T;
}) {
  const count = items.length;
  const activeIndex = items.findIndex((item) => item.value === value);

  return (
    <div
      className={cn('relative inline-grid rounded-full bg-muted p-1 font-sans', className)}
      style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}
    >
      {activeIndex >= 0 && (
        <div
          aria-hidden
          className="absolute top-1 bottom-1 rounded-full bg-primary transition-all duration-300 ease-out"
          style={{
            left: `calc(4px + ${activeIndex} * ((100% - 8px) / ${count}))`,
            width: `calc((100% - 8px) / ${count})`,
          }}
        />
      )}
      {items.map((item) => {
        const isActive = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              'relative z-10 flex cursor-pointer items-center justify-center rounded-full px-5 py-1.5 text-center text-sm font-medium transition-colors duration-200 focus-visible:outline-none',
              isActive ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
