import { cn } from '@precisa-saude/ui/utils';
import type { ReactNode } from 'react';

export const gridStyle = {
  gridTemplateColumns: 'repeat(var(--grid-cols), minmax(0, 1fr))',
  maxWidth: 'var(--grid-max-w)',
  width: '100%',
} as const;

/** Colunas úteis do grid: 2–13 no desktop, 3–14 a partir de 1440 px. */
export const MAIN_COLUMNS = 'col-span-full md:col-span-12 md:col-start-2 3xl:col-start-3';

const TONE_CLASS = {
  /** Um passo abaixo do fundo, para alternar seções. */
  muted: 'bg-muted',
  neutro: 'bg-background',
} as const;

export interface GridSectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: keyof typeof TONE_CLASS;
}

/**
 * Seção de largura total com o grid 14/16 colunas da marca e a divisória de
 * 1px entre seções da /laudos. O fundo pinta até a borda da viewport; o
 * conteúdo fica nas colunas úteis.
 */
export function GridSection({ children, className, id, tone = 'neutro' }: GridSectionProps) {
  return (
    <section className={cn('relative border-b py-16 md:py-24', TONE_CLASS[tone])} id={id}>
      <div className="mx-auto grid gap-4 px-4 md:px-0" style={gridStyle}>
        <div className={cn(MAIN_COLUMNS, className)}>{children}</div>
      </div>
    </section>
  );
}
