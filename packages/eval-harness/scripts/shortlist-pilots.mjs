// Piloto operacional limitado, sem publicação de score ou retries.
import { randomUUID } from 'node:crypto';
import { appendFileSync, closeSync, existsSync, mkdirSync, openSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import { loadEdition } from '../../dataset/dist/index.js';
import {
  anthropicProvider,
  googleProvider,
  observeRequest,
  openAiProvider,
  openAiCompatProvider,
  parseLetter,
  SYSTEM_PROMPT,
} from '../dist/index.js';

const require = createRequire(new URL('../package.json', import.meta.url));
if (!process.argv[2]) throw new Error('Informe o caminho do ambiente local como argumento.');
require('dotenv').config({ path: process.argv[2], quiet: true });
const mode = process.argv[3] ?? 'native';
if (!['native', 'openrouter'].includes(mode)) throw new Error('Modo inválido.');
for (const key of mode === 'openrouter'
  ? ['OPENROUTER_API_KEY']
  : ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY']) {
  if (!process.env[key]) throw new Error(`Credencial ausente: ${key}`);
}
if (mode === 'native' && !process.env.GOOGLE_API_KEY && !process.env.GEMINI_API_KEY)
  throw new Error('Credencial Google ausente.');

const editionId = 'revalida-2026-1';
const eligible = loadEdition(editionId).questions.filter(
  (q) => !q.annulled && !q.hasImage && !q.hasTable,
);
const samples = Array.from(
  { length: 8 },
  (_, i) => eligible[Math.round((i * (eligible.length - 1)) / 7)],
);
const dir = fileURLToPath(new URL(`../../../results/${editionId}/`, import.meta.url));
mkdirSync(dir, { recursive: true });
const models =
  mode === 'openrouter'
    ? [
        openAiCompatProvider({
          model: 'openai/gpt-6.1-terra',
          apiKey: process.env.OPENROUTER_API_KEY,
          baseUrl: 'https://openrouter.ai/api/v1',
          provider: 'OpenRouter',
          reasoningEffort: 'high',
          maxTokens: 8192,
          timeoutMs: 300_000,
        }),
        openAiCompatProvider({
          model: 'google/gemini-4-argon',
          apiKey: process.env.OPENROUTER_API_KEY,
          baseUrl: 'https://openrouter.ai/api/v1',
          provider: 'OpenRouter',
          reasoningEffort: 'high',
          maxTokens: 32768,
          timeoutMs: 900_000,
        }),
      ]
    : [
        openAiProvider({ model: 'gpt-6.1-terra' }),
        anthropicProvider({ model: 'claude-haiku-5-5' }),
        googleProvider({ model: 'gemini-4-argon' }),
      ];
// Reservar todos os arquivos antes da primeira chamada impede repetição acidental.
const paths = models.map((p) => ({
  raw: `${dir}${p.id.replace(/[^a-z0-9.-]/gi, '_')}.smoke.jsonl`,
  ledger: `${dir}${p.id.replace(/[^a-z0-9.-]/gi, '_')}.smoke.requests.jsonl`,
}));
if (paths.some((p) => existsSync(p.raw) || existsSync(p.ledger)))
  throw new Error('Piloto já iniciado; não repetir chamadas automaticamente.');
for (const p of paths) for (const path of Object.values(p)) closeSync(openSync(path, 'wx'));
const append = (path, value) => appendFileSync(path, `${JSON.stringify(value)}\n`);
console.log(
  JSON.stringify({
    editionId,
    mode,
    questions: samples.map((q) => q.id),
    maxCalls: models.length * samples.length,
  }),
);
for (const [i, provider] of models.entries()) {
  const runId = randomUUID();
  for (const q of samples) {
    let response;
    try {
      response = await observeRequest(
        provider,
        {
          question: q,
          systemPrompt: SYSTEM_PROMPT,
          userPrompt: `${q.stem}\n\n${['A', 'B', 'C', 'D'].map((k) => `${k}) ${q.options[k]}`).join('\n')}`,
        },
        { attempt: 1, purpose: 'smoke', run: 1, runId },
        (record) => append(paths[i].ledger, record),
      );
    } catch (error) {
      if (error.name === 'AccountingPersistenceError') throw error;
      // Não imprimir mensagens arbitrárias que possam conter dados sensíveis.
      console.log(
        JSON.stringify({
          modelId: provider.id,
          questionId: q.id,
          blocked: error.name,
          status: /API erro (\d{3})/.exec(error.message)?.[1],
        }),
      );
      break;
    }
    const parsed = parseLetter(response.rawResponse);
    append(paths[i].raw, {
      ...response,
      parsedAnswer: parsed,
      modelId: provider.id,
      editionId,
      questionId: q.id,
      run: 1,
      runId,
    });
    const blocked = !parsed || !['stop', 'end_turn', 'STOP'].includes(response.stopReason);
    console.log(
      JSON.stringify({
        modelId: provider.id,
        questionId: q.id,
        parsed,
        stopReason: response.stopReason,
        usage: response.usage,
        resolvedModel: response.responseMetadata?.resolvedModel,
        blocked,
      }),
    );
    if (blocked) break;
  }
}
