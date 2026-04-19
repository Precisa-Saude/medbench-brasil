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

  it('reconhece formato ENAMED (tabela interleaved com Anulada/Excluída)', () => {
    // Extrato real do gabarito definitivo ENAMED 2025, Caderno 01.
    const enamedGabarito = `CADERNO 01
Questão Gabarito Questão Gabarito Questão Gabarito
1 A 11 Anulada 21 A
2 Excluída* 12 D 22 A
3 A 13 C 23 B
4 D 14 B 24 D
5 C 15 A 25 A
6 B 16 B 26 C
7 Anulada 17 D 27 D
8 B 18 D 28 B
9 Anulada 19 D 29 A
10 Anulada Administrati-vamente** 20 C 30 C`;
    const map = parseGabarito(enamedGabarito);
    expect(map.get(1)).toBe('A');
    expect(map.get(2)).toBe('ANNULLED'); // Excluída
    expect(map.get(7)).toBe('ANNULLED'); // Anulada
    expect(map.get(10)).toBe('ANNULLED'); // Anulada Administrativamente
    expect(map.get(11)).toBe('ANNULLED');
    expect(map.get(20)).toBe('C');
    expect(map.get(30)).toBe('C');
    expect(map.size).toBe(30);
  });

  it('reconhece células ENAMED que quebram em múltiplas linhas', () => {
    // Caso real observado em ENAMED 2025 Q10: o rótulo 'Anulada
    // Administrati-vamente**' é longo e o extractor do PDF quebra em 3
    // linhas. Round 2 original (line-by-line) dropou Q10 por não casar
    // através de newlines. Este teste previne a regressão.
    const wrapped = `CADERNO 01
Questão Gabarito Questão Gabarito Questão Gabarito
9 Anulada 19 D 29 A
10
Anulada
Administrati-vamente**20 C 30 C`;
    const map = parseGabarito(wrapped);
    expect(map.get(10)).toBe('ANNULLED');
    expect(map.get(20)).toBe('C');
    expect(map.get(30)).toBe('C');
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
