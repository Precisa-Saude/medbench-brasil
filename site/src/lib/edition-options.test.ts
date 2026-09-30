import { describe, expect, it } from 'vitest';

import { editionOptions } from './edition-options';

describe('editionOptions', () => {
  it('ordena por ano decrescente e, no mesmo ano, pelo rótulo', () => {
    const ids = [
      'revalida-2024-1',
      'enamed-2025',
      'revalida-2025-1',
      'enamed-2026',
      'revalida-2024-2',
    ];
    expect(editionOptions(ids)).toEqual([
      { id: 'enamed-2026', label: 'ENAMED 2026' },
      { id: 'enamed-2025', label: 'ENAMED 2025' },
      { id: 'revalida-2025-1', label: 'Revalida 2025/1' },
      { id: 'revalida-2024-1', label: 'Revalida 2024/1' },
      { id: 'revalida-2024-2', label: 'Revalida 2024/2' },
    ]);
  });

  it('edição sem metadados usa o id e vai para o fim', () => {
    expect(editionOptions(['desconhecida', 'enamed-2025']).map((o) => o.id)).toEqual([
      'enamed-2025',
      'desconhecida',
    ]);
  });
});
