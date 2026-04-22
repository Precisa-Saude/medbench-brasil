/**
 * Helpers puros do ComparisonChart. Separados pra manter o componente
 * abaixo do limite de linhas e por serem testáveis sem mount.
 */

import type { ModelResult } from '../data/results';

/**
 * Contaminação por edição: a ModelResult agregada mistura editions, então
 * olhamos no perQuestion para achar a classificação naquela edição específica.
 */
export function contaminationForEdition(
  m: ModelResult,
  editionId: string,
): 'clean' | 'contaminated' | 'unknown' {
  const q = (m.perQuestion ?? []).find((pq) => pq.editionId === editionId);
  if (!q) return 'unknown';
  if (q.contamination === 'likely-clean') return 'clean';
  if (q.contamination === 'likely-contaminated') return 'contaminated';
  return 'unknown';
}

/**
 * Família do modelo derivada do prefixo alfabético do label:
 * "Claude Opus 4.7" → "Claude", "GPT-5.2" → "GPT", "DeepSeek R1" → "DeepSeek".
 */
export function modelFamily(label: string): string {
  const match = label.match(/^([A-Za-zÀ-ú]+)/);
  return match ? match[1] : label;
}

/**
 * Paleta de 4 tons do violeta mais escuro (classe superior) ao mais claro.
 * Os valores vêm dos tokens OKLch do tema.
 */
export const JENKS_COLORS = [
  'var(--primary)',
  'var(--ps-violet)',
  'oklch(0.72 0.08 290)',
  'oklch(0.85 0.05 290)',
];
export const JENKS_K = 4;

// Margens fixas passadas ao BarChart — precisamos delas para alinhar os
// pills flutuantes à área de plotagem real.
export const Y_AXIS_WIDTH = 140;
export const LEFT_MARGIN = 8;
export const RIGHT_MARGIN = 24;

// Stagger vertical quando pills ficam próximos demais no eixo X.
// 8pp cobre ~80px na área plotada típica, a largura de um pill.
export const COLLISION_PP = 8;

export interface LabelEntry {
  label: string;
  leftPercent: number;
  priority: number;
  row: number;
  tooltip: string;
}

/**
 * Computa posicionamento (linha + coluna) dos pills de referência para
 * evitar sobreposição horizontal. Extras têm priority 0 (preferidas no
 * topo); Corte/Candidatos priority 1.
 */
export function layoutLabelEntries(rawLabels: Array<Omit<LabelEntry, 'row'>>): {
  entries: LabelEntry[];
  rows: number;
} {
  const sorted = [...rawLabels].sort(
    (a, b) => a.priority - b.priority || a.leftPercent - b.leftPercent,
  );
  const rowsTaken: number[][] = [];
  const entries = sorted.map((entry) => {
    let row = 0;
    while ((rowsTaken[row] ?? []).some((x) => Math.abs(x - entry.leftPercent) < COLLISION_PP)) {
      row += 1;
    }
    rowsTaken[row] = [...(rowsTaken[row] ?? []), entry.leftPercent];
    return { ...entry, row };
  });
  return { entries, rows: Math.max(1, rowsTaken.length) };
}
