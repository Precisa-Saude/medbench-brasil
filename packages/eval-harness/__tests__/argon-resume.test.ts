import { describe, expect, it } from 'vitest';

import {
  ARGON_EDITION,
  ARGON_MODEL,
  EXCLUDED_ATTEMPT_ID,
  selectArgonResume,
} from '../scripts/argon-resume-state.mjs';

function fixture() {
  const rows = Array.from({ length: 45 }, (_, i) => ({
    attemptId: i === 44 ? EXCLUDED_ATTEMPT_ID : `attempt-${i}`,
    modelId: ARGON_MODEL,
    editionId: ARGON_EDITION,
    questionId: i === 44 ? 'revalida-2026-1-q22' : `q${i}`,
    run: i === 44 ? 2 : 1,
    runId: 'original',
    startedAt: '2026-11-04T13:48:26.774Z',
    usage: { inputTokens: 10, outputTokens: 2 },
    responseMetadata: { resolvedModel: ARGON_MODEL, provider: 'Google' },
    stopReason: i === 44 ? 'error' : 'stop',
    rawResponse: i === 44 ? '' : 'A',
    parsed: i === 44 ? null : 'A',
    correct: false,
  }));
  const ledger = rows.map(
    ({
      stopReason: _stopReason,
      rawResponse: _raw,
      parsed: _parsed,
      correct: _correct,
      ...row
    }) => ({ ...structuredClone(row), purpose: 'eval', outcome: 'success' }),
  );
  return { rows, ledger };
}

describe('retomada limitada de Argon', () => {
  it('exclui somente a falha autorizada e preserva respostas válidas incorretas', () => {
    const { rows, ledger } = fixture();
    const before = structuredClone({ rows, ledger });
    const { accepted, excluded } = selectArgonResume(rows, ledger);
    expect(accepted).toHaveLength(44);
    expect(accepted.every((row: { correct: boolean }) => !row.correct)).toBe(true);
    expect(excluded.map((row: { attemptId: string }) => row.attemptId)).toEqual([
      EXCLUDED_ATTEMPT_ID,
    ]);
    expect({ rows, ledger }).toEqual(before);
  });

  it('não repete uma resposta normal com o ID da falha', () => {
    const { rows, ledger } = fixture();
    rows[44]!.stopReason = 'stop';
    expect(() => selectArgonResume(rows, ledger)).toThrow();
  });

  it('rejeita outra resposta vazia ou parada anormal', () => {
    const { rows, ledger } = fixture();
    rows[0]!.parsed = null;
    expect(() => selectArgonResume(rows, ledger)).toThrow();
    rows[0]!.parsed = 'A';
    rows[0]!.stopReason = 'length';
    expect(() => selectArgonResume(rows, ledger)).toThrow();
  });

  it('rejeita duplicata de par ou attempt ID', () => {
    const { rows, ledger } = fixture();
    rows[1]!.questionId = rows[0]!.questionId;
    expect(() => selectArgonResume(rows, ledger)).toThrow();
    const next = fixture();
    next.ledger[1]!.attemptId = next.ledger[0]!.attemptId;
    expect(() => selectArgonResume(next.rows, next.ledger)).toThrow();
  });

  it('rejeita falta no ledger e divergência do contexto', () => {
    const { rows, ledger } = fixture();
    ledger[0]!.attemptId = 'outro-id';
    expect(() => selectArgonResume(rows, ledger)).toThrow();
    const next = fixture();
    next.ledger[0]!.run = 3;
    expect(() => selectArgonResume(next.rows, next.ledger)).toThrow();
  });
});
