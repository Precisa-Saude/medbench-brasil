/**
 * Validação de cobertura de um `raw.jsonl` antes do re-scoring offline.
 *
 * Motivação (issue #45): o `rescoreFromRaw` descartava linha corrompida com um
 * `console.warn`, ignorava silenciosamente registro de outra edição ou de
 * questão desconhecida, e o `scoreRun` usava `records.length` como
 * denominador. Um log truncado produzia precisão, IC95, Macro-F1 e
 * `passesCutoff` de aparência normal, calculados sobre o subconjunto que
 * sobrou — perda de dado virando benchmark médico aparentemente melhor.
 */

export interface RawCoverageExclusions {
  /** Pares `(questionId, run)` repetidos — superponderariam a questão. */
  duplicateRecords: number;
  /** Linhas que não parsearam como JSON. */
  malformedLines: number;
  /** `run` fora de `1..runsPerQuestion`; sintoma típico de `--runs` errado. */
  unexpectedRun: number;
  /**
   * Registro de questão fora do conjunto elegível.
   *
   * NÃO é sinal de corrupção por si: quando o gabarito definitivo anula itens,
   * o log legítimo da rodada anterior passa a conter questões que deixaram de
   * ser elegíveis. É exatamente o caminho previsto para a ENAMED 2026 em
   * 04/12/2026. Por isso conta, reporta, e não reprova.
   */
  unknownQuestion: number;
  /** Registro de outra edição no mesmo arquivo. */
  wrongEdition: number;
}

export interface RawCoverage {
  /** `observedRecords / expectedRecords`. 1 = cobertura completa. */
  coverage: number;
  /** Chaves `questionId#runN` vistas mais de uma vez (até 20, para mensagem). */
  duplicated: string[];
  exclusions: RawCoverageExclusions;
  /** Questões elegíveis × `runsPerQuestion`. */
  expectedRecords: number;
  /** Chaves `questionId#runN` esperadas e ausentes (até 20, para mensagem). */
  missing: string[];
  /** Pares `(questionId, run)` distintos e válidos encontrados. */
  observedRecords: number;
}

/** Quantas chaves listar nas amostras — mensagem de erro precisa ser legível. */
const SAMPLE_LIMIT = 20;

export function rawCoverageKey(questionId: string, run: number): string {
  return `${questionId}#run${run}`;
}

/**
 * Compara o conteúdo de um raw log com a matriz esperada
 * questões-elegíveis × runs.
 */
export function analyzeRawCoverage(input: {
  editionId: string;
  eligibleQuestionIds: Iterable<string>;
  malformedLines: number;
  records: { editionId: string; questionId: string; run: number }[];
  runsPerQuestion: number;
}): RawCoverage {
  const eligible = new Set(input.eligibleQuestionIds);
  const exclusions: RawCoverageExclusions = {
    duplicateRecords: 0,
    malformedLines: input.malformedLines,
    unexpectedRun: 0,
    unknownQuestion: 0,
    wrongEdition: 0,
  };

  const seen = new Set<string>();
  const duplicated: string[] = [];
  for (const rec of input.records) {
    if (rec.editionId !== input.editionId) {
      exclusions.wrongEdition += 1;
      continue;
    }
    if (!eligible.has(rec.questionId)) {
      exclusions.unknownQuestion += 1;
      continue;
    }
    if (!Number.isInteger(rec.run) || rec.run < 1 || rec.run > input.runsPerQuestion) {
      exclusions.unexpectedRun += 1;
      continue;
    }
    const key = rawCoverageKey(rec.questionId, rec.run);
    if (seen.has(key)) {
      exclusions.duplicateRecords += 1;
      if (duplicated.length < SAMPLE_LIMIT) duplicated.push(key);
      continue;
    }
    seen.add(key);
  }

  // Amostra para mensagem; a contagem exata é `expected - observed`.
  const missing: string[] = [];
  for (const questionId of eligible) {
    for (let run = 1; run <= input.runsPerQuestion; run++) {
      const key = rawCoverageKey(questionId, run);
      if (seen.has(key) || missing.length >= SAMPLE_LIMIT) continue;
      missing.push(key);
    }
  }

  const expectedRecords = eligible.size * input.runsPerQuestion;
  const observedRecords = seen.size;
  return {
    coverage: expectedRecords === 0 ? 0 : observedRecords / expectedRecords,
    duplicated,
    exclusions,
    expectedRecords,
    missing,
    observedRecords,
  };
}

/**
 * Cobertura aceitável para score estrito.
 *
 * Reprova só o que falsifica o denominador: registro ausente (perda de dado),
 * duplicado (superponderação) e `run` fora da faixa (quase sempre `--runs`
 * divergente do log). Linha corrompida, registro de outra edição e questão
 * não-elegível são contados e reportados, mas não reprovam — ver
 * `RawCoverageExclusions.unknownQuestion`.
 */
export function isRawCoverageComplete(cov: RawCoverage): boolean {
  return (
    cov.observedRecords === cov.expectedRecords &&
    cov.exclusions.duplicateRecords === 0 &&
    cov.exclusions.unexpectedRun === 0
  );
}

/** Mensagem acionável para falha de cobertura. */
export function describeRawCoverage(cov: RawCoverage, rawLogPath: string): string {
  const e = cov.exclusions;
  const faltando = cov.expectedRecords - cov.observedRecords;
  // Cabeçalho neutro: duplicata reprova com cobertura em 100%, então dizer
  // "incompleta" nesse caso seria enganoso.
  const linhas = [
    `validação de cobertura falhou em ${rawLogPath}`,
    `  esperados ${cov.expectedRecords} registros (questões elegíveis × runs), observados ${cov.observedRecords} — cobertura ${(cov.coverage * 100).toFixed(1)}%`,
  ];
  if (faltando > 0) {
    linhas.push(
      `  ausentes: ${faltando}${cov.missing.length ? ` — ex.: ${cov.missing.join(', ')}` : ''}`,
    );
  }
  if (e.duplicateRecords > 0) {
    linhas.push(
      `  duplicados: ${e.duplicateRecords}${cov.duplicated.length ? ` — ex.: ${cov.duplicated.join(', ')}` : ''}`,
    );
  }
  if (e.unexpectedRun > 0) {
    linhas.push(`  run fora de 1..N: ${e.unexpectedRun} (confira --runs)`);
  }
  if (e.malformedLines > 0) linhas.push(`  linhas corrompidas: ${e.malformedLines}`);
  if (e.wrongEdition > 0) linhas.push(`  registros de outra edição: ${e.wrongEdition}`);
  if (e.unknownQuestion > 0) {
    linhas.push(
      `  registros de questão não-elegível: ${e.unknownQuestion} (esperado quando o gabarito definitivo anula itens)`,
    );
  }
  linhas.push(
    '  use --allow-partial para pontuar o subconjunto, registrando a cobertura no artefato.',
  );
  return linhas.join('\n');
}
