/**
 * Escala editorial compartilhada com a /laudos da Precisa. Pausa 300 nos
 * títulos, Margem no resto; ver `platform/docs/design/linguagem-visual.md`,
 * seção 4.
 */
export const TYPE = {
  cardBody: 'leading-relaxed',
  cardTitle: 'font-sans text-xl font-semibold',
  h1: 'font-serif text-[clamp(2.5rem,4.4vw,4rem)] leading-[1.08] font-light tracking-[-0.025em] text-balance',
  h2: 'font-serif text-[clamp(1.875rem,3.2vw,2.75rem)] leading-[1.15] font-light tracking-[-0.018em] text-balance',
  h3: 'font-sans text-lg font-semibold',
  /** Sobretítulo curto acima de um título. */
  kicker: 'font-sans text-sm font-semibold tracking-[0.1em] uppercase',
  lead: 'font-sans text-lg leading-relaxed text-foreground/75 md:text-xl',
  /** Título de página interna: abertura, um passo abaixo do hero. */
  pageTitle:
    'font-serif text-[clamp(2.5rem,4vw,3.5rem)] leading-[1.08] font-light tracking-[-0.025em] text-balance text-primary',
  small: 'text-sm',
  statLabel: 'font-sans text-sm text-foreground/70',
  statValue: 'font-sans text-4xl font-medium tracking-tight tabular-nums md:text-5xl',
} as const;
