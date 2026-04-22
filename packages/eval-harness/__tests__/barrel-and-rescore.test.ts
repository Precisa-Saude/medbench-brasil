/**
 * Smoke test do barrel (index.ts) + testes de rescore (rescoreFromScored
 * e rescoreFromRaw) usando fixtures sintéticas escritas num tmpdir.
 */

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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

  it('rescoreFromRaw lê raw.jsonl e reconstrói via loadEdition', () => {
    const rawPath = join(dir, 'raw.jsonl');
    // Gera linhas raw pra algumas questões da edição real. Apenas 3
    // questões — o teste não precisa da edição inteira, só que o loader
    // resolva e o scorer escore algo.
    const lines = [
      {
        correct: true,
        editionId: 'revalida-2025-1',
        elapsedMs: 10,
        modelId: 'mock-model',
        parsed: 'A',
        questionId: 'revalida-2025-1:q1',
        rawResponse: 'A',
        requestParams: {},
        run: 1,
      },
      // Linha corrompida pra exercitar o warn-skip
      'invalido{json',
      {
        correct: false,
        editionId: 'revalida-2025-1',
        elapsedMs: 10,
        modelId: 'mock-model',
        parsed: 'C',
        questionId: 'revalida-2025-1:q2',
        rawResponse: 'C',
        requestParams: {},
        run: 1,
      },
      // Linha de outra edição — deve ser ignorada
      {
        correct: true,
        editionId: 'revalida-2024-1',
        elapsedMs: 10,
        modelId: 'mock-model',
        parsed: 'A',
        questionId: 'revalida-2024-1:q1',
        rawResponse: 'A',
        requestParams: {},
        run: 1,
      },
    ]
      .map((l) => (typeof l === 'string' ? l : JSON.stringify(l)))
      .join('\n');
    writeFileSync(rawPath, lines, 'utf8');

    const result = rescoreFromRaw({
      editionId: 'revalida-2025-1',
      modelId: 'mock-model',
      rawLogPath: rawPath,
      runsPerQuestion: 1,
      trainingCutoff: '2024-01-01',
    });
    expect(result.modelId).toBe('mock-model');
    expect(result.runsPerQuestion).toBe(1);
  });
});
