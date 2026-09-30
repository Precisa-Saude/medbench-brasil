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
      // No celular ocupa a largura toda, com as opções divididas por igual;
      // a partir de `sm` volta a ter a largura do conteúdo.
      className={cn(
        'relative grid w-full rounded-full bg-card p-1 font-sans ring-1 ring-border sm:inline-grid sm:w-auto',
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}
    >
      {activeIndex >= 0 && (
        <div
          aria-hidden
          className="absolute top-1 bottom-1 rounded-full bg-primary transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
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
            className={cn(
              'relative z-10 flex cursor-pointer items-center justify-center rounded-full px-5 py-1.5 text-center text-sm font-medium transition-colors duration-200',
              isActive ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
            type="button"
            onClick={() => onChange(item.value)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
