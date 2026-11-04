import { describe, expect, it } from 'vitest';

import { listEditions, loadEdition } from '../src/loader.js';
import { SPECIALTIES } from '../src/specialty.js';
import type { EditionId } from '../src/types.js';

// Transcrição conferida nos gabaritos definitivos, caderno 01, do portal INEP.
// O hífen representa anulação, não uma alternativa válida.
const keys = {
  'revalida-2025-2': [
    'A B A D C B - B - C',
    '- D C B A B D D D C',
    'A A B D A C D B A C',
    'B D C B D C D D D B',
    'C D - B B C C D B C',
    'B C C B - B C A C D',
    'C A C B B B B B D B',
    'A C D D C B A D D A',
    'D D A A - A - A B D',
    'D A A B C C A A A B',
  ]
    .join(' ')
    .split(' '),
  'revalida-2026-1': [
    'D C C D B D D C D D',
    'D D C B B B B D B B',
    'A B C C A A B A A C',
    'C C C C C B A B B C',
    'A A C A A D C A D D',
    'B D D A D C D B A B',
    'A A B A B B D D C D',
    'A D A C C A A C D C',
    'B B A A C A C B D B',
    'C D C A A B B D B D',
  ]
    .join(' ')
    .split(' '),
} satisfies Partial<Record<EditionId, string[]>>;

const flags = {
  'revalida-2025-2': {
    images: [5, 58, 91, 100],
    tables: [10, 15, 24, 38, 41, 46, 86],
    eligible: 82,
    date: '2025-10-19',
    cutoff: 0.61,
  },
  'revalida-2026-1': {
    images: [5, 11, 27, 68],
    tables: [4, 15, 17, 20, 21, 29, 40, 66, 72, 73, 91, 96],
    eligible: 84,
    date: '2026-06-07',
    cutoff: 0.59,
  },
};

describe.each(Object.keys(keys) as Array<keyof typeof keys>)('%s', (id) => {
  it('preserva 100 questões e as 100 posições do gabarito definitivo', () => {
    expect(listEditions()).toContain(id);
    const edition = loadEdition(id);
    expect(edition.answerKeyStatus).toBe('definitivo');
    expect(edition.questions.map((q) => q.number)).toEqual(
      Array.from({ length: 100 }, (_, i) => i + 1),
    );
    expect(new Set(edition.questions.map((q) => q.id)).size).toBe(100);
    expect(keys[id]).toHaveLength(100);
    for (const q of edition.questions) {
      const truth = keys[id][q.number - 1]!;
      expect(q.editionId).toBe(id);
      expect(q.id).toBe(`${id}-q${String(q.number).padStart(2, '0')}`);
      expect(q.annulled, q.id).toBe(truth === '-');
      if (truth !== '-') expect(q.correct, q.id).toBe(truth);
      else expect(q.notes).toContain('não é pontuada');
      expect(q.stem.trim().length, q.id).toBeGreaterThan(0);
      expect(q.stem).not.toMatch(/ITEM \d+ - V\./);
      expect(Object.keys(q.options).sort()).toEqual(['A', 'B', 'C', 'D']);
      for (const option of Object.values(q.options))
        expect(option.trim().length, q.id).toBeGreaterThan(0);
      expect(q.specialty.length).toBeGreaterThan(0);
      for (const tag of q.specialty) expect(tag in SPECIALTIES).toBe(true);
    }
  });

  it('mantém imagens/tabelas no JSON, excluindo somente na seleção do scorer', () => {
    const { questions } = loadEdition(id);
    expect(questions.filter((q) => q.hasImage).map((q) => q.number)).toEqual(flags[id].images);
    expect(questions.filter((q) => q.hasTable).map((q) => q.number)).toEqual(flags[id].tables);
    expect(questions.filter((q) => !q.annulled && !q.hasImage && !q.hasTable)).toHaveLength(
      flags[id].eligible,
    );
  });

  it('usa aplicação e corte oficiais sem inventar taxa de aprovação', () => {
    const edition = loadEdition(id);
    expect(edition.publishedAt).toBe(flags[id].date);
    expect(edition.cutoffScore).toBe(flags[id].cutoff);
    expect(edition.cutoffScoreSource).toMatch(/^https:\/\/(www\.in\.gov\.br|www\.gov\.br\/inep)\//);
    expect(edition.source).toMatch(/^https:\/\/www\.gov\.br\/inep\//);
    expect(edition.passRate).toBeUndefined();
    expect(edition.totalInscritos).toBeUndefined();
  });
});
