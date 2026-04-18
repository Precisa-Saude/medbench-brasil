import { describe, expect, it } from 'vitest';

import { listEditions, loadEdition } from '../src/loader.js';

describe('loader', () => {
  it('lista pelo menos a edição template 2025-1', () => {
    const editions = listEditions();
    expect(editions).toContain('revalida-2025-1');
  });

  it('carrega a edição 2025-1 com metadados válidos', () => {
    const edition = loadEdition('revalida-2025-1');
    expect(edition.id).toBe('revalida-2025-1');
    expect(edition.year).toBe(2025);
    expect(edition.cutoffScore).toBeGreaterThan(0);
    expect(edition.passRate).toBeGreaterThan(0);
    expect(Array.isArray(edition.questions)).toBe(true);
  });
});
