import { EDITIONS } from '../data/editions';

export interface EditionOption {
  id: string;
  label: string;
}

/**
 * Opções de edição para os seletores do site, com o rótulo legível
 * ("Revalida 2025/1", não `revalida-2025-1`) e na mesma ordem em todo lugar:
 * ano mais recente no topo e, dentro do mesmo ano, ordem alfabética do rótulo.
 * Edição sem metadados cai no id cru e vai para o fim.
 */
export function editionOptions(ids: readonly string[]): EditionOption[] {
  return ids
    .map((id) => ({
      id,
      label: EDITIONS[id]?.label ?? id,
      year: EDITIONS[id]?.publishedAt.slice(0, 4) ?? '',
    }))
    .sort((a, b) => b.year.localeCompare(a.year) || a.label.localeCompare(b.label, 'pt-BR'))
    .map(({ id, label }) => ({ id, label }));
}
