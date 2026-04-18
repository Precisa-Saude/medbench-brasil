/**
 * Exemplo: avaliar Claude Sonnet 4.6 em Revalida 2025/1.
 *
 * Pré-requisitos:
 *   - ANTHROPIC_API_KEY no ambiente
 *   - edição 2025-1 preenchida em packages/dataset/data/revalida/2025-1.json
 *
 * Execução:
 *   pnpm tsx examples/avaliar-uma-edicao.ts
 */
import { anthropicProvider, runEvaluation } from '@precisa-saude/medbench-harness';

async function main() {
  const provider = anthropicProvider({
    label: 'Claude Sonnet 4.6',
    model: 'claude-sonnet-4-6',
    trainingCutoff: '2024-10-01',
  });

  const result = await runEvaluation(provider, {
    editions: ['revalida-2025-1'],
    excludeImages: true,
    excludeTables: true,
    runsPerQuestion: 3,
  });

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
