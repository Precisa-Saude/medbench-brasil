import { randomUUID } from 'node:crypto';

import { ProviderHttpError } from './providers/_usage.js';
import type { Provider, ProviderResponse, RequestAttemptRecord, RunInput } from './types.js';

type AttemptContext = Pick<RequestAttemptRecord, 'attempt' | 'purpose' | 'run' | 'runId'>;

export class AccountingPersistenceError extends Error {
  constructor(cause: unknown) {
    super('Falha ao persistir auditoria de consumo; interrompendo execução.', { cause });
    this.name = 'AccountingPersistenceError';
  }
}

function persist(
  onAttempt: ((record: RequestAttemptRecord) => void) | undefined,
  record: RequestAttemptRecord,
) {
  try {
    onAttempt?.(record);
  } catch (cause) {
    throw new AccountingPersistenceError(cause);
  }
}

/** Observa a chamada sem alterar parâmetros, resposta, retry ou scoring. */
export async function observeRequest(
  provider: Provider,
  input: RunInput,
  context: AttemptContext,
  onAttempt?: (record: RequestAttemptRecord) => void,
): Promise<ProviderResponse> {
  const startedAt = new Date().toISOString();
  const start = Date.now();
  const base = {
    ...context,
    attemptId: randomUUID(),
    editionId: input.question.editionId,
    modelId: provider.id,
    provider: provider.provider,
    questionId: input.question.id,
    startedAt,
  };
  let response: ProviderResponse;
  try {
    response = await provider.run(input);
  } catch (error) {
    persist(onAttempt, {
      ...base,
      elapsedMs: Date.now() - start,
      errorType: error instanceof Error ? error.name : 'unknown',
      outcome: 'error',
      ...(error instanceof ProviderHttpError ? error.accounting : {}),
    });
    throw error;
  }
  // Falha ao persistir auditoria não é uma falha do provider a ser retentada.
  persist(onAttempt, {
    ...base,
    elapsedMs: Date.now() - start,
    outcome: 'success',
    ...(response.usage ? { usage: response.usage } : {}),
    ...(response.responseMetadata ? { responseMetadata: response.responseMetadata } : {}),
  });
  return { ...response, attemptId: base.attemptId, startedAt };
}
