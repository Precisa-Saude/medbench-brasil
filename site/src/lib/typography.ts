/**
 * Escala editorial compartilhada com a /laudos da Precisa. Pausa 300 só nos
 * títulos de página e de seção; Margem no resto. Ver
 * `platform/docs/design/linguagem-visual.md`, seção 4.
 *
 * Hierarquia das páginas internas, um papel por nível:
 *   pageTitle  Pausa 300, 40–56 px    — um por página
 *   h2         Pausa 300, 28–34 px    — seções do documento
 *   h3         Margem 600, 18 px      — subseções e títulos de cartão/gráfico
 *   lead       Margem 400, 18–20 px   — abertura sob o título da página
 *   corpo      Margem 400, 16 px      — padrão do body, sem classe
 *   meta       Margem 400, 14 px      — notas, legendas, rótulos de dado
 *   label      Margem 600, 12 px, caixa alta — sobretítulos de bloco
 *   stat       Margem 500, 30 px, algarismos tabulares — dado em destaque
 *
 * `sectionTitle` (40–44 px) fica reservado às seções de largura total da home,
 * onde cada seção tem um único título, como na /laudos.
 */
export const TYPE = {
  cardBody: 'leading-relaxed',
  cardTitle: 'font-sans text-xl font-semibold',
  h1: 'font-serif text-[clamp(2.5rem,4.4vw,4rem)] leading-[1.08] font-light tracking-[-0.025em] text-balance',
  h2: 'font-serif text-[clamp(1.75rem,2.4vw,2.125rem)] leading-[1.2] font-light tracking-[-0.015em] text-balance',
  h3: 'font-sans text-lg leading-snug font-semibold',
  /** Sobretítulo curto acima de um título. */
  kicker: 'font-sans text-sm font-semibold tracking-[0.1em] uppercase',
  /** Rótulo em caixa alta que abre um bloco (índice, fontes, classe). */
  label: 'font-sans text-xs font-semibold tracking-[0.1em] text-foreground/70 uppercase',
  lead: 'font-sans text-lg leading-relaxed text-foreground/75 md:text-xl',
  meta: 'font-sans text-sm leading-relaxed text-foreground/70',
  /** Título de página interna: abertura, um passo abaixo do hero. */
  pageTitle:
    'font-serif text-[clamp(2.5rem,4vw,3.5rem)] leading-[1.08] font-light tracking-[-0.025em] text-balance text-primary',
  /** Título de seção de largura total na home. */
  sectionTitle:
    'font-serif text-[clamp(1.875rem,3.2vw,2.75rem)] leading-[1.15] font-light tracking-[-0.018em] text-balance',
  small: 'text-sm',
  stat: 'font-sans text-3xl font-medium tracking-tight tabular-nums',
  statLabel: 'font-sans text-sm text-foreground/70',
  statValue: 'font-sans text-4xl font-medium tracking-tight tabular-nums md:text-5xl',
} as const;
