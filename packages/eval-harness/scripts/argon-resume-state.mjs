import assert from 'node:assert/strict';

export const EXCLUDED_ATTEMPT_ID = '127126cd-621b-40ea-add2-4a20fc71bdf8';
export const ARGON_MODEL = 'google/gemini-4-argon';
export const ARGON_EDITION = 'revalida-2026-1';

// Seleção exclusivamente operacional. Uma resposta válida incorreta fica aceita.
export function selectArgonResume(rows, ledger) {
  const byAttempt = new Map(ledger.map((record) => [record.attemptId, record]));
  assert.equal(byAttempt.size, ledger.length, 'Attempt ID duplicado no ledger.');
  assert.equal(rows.length, 45, 'Esperados os 45 raws originais.');
  assert.equal(ledger.length, 45, 'Esperadas as 45 tentativas originais.');
  const seen = new Set();
  const accepted = [];
  const excluded = [];
  for (const row of rows) {
    assert.equal(row.modelId, ARGON_MODEL);
    assert.equal(row.editionId, ARGON_EDITION);
    assert([1, 2, 3].includes(row.run));
    const key = `${row.questionId}/${row.run}`;
    assert(!seen.has(key), 'Par questão/run duplicado.');
    seen.add(key);
    const attempt = byAttempt.get(row.attemptId);
    assert(attempt, 'Raw sem tentativa correspondente.');
    assert.equal(attempt.outcome, 'success');
    assert.equal(attempt.purpose, 'eval');
    for (const field of [
      'modelId',
      'editionId',
      'questionId',
      'run',
      'runId',
      'startedAt',
      'usage',
      'responseMetadata',
    ]) {
      assert.deepEqual(row[field], attempt[field], field);
    }
    if (row.attemptId === EXCLUDED_ATTEMPT_ID) {
      assert.equal(row.questionId, 'revalida-2026-1-q22');
      assert.equal(row.run, 2);
      assert.equal(row.stopReason, 'error');
      assert.equal(row.rawResponse, '');
      assert.equal(row.parsed, null);
      excluded.push(row);
    } else {
      assert.equal(row.stopReason, 'stop', 'Outra parada anormal não foi autorizada.');
      assert(['A', 'B', 'C', 'D'].includes(row.parsed), 'Parsing inválido não autorizado.');
      accepted.push(row);
    }
  }
  assert.equal(excluded.length, 1, 'A única exclusão autorizada deve estar presente.');
  assert.equal(accepted.length, 44);
  return { accepted, excluded };
}
