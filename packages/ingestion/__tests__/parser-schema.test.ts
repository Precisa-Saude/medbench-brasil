import { describe, expect, it } from 'vitest';

import { parseEdition } from '../src/parser.js';
import { QUESTION_EXTRACTION_TOOL } from '../src/parser-schema.js';

describe('parseEdition (anthropic-api backend)', () => {
  it('exige ANTHROPIC_API_KEY quando backend=anthropic-api', async () => {
    const prev = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    await expect(
      parseEdition({
        apiKey: undefined,
        backend: 'anthropic-api',
        editionId: 'revalida-2025-1',
        gabaritoText: '',
        provaText: '',
      }),
    ).rejects.toThrow(/ANTHROPIC_API_KEY/);
    if (prev) process.env.ANTHROPIC_API_KEY = prev;
  });
});

describe('QUESTION_EXTRACTION_TOOL schema', () => {
  it('mantém o enum de especialidades alinhado com packages/dataset', () => {
    const enumValues =
      QUESTION_EXTRACTION_TOOL.input_schema.properties.questions.items.properties.specialty.items
        .enum;
    expect(enumValues).toEqual([
      'clinica-medica',
      'cirurgia',
      'ginecologia-obstetricia',
      'pediatria',
      'medicina-familia-comunidade',
      'saude-publica',
    ]);
  });

  it('torna obrigatórios todos os campos da Question', () => {
    expect(QUESTION_EXTRACTION_TOOL.input_schema.properties.questions.items.required).toEqual([
      'number',
      'stem',
      'options',
      'correct',
      'specialty',
      'hasImage',
      'hasTable',
      'annulled',
    ]);
  });
});
