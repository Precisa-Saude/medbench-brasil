/**
 * Jenks natural breaks (Fisher-Jenks 1D clustering).
 *
 * Dado um conjunto de valores numéricos e um número de classes `k`, encontra
 * os pontos de corte que particionam os valores ordenados em `k` grupos
 * contíguos minimizando a variância intra-classe (equivalentemente,
 * maximizando a variância entre classes). É o algoritmo padrão de cartografia
 * para choropleths — o problema "mostre-me os agrupamentos naturais desses
 * números" em uma dimensão.
 *
 * Por que Jenks e não k-means:
 * - k-means em 1D converge iterativamente a partir de centros iniciais,
 *   sensível a inicialização e a outliers (um ponto distante puxa o centro
 *   da sua classe).
 * - Jenks é exaustivo: programação dinâmica avalia todas as partições
 *   contíguas possíveis e devolve a de menor soma de desvios quadrados.
 *   Determinístico — mesma entrada sempre produz os mesmos cortes.
 *
 * Complexidade: O(n² · k) em tempo e O(n · k) em memória. Suficiente para
 * ~100 modelos; com dataset maior usaríamos a variante O(n · k · log n) do
 * Wang–Song 2011.
 *
 * Implementação baseada no pseudocódigo clássico (Jenks, 1967; Fisher, 1958);
 * ver também a implementação de referência em `simple-statistics`.
 *
 * @param values conjunto não vazio de números (duplicatas permitidas).
 * @param k     número de classes desejado (≥ 1; se k ≥ n, cada valor vira
 *              sua própria classe).
 * @returns array com `k + 1` pontos de quebra em ordem crescente:
 *          `[min, break1, break2, …, max]`. Um valor `v` pertence à classe
 *          `i` se `breaks[i] ≤ v ≤ breaks[i+1]` (limite superior inclusivo
 *          para a última classe; inferior inclusivo para as demais).
 */
export function jenksBreaks(values: number[], k: number): number[] {
  if (values.length === 0) throw new Error('jenksBreaks: values vazio');
  if (k < 1) throw new Error('jenksBreaks: k deve ser ≥ 1');

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  if (k === 1) return [sorted[0], sorted[n - 1]];
  if (k >= n) return sorted.slice();

  // matriz de variância mínima: lowerClassLimits[i][j] = índice (1-based)
  // do primeiro elemento da j-ésima classe quando particionamos os primeiros
  // i elementos em j classes.
  const lowerClassLimits: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(k + 1).fill(0),
  );
  const varianceCombinations: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(k + 1).fill(0),
  );

  for (let i = 1; i <= k; i++) {
    lowerClassLimits[1][i] = 1;
    varianceCombinations[1][i] = 0;
    for (let j = 2; j <= n; j++) varianceCombinations[j][i] = Infinity;
  }

  for (let l = 2; l <= n; l++) {
    let sum = 0;
    let sumSquares = 0;
    let w = 0;
    for (let m = 1; m <= l; m++) {
      const lowerClassLimit = l - m + 1;
      const val = sorted[lowerClassLimit - 1];
      w += 1;
      sum += val;
      sumSquares += val * val;
      const variance = sumSquares - (sum * sum) / w;
      const i4 = lowerClassLimit - 1;
      if (i4 !== 0) {
        for (let j = 2; j <= k; j++) {
          const candidate = variance + varianceCombinations[i4][j - 1];
          if (varianceCombinations[l][j] >= candidate) {
            lowerClassLimits[l][j] = lowerClassLimit;
            varianceCombinations[l][j] = candidate;
          }
        }
      }
    }
    lowerClassLimits[l][1] = 1;
    varianceCombinations[l][1] = sumSquares - (sum * sum) / w;
  }

  // reconstrói os cortes caminhando de trás pra frente na matriz.
  const breaks = new Array<number>(k + 1);
  breaks[k] = sorted[n - 1];
  breaks[0] = sorted[0];
  let idx = n;
  for (let j = k; j >= 2; j--) {
    const breakIdx = lowerClassLimits[idx][j] - 1;
    breaks[j - 1] = sorted[breakIdx];
    idx = lowerClassLimits[idx][j] - 1;
  }
  return breaks;
}

/**
 * Atribui um valor a uma das `breaks.length - 1` classes, retornando o
 * índice da classe (0 = primeira classe = menores valores).
 *
 * A última classe inclui o limite superior; as demais usam intervalo
 * `[breaks[i], breaks[i+1])`.
 */
export function jenksClass(value: number, breaks: number[]): number {
  const k = breaks.length - 1;
  for (let i = 0; i < k - 1; i++) {
    if (value < breaks[i + 1]) return i;
  }
  return k - 1;
}
