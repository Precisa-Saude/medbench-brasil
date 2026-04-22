/**
 * Testes cobrindo gaps específicos de cobertura: o barrel index, o mapping
 * SPECIALTIES, a validação runtime de examFamilyOf e o caminho loadAll.
 */

import { describe, expect, it } from 'vitest';

import { getModelContaminationRisk } from '../src/contamination.js';
import * as barrel from '../src/index.js';
import { loadAll } from '../src/loader.js';
import { SPECIALTIES } from '../src/specialty.js';
import { examFamilyOf } from '../src/types.js';

describe('barrel exports', () => {
  it('expõe a superfície pública completa', () => {
    expect(typeof barrel.loadEdition).toBe('function');
    expect(typeof barrel.loadAll).toBe('function');
    expect(typeof barrel.listEditions).toBe('function');
    expect(typeof barrel.getModelContaminationRisk).toBe('function');
    expect(typeof barrel.examFamilyOf).toBe('function');
    expect(typeof barrel.SPECIALTIES).toBe('object');
  });
});

describe('SPECIALTIES', () => {
  it('declara as seis especialidades da matriz comum Revalida/ENAMED', () => {
    const keys = Object.keys(SPECIALTIES).sort();
    expect(keys).toEqual([
      'cirurgia',
      'clinica-medica',
      'ginecologia-obstetricia',
      'medicina-familia-comunidade',
      'pediatria',
      'saude-publica',
    ]);
  });

  it('cada especialidade tem label e description', () => {
    for (const [key, meta] of Object.entries(SPECIALTIES)) {
      expect(meta.label.length, `${key}.label`).toBeGreaterThan(0);
      expect(meta.description.length, `${key}.description`).toBeGreaterThan(0);
    }
  });
});

describe('examFamilyOf', () => {
  it('reconhece Revalida com semestre', () => {
    expect(examFamilyOf('revalida-2025-1')).toBe('revalida');
  });

  it('reconhece Revalida sem semestre', () => {
    expect(examFamilyOf('revalida-2024')).toBe('revalida');
  });

  it('reconhece ENAMED', () => {
    expect(examFamilyOf('enamed-2025')).toBe('enamed');
  });

  it('lança em prefixo desconhecido', () => {
    // @ts-expect-error — TS protege, mas o runtime precisa validar quando
    // o id vem de fora do sistema de tipos (CLI/JSON)
    expect(() => examFamilyOf('revalid-2025-1')).toThrow(/família desconhecida/);
  });
});

describe('loadAll', () => {
  it('retorna todas as edições disponíveis', () => {
    const all = loadAll();
    expect(all.length).toBeGreaterThan(0);
    for (const edition of all) {
      expect(edition.id).toMatch(/^(revalida|enamed)-/);
      expect(Array.isArray(edition.questions)).toBe(true);
    }
  });
});

describe('contamination — datas inválidas', () => {
  it('retorna unknown quando publishedAt é inválido', () => {
    const risk = getModelContaminationRisk({ publishedAt: 'not-a-date' }, '2024-10-01');
    expect(risk).toBe('unknown');
  });

  it('retorna unknown quando o cutoff é inválido', () => {
    const risk = getModelContaminationRisk({ publishedAt: '2025-04-14' }, 'not-a-date');
    expect(risk).toBe('unknown');
  });
});
