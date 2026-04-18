import { describe, expect, it } from 'vitest';

import { parseGabarito } from '../src/gabarito.js';

describe('parseGabarito', () => {
  const cleanGabarito = `GABARITO DEFINITIVO

Questão 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20
Gabarito B A A B D C - B A C B A A D A B B D D B
Questão 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40
Gabarito C B - A B D D B A A C C C - C A B D D D`;

  it('extrai letras corretas e questões anuladas', () => {
    const map = parseGabarito(cleanGabarito);
    expect(map.get(1)).toBe('B');
    expect(map.get(6)).toBe('C');
    expect(map.get(7)).toBe('ANNULLED');
    expect(map.get(22)).toBe('B');
    expect(map.get(23)).toBe('ANNULLED');
    expect(map.get(34)).toBe('ANNULLED');
    expect(map.get(40)).toBe('D');
    expect(map.size).toBe(40);
  });

  it('identifica todas as anuladas', () => {
    const map = parseGabarito(cleanGabarito);
    const annulled = [...map.entries()].filter(([, v]) => v === 'ANNULLED').map(([k]) => k);
    expect(annulled).toEqual([7, 23, 34]);
  });

  it('ignora cópia duplicada com formatação grudada', () => {
    // Caso real visto em scripts/data/raw/revalida-2025-1/gabarito.txt: o
    // PDF tem duas cópias; a segunda concatena letras e hífens sem espaço
    // ("B-" em vez de "B -"). Nossa primeira (limpa) deve vencer.
    const withDup = `${cleanGabarito}

Questão 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20
Gabarito B A A B D C -B A C B A A D A B B D D B`;
    const map = parseGabarito(withDup);
    expect(map.get(7)).toBe('ANNULLED');
    expect(map.get(22)).toBe('B');
    expect(map.size).toBe(40);
  });
});
