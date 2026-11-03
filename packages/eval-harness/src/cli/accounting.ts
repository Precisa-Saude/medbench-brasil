/* eslint-disable no-console */
import { randomUUID } from 'node:crypto';
import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

import type { Provider, RequestAttemptRecord } from '../types.js';
import { summarizeUsage } from '../usage.js';

/** Ledger independente dos raws: restart e smoke nunca apagam gasto anterior. */
export function createRequestLedger(
  baseDir: string,
  edition: string,
  provider: Provider,
  purpose: 'eval' | 'smoke',
) {
  const dir = join(baseDir, edition);
  mkdirSync(dir, { recursive: true });
  const slug = provider.id.replace(/[^a-z0-9.-]/gi, '_');
  const path = join(dir, `${slug}.${purpose}.requests.jsonl`);
  appendFileSync(path, '');
  const attempts: RequestAttemptRecord[] = [];
  return {
    onRequestAttempt(record: RequestAttemptRecord) {
      appendFileSync(path, `${JSON.stringify(record)}\n`);
      attempts.push(record);
    },
    printSummary() {
      const usage = summarizeUsage(attempts);
      console.log(`auditoria: ${path}`);
      console.log(
        `consumo novo: ${attempts.length} tentativa(s), ${attempts.filter((a) => a.outcome === 'error').length} erro(s)`,
      );
      console.log(
        usage
          ? `tokens observados: entrada=${usage.inputTokens}, saída=${usage.outputTokens} (inclui reasoning); cobertura ${usage.callsWithUsage}/${usage.totalCalls}`
          : 'tokens observados: desconhecidos (nenhuma tentativa com usage)',
      );
      console.log(
        'Consumo não é cobrança conciliada. Tentativas sem usage podem ter sido faturadas.',
      );
    },
    runId: randomUUID(),
  };
}
