import { describe, expect, it } from 'vitest';

import { getModelContaminationRisk } from '../src/contamination.js';

describe('getModelContaminationRisk', () => {
  it('retorna likely-clean quando a edição é posterior ao corte', () => {
    const risk = getModelContaminationRisk({ publishedAt: '2025-04-14' }, '2024-10-01');
    expect(risk).toBe('likely-clean');
  });

  it('retorna likely-contaminated quando a edição é anterior ao corte', () => {
    const risk = getModelContaminationRisk({ publishedAt: '2022-06-01' }, '2024-10-01');
    expect(risk).toBe('likely-contaminated');
  });

  it('retorna unknown quando o corte não é declarado', () => {
    const risk = getModelContaminationRisk({ publishedAt: '2025-04-14' }, undefined);
    expect(risk).toBe('unknown');
  });
});
