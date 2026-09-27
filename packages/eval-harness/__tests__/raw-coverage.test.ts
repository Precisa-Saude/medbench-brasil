import { describe, expect, it } from 'vitest';

import {
  analyzeRawCoverage,
  describeRawCoverage,
  isRawCoverageComplete,
  rawCoverageKey,
} from '../src/raw-coverage.js';

const EDITION = 'enamed-2026';
const QUESTIONS = ['q1', 'q2', 'q3'];
const RUNS = 3;

/** Log completo: 3 questões × 3 runs = 9 registros. */
function completo() {
  const out: { editionId: string; questionId: string; run: number }[] = [];
  for (const questionId of QUESTIONS) {
    for (let run = 1; run <= RUNS; run++) out.push({ editionId: EDITION, questionId, run });
  }
  return out;
}

function analisar(
  records: { editionId: string; questionId: string; run: number }[],
  malformed = 0,
) {
  return analyzeRawCoverage({
    editionId: EDITION,
    eligibleQuestionIds: QUESTIONS,
    malformedLines: malformed,
    records,
    runsPerQuestion: RUNS,
  });
}

describe('analyzeRawCoverage — log completo', () => {
  it('reporta cobertura 1 e aprova', () => {
    const cov = analisar(completo());
    expect(cov.expectedRecords).toBe(9);
    expect(cov.observedRecords).toBe(9);
    expect(cov.coverage).toBe(1);
    expect(cov.missing).toEqual([]);
    expect(isRawCoverageComplete(cov)).toBe(true);
  });
});

// Caso 1 da #45: apagar uma linha válida deve reprovar, nomeando a chave.
describe('analyzeRawCoverage — registro ausente', () => {
  it('reprova e identifica a chave que falta', () => {
    const records = completo().filter((r) => !(r.questionId === 'q2' && r.run === 2));
    const cov = analisar(records);
    expect(cov.observedRecords).toBe(8);
    expect(cov.coverage).toBeCloseTo(8 / 9);
    expect(cov.missing).toContain(rawCoverageKey('q2', 2));
    expect(isRawCoverageComplete(cov)).toBe(false);
    expect(describeRawCoverage(cov, 'x.jsonl')).toContain('q2#run2');
  });
});

// Caso 2 da #45: duplicar um run deve reprovar em vez de superponderar.
describe('analyzeRawCoverage — duplicata', () => {
  it('reprova e não conta o registro repetido duas vezes', () => {
    const records = [...completo(), { editionId: EDITION, questionId: 'q1', run: 1 }];
    const cov = analisar(records);
    expect(cov.exclusions.duplicateRecords).toBe(1);
    expect(cov.duplicated).toContain(rawCoverageKey('q1', 1));
    // não infla o observado: 9 pares distintos, não 10
    expect(cov.observedRecords).toBe(9);
    expect(isRawCoverageComplete(cov)).toBe(false);
  });
});

// Caso 3 da #45: cada motivo de exclusão contado separadamente.
describe('analyzeRawCoverage — exclusões separadas por motivo', () => {
  it('conta corrompida, outra edição e questão não-elegível em campos distintos', () => {
    const records = [
      ...completo(),
      { editionId: 'revalida-2024-1', questionId: 'q1', run: 1 },
      { editionId: EDITION, questionId: 'q99', run: 1 },
      { editionId: EDITION, questionId: 'q1', run: 99 },
    ];
    const cov = analisar(records, 2);
    expect(cov.exclusions).toEqual({
      duplicateRecords: 0,
      malformedLines: 2,
      unexpectedRun: 1,
      unknownQuestion: 1,
      wrongEdition: 1,
    });
    // run fora da faixa reprova; os outros dois motivos, sozinhos, não
    expect(isRawCoverageComplete(cov)).toBe(false);
  });

  it('questão não-elegível e linha corrompida NÃO reprovam quando a matriz fecha', () => {
    // Caminho real de 04/12/2026: o gabarito definitivo anula itens, então o
    // log legítimo passa a conter questões que saíram do conjunto elegível.
    const records = [...completo(), { editionId: EDITION, questionId: 'anulada-q7', run: 1 }];
    const cov = analisar(records, 1);
    expect(cov.exclusions.unknownQuestion).toBe(1);
    expect(cov.exclusions.malformedLines).toBe(1);
    expect(cov.observedRecords).toBe(cov.expectedRecords);
    expect(isRawCoverageComplete(cov)).toBe(true);
  });
});

describe('describeRawCoverage', () => {
  it('cita esperado, observado, cobertura e a saída --allow-partial', () => {
    const cov = analisar(completo().slice(0, 4));
    const msg = describeRawCoverage(cov, 'results/x/y.raw.jsonl');
    expect(msg).toContain('validação de cobertura falhou');
    expect(msg).toContain('results/x/y.raw.jsonl');
    expect(msg).toContain('esperados 9');
    expect(msg).toContain('observados 4');
    expect(msg).toContain('44.4%');
    expect(msg).toContain('--allow-partial');
  });

  it('reporta cada motivo de exclusão em linha própria', () => {
    // Requisito da #45: os motivos não podem ser somados num contador só.
    const records = [
      ...completo().slice(0, 6),
      { editionId: EDITION, questionId: 'q1', run: 1 }, // duplicata
      { editionId: EDITION, questionId: 'q1', run: 42 }, // run fora da faixa
      { editionId: 'revalida-2024-1', questionId: 'q1', run: 1 }, // outra edição
      { editionId: EDITION, questionId: 'fantasma', run: 1 }, // não-elegível
    ];
    const msg = describeRawCoverage(analisar(records, 3), 'x.jsonl');
    expect(msg).toContain('ausentes: 3');
    expect(msg).toContain('duplicados: 1');
    expect(msg).toContain('run fora de 1..N: 1');
    expect(msg).toContain('linhas corrompidas: 3');
    expect(msg).toContain('registros de outra edição: 1');
    expect(msg).toContain('questão não-elegível: 1');
  });

  it('explica que questão não-elegível é esperada após anulação', () => {
    const records = [
      ...completo().slice(0, 8),
      { editionId: EDITION, questionId: 'anulada', run: 1 },
    ];
    expect(describeRawCoverage(analisar(records), 'x')).toContain('anula itens');
  });
});

describe('analyzeRawCoverage — sem questão elegível', () => {
  it('não divide por zero', () => {
    const cov = analyzeRawCoverage({
      editionId: EDITION,
      eligibleQuestionIds: [],
      malformedLines: 0,
      records: [],
      runsPerQuestion: RUNS,
    });
    expect(cov.expectedRecords).toBe(0);
    expect(cov.coverage).toBe(0);
  });
});
