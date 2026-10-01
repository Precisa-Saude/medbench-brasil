import { describe, expect, it } from 'vitest';

import { classifyContamination, getModelContaminationRisk } from '../src/contamination.js';

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

describe('fallback pela data de lançamento dos pesos', () => {
  it('edição posterior ao lançamento é limpa, com base release-date', () => {
    expect(classifyContamination({ publishedAt: '2026-09-13' }, undefined, '2026-04-24')).toEqual({
      basis: 'release-date',
      risk: 'likely-clean',
    });
  });

  it('edição anterior ao lançamento continua unknown, nunca contaminada', () => {
    expect(classifyContamination({ publishedAt: '2025-10-26' }, undefined, '2026-04-24')).toEqual({
      basis: null,
      risk: 'unknown',
    });
  });

  it('o corte declarado prevalece sobre o lançamento', () => {
    const r = classifyContamination({ publishedAt: '2025-04-14' }, '2025-06-01', '2024-11-18');
    expect(r).toEqual({ basis: 'cutoff', risk: 'likely-contaminated' });
  });

  it('data inválida não classifica', () => {
    expect(getModelContaminationRisk({ publishedAt: '2026-09-13' }, undefined, 'xx')).toBe(
      'unknown',
    );
    expect(getModelContaminationRisk({ publishedAt: 'xx' }, undefined, '2026-04-24')).toBe(
      'unknown',
    );
    expect(getModelContaminationRisk({ publishedAt: '2026-09-13' }, 'xx')).toBe('unknown');
  });
});
