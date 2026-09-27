/**
 * Smoke test do barrel (index.ts) + testes de rescore (rescoreFromScored
 * e rescoreFromRaw) usando fixtures sintéticas escritas num tmpdir.
 */

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { loadEdition } from '@precisa-saude/medbench-dataset';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import * as barrel from '../src/index.js';
import { rescoreFromRaw, rescoreFromScored } from '../src/rescore.js';

describe('barrel exports', () => {
  it('expõe a superfície pública completa', () => {
    expect(typeof barrel.runEvaluation).toBe('function');
    expect(typeof barrel.parseLetter).toBe('function');
    expect(typeof barrel.scoreRun).toBe('function');
    expect(typeof barrel.findConsensusErrors).toBe('function');
    expect(typeof barrel.computeEnadeConcept).toBe('function');
    expect(typeof barrel.rateToEnadeLevel).toBe('function');
    expect(typeof barrel.anthropicProvider).toBe('function');
    expect(typeof barrel.openAiProvider).toBe('function');
    expect(typeof barrel.googleProvider).toBe('function');
    expect(typeof barrel.openAiCompatProvider).toBe('function');
    expect(typeof barrel.SYSTEM_PROMPT).toBe('string');
  });
});

describe('rescore', () => {
  let dir: string;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'medbench-rescore-'));
  });

  afterAll(() => {
    rmSync(dir, { force: true, recursive: true });
  });

  it('rescoreFromScored reconstrói EvaluationResult de um scored JSON', () => {
    const scoredPath = join(dir, 'scored.json');
    const artifact = {
      modelId: 'mock-model',
      perQuestion: [
        {
          contamination: 'likely-clean',
          correctAnswer: 'A',
          editionId: 'revalida-2025-1',
          majority: 'A',
          majorityCorrect: true,
          questionId: 'revalida-2025-1:q1',
          questionNumber: 1,
          runs: [
            { correct: true, parsed: 'A' },
            { correct: true, parsed: 'A' },
            { correct: true, parsed: 'A' },
          ],
          specialty: ['clinica-medica'],
        },
        {
          contamination: 'likely-clean',
          correctAnswer: 'B',
          editionId: 'revalida-2025-1',
          majority: 'C',
          majorityCorrect: false,
          questionId: 'revalida-2025-1:q2',
          questionNumber: 2,
          runs: [
            { correct: false, parsed: 'C' },
            { correct: false, parsed: 'C' },
            { correct: false, parsed: 'C' },
          ],
          specialty: ['cirurgia'],
        },
      ],
      runsPerQuestion: 3,
    };
    writeFileSync(scoredPath, JSON.stringify(artifact), 'utf8');

    const result = rescoreFromScored(scoredPath);
    expect(result.modelId).toBe('mock-model');
    expect(result.runsPerQuestion).toBe(3);
    expect(result.perQuestion).toHaveLength(2);
  });

  it('rescoreFromScored rejeita artefato sem perQuestion', () => {
    const path = join(dir, 'empty.json');
    writeFileSync(path, JSON.stringify({ modelId: 'x', runsPerQuestion: 1 }), 'utf8');
    expect(() => rescoreFromScored(path)).toThrow(/sem perQuestion/);
  });

  /**
   * Gera o log completo da edição real: questões elegíveis × runs.
   *
   * A versão anterior deste teste usava ids inventados (`revalida-2025-1:q1`)
   * que não existem na edição — os ids reais são `revalida-2025-1-q01`. Nenhum
   * registro casava, o scorer recebia zero records e o teste passava porque só
   * checava `modelId` e `runsPerQuestion`. Era a própria falha da #45
   * acontecendo dentro do teste que deveria protegê-la.
   */
  function logCompleto(runs: number) {
    const edition = loadEdition('revalida-2025-1');
    const elegiveis = edition.questions.filter((q) => !q.annulled && !q.hasImage && !q.hasTable);
    const linhas: string[] = [];
    for (const q of elegiveis) {
      for (let run = 1; run <= runs; run++) {
        linhas.push(
          JSON.stringify({
            correct: run === 1,
            editionId: 'revalida-2025-1',
            elapsedMs: 10,
            modelId: 'mock-model',
            parsed: q.correct,
            questionId: q.id,
            rawResponse: q.correct,
            requestParams: {},
            run,
          }),
        );
      }
    }
    return { elegiveis: elegiveis.length, linhas };
  }

  it('rescoreFromRaw escora o log completo e não anexa rawCoverage', () => {
    const rawPath = join(dir, 'completo.jsonl');
    const { elegiveis, linhas } = logCompleto(1);
    writeFileSync(rawPath, linhas.join('\n'), 'utf8');

    const result = rescoreFromRaw({
      editionId: 'revalida-2025-1',
      modelId: 'mock-model',
      rawLogPath: rawPath,
      runsPerQuestion: 1,
      trainingCutoff: '2024-01-01',
    });
    expect(result.modelId).toBe('mock-model');
    expect(result.runsPerQuestion).toBe(1);
    // O denominador agora é verificado: precisa ser a matriz inteira.
    expect(result.total).toBe(elegiveis);
    expect(result.rawCoverage).toBeUndefined();
  });

  it('rescoreFromRaw aborta quando falta registro no log', () => {
    const rawPath = join(dir, 'truncado.jsonl');
    const { linhas } = logCompleto(1);
    writeFileSync(rawPath, linhas.slice(0, -1).join('\n'), 'utf8');

    expect(() =>
      rescoreFromRaw({
        editionId: 'revalida-2025-1',
        modelId: 'mock-model',
        rawLogPath: rawPath,
        runsPerQuestion: 1,
        trainingCutoff: '2024-01-01',
      }),
    ).toThrow(/validação de cobertura falhou/);
  });

  it('rescoreFromRaw com allowPartial escora o subconjunto e registra a cobertura', () => {
    const rawPath = join(dir, 'parcial.jsonl');
    const { elegiveis, linhas } = logCompleto(1);
    // Log truncado + linha corrompida + linha de outra edição: cada motivo
    // deve aparecer separado no artefato.
    const corpo = [
      ...linhas.slice(0, -2),
      'invalido{json',
      JSON.stringify({
        correct: true,
        editionId: 'revalida-2024-1',
        elapsedMs: 10,
        modelId: 'mock-model',
        parsed: 'A',
        questionId: 'revalida-2024-1-q01',
        rawResponse: 'A',
        requestParams: {},
        run: 1,
      }),
    ];
    writeFileSync(rawPath, corpo.join('\n'), 'utf8');

    const result = rescoreFromRaw({
      allowPartial: true,
      editionId: 'revalida-2025-1',
      modelId: 'mock-model',
      rawLogPath: rawPath,
      runsPerQuestion: 1,
      trainingCutoff: '2024-01-01',
    });
    expect(result.total).toBe(elegiveis - 2);
    expect(result.rawCoverage).toBeDefined();
    expect(result.rawCoverage!.expectedRecords).toBe(elegiveis);
    expect(result.rawCoverage!.observedRecords).toBe(elegiveis - 2);
    expect(result.rawCoverage!.coverage).toBeLessThan(1);
    expect(result.rawCoverage!.exclusions.malformedLines).toBe(1);
    expect(result.rawCoverage!.exclusions.wrongEdition).toBe(1);
  });
});
