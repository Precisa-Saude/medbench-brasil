import { describe, expect, it } from 'vitest';

import { jenksBreaks, jenksClass } from './jenks';

describe('jenksBreaks', () => {
  it('retorna [min, max] quando k=1', () => {
    expect(jenksBreaks([3, 1, 4, 1, 5, 9, 2, 6], 1)).toEqual([1, 9]);
  });

  it('devolve os próprios valores ordenados quando k ≥ n', () => {
    expect(jenksBreaks([3, 1, 2], 3)).toEqual([1, 2, 3]);
    expect(jenksBreaks([3, 1, 2], 10)).toEqual([1, 2, 3]);
  });

  it('separa dois agrupamentos óbvios em duas classes', () => {
    // cluster baixo: 1,2,3   cluster alto: 20,21,22
    const breaks = jenksBreaks([1, 2, 3, 20, 21, 22], 2);
    expect(breaks[0]).toBe(1);
    expect(breaks[2]).toBe(22);
    // o corte deve cair no início do cluster alto (20), não no meio do vazio.
    expect(breaks[1]).toBe(20);
  });

  it('separa três agrupamentos em três classes', () => {
    // três clusters claros: {1,2}, {10,11}, {100,101}
    const breaks = jenksBreaks([1, 2, 10, 11, 100, 101], 3);
    expect(breaks).toEqual([1, 10, 100, 101]);
  });

  it('reproduz os cortes esperados para o exemplo k=5', () => {
    // regressão numérica: fixa a saída para uma sequência fixa; se a
    // implementação mudar, qualquer drift fica evidente.
    const data = [
      2.07, 2.11, 2.27, 2.51, 2.77, 3.03, 3.22, 3.41, 3.75, 4.23, 4.99, 5.17, 5.33, 5.84, 6.31, 6.5,
      6.7, 6.93, 7.18,
    ];
    const breaks = jenksBreaks(data, 5);
    expect(breaks).toEqual([2.07, 2.77, 3.75, 4.99, 6.31, 7.18]);
  });

  it('devolve classes não decrescentes', () => {
    const breaks = jenksBreaks(
      [0.365, 0.565, 0.706, 0.714, 0.8, 0.804, 0.855, 0.867, 0.871, 0.875, 0.918, 0.922, 0.961],
      4,
    );
    for (let i = 1; i < breaks.length; i++) {
      expect(breaks[i]).toBeGreaterThanOrEqual(breaks[i - 1]);
    }
    expect(breaks.length).toBe(5);
    expect(breaks[0]).toBe(0.365);
    expect(breaks[4]).toBe(0.961);
  });

  it('é determinístico e independente da ordem de entrada', () => {
    const a = [5, 1, 9, 2, 8, 3, 7, 4, 6];
    const b = [...a].reverse();
    expect(jenksBreaks(a, 3)).toEqual(jenksBreaks(b, 3));
  });

  it('tolera valores duplicados', () => {
    const breaks = jenksBreaks([1, 1, 1, 2, 2, 10, 10, 10], 2);
    expect(breaks[0]).toBe(1);
    expect(breaks[2]).toBe(10);
    // o corte natural é o início do 10.
    expect(breaks[1]).toBe(10);
  });

  it('lança para entrada vazia ou k inválido', () => {
    expect(() => jenksBreaks([], 2)).toThrow();
    expect(() => jenksBreaks([1, 2, 3], 0)).toThrow();
  });

  it('minimiza a soma de variâncias intra-classe (sanidade)', () => {
    // para uma partição qualquer da mesma cardinalidade, a variância total
    // de Jenks deve ser <= à de cortes ingênuos em quantis iguais.
    const values = [10, 12, 13, 14, 50, 52, 53, 90, 91, 92, 93];
    const k = 3;
    const breaks = jenksBreaks(values, k);
    const sorted = [...values].sort((a, b) => a - b);
    const jenksVar = variance(partition(sorted, breaks));
    const quantileBreaks = [
      sorted[0],
      sorted[Math.floor(sorted.length / 3)],
      sorted[Math.floor((2 * sorted.length) / 3)],
      sorted[sorted.length - 1],
    ];
    const quantileVar = variance(partition(sorted, quantileBreaks));
    expect(jenksVar).toBeLessThanOrEqual(quantileVar);
  });
});

describe('jenksClass', () => {
  const breaks = [0, 10, 20, 30];

  it('atribui à primeira classe valores no limite inferior', () => {
    expect(jenksClass(0, breaks)).toBe(0);
    expect(jenksClass(5, breaks)).toBe(0);
    expect(jenksClass(9.99, breaks)).toBe(0);
  });

  it('usa [limite inferior, limite superior) para classes intermediárias', () => {
    expect(jenksClass(10, breaks)).toBe(1);
    expect(jenksClass(15, breaks)).toBe(1);
    expect(jenksClass(19.99, breaks)).toBe(1);
  });

  it('inclui o limite superior na última classe', () => {
    expect(jenksClass(20, breaks)).toBe(2);
    expect(jenksClass(25, breaks)).toBe(2);
    expect(jenksClass(30, breaks)).toBe(2);
  });

  it('colapsa valores fora do intervalo para as classes extremas', () => {
    expect(jenksClass(-5, breaks)).toBe(0);
    expect(jenksClass(9999, breaks)).toBe(2);
  });
});

// helpers internos para o teste de sanidade da variância total.
function partition(sorted: number[], breaks: number[]): number[][] {
  const out: number[][] = Array.from({ length: breaks.length - 1 }, () => []);
  for (const v of sorted) out[jenksClass(v, breaks)].push(v);
  return out;
}

function variance(classes: number[][]): number {
  let total = 0;
  for (const cls of classes) {
    if (cls.length === 0) continue;
    const mean = cls.reduce((s, v) => s + v, 0) / cls.length;
    for (const v of cls) total += (v - mean) ** 2;
  }
  return total;
}
