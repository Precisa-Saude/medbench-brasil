#!/usr/bin/env node
/**
 * Executa um punhado de perguntas (3 questões × 1 run) contra um modelo para
 * descobrir seu formato de resposta e se está susceptível ao bug do parser
 * "phantom-A" — quando a resposta começa com `<letra>\n\n<justificativa em pt-BR>`
 * sem marcadores explícitos (`**X**`, "Resposta:", `X)`), a regra 5 da
 * parseLetter pegava o artigo "a" por engano.
 *
 * Uso:
 *   node scripts/probe-model-format.mjs <backend> <model> [--edition revalida-2025-1]
 *
 * Resultado salvo em probes/<edition>/<slug>.raw.jsonl + stdout com relatório.
 */
/* eslint-disable no-console */
import { config as loadDotenv } from 'dotenv';
loadDotenv({ path: '.env.local' });
loadDotenv();

import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadEdition } from '@precisa-saude/medbench-dataset';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const distPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'index.js');
if (!existsSync(distPath)) {
  console.error(
    `dist/ ausente em packages/eval-harness/. Rode:\n` +
      `  pnpm --filter @precisa-saude/medbench-harness build\n`,
  );
  process.exit(1);
}
const {
  anthropicProvider,
  googleProvider,
  openAiProvider,
  openAiCompatProvider,
  parseLetter,
  SYSTEM_PROMPT,
} = await import(distPath);

function buildProvider(backend, model) {
  switch (backend) {
    case 'anthropic':
      return anthropicProvider({ model });
    case 'openai':
      return openAiProvider({ model });
    case 'google':
      return googleProvider({ model });
    case 'maritaca':
      return openAiCompatProvider({
        apiKey: process.env.MARITACA_API_KEY,
        baseUrl: 'https://chat.maritaca.ai/api',
        model,
        provider: 'Maritaca AI',
      });
    case 'together':
      return openAiCompatProvider({
        apiKey: process.env.TOGETHER_API_KEY,
        baseUrl: 'https://api.together.xyz/v1',
        model,
        provider: 'Together AI',
      });
    case 'openrouter':
      return openAiCompatProvider({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseUrl: 'https://openrouter.ai/api/v1',
        model,
        provider: 'OpenRouter',
      });
    default:
      throw new Error(`backend desconhecido: ${backend}`);
  }
}

function renderUserPrompt(q) {
  const opts = ['A', 'B', 'C', 'D'].map((k) => `${k}) ${q.options[k]}`).join('\n');
  return `${q.stem}\n\n${opts}`;
}

function classifyFormat(raw) {
  const t = raw.trim();
  if (/^[ABCD]\s*$/.test(t)) return 'bare-letter';
  if (/^[ABCD]\s*\n/.test(t)) return 'letter-then-explanation';
  if (/\*\*\s*[ABCD]\s*\*\*/i.test(t)) return 'bold-marker';
  if (/\b(resposta|alternativa|letra|op[cç][aã]o)\b.{0,20}\b[ABCD]\b/i.test(t))
    return 'commit-phrase';
  if (/\b[ABCD]\)/.test(t)) return 'paren-letter';
  return 'other';
}

function suspectParserBug(format) {
  return format === 'letter-then-explanation' || format === 'other';
}

const [backend, model, ...rest] = process.argv.slice(2);
const args = Object.fromEntries(
  rest.reduce((acc, a, i, arr) => {
    if (a.startsWith('--') && arr[i + 1] && !arr[i + 1].startsWith('--'))
      acc.push([a.slice(2), arr[i + 1]]);
    return acc;
  }, []),
);

if (!backend || !model) {
  console.error(
    'uso: node packages/eval-harness/scripts/probe-model-format.mjs <backend> <model> [--edition revalida-2025-1]',
  );
  process.exit(1);
}

const edition = args.edition ?? 'revalida-2025-1';
const samplesN = Number(args.samples ?? 3);

const ed = loadEdition(edition);
const eligible = ed.questions.filter((q) => !q.annulled && !q.hasImage && !q.hasTable);
// Guarda quando samplesN >= eligible.length: step < 1 geraria índices
// repetidos/negativos. Clamp para pegar todas as questões disponíveis.
const effectiveN = Math.min(samplesN, eligible.length);
const step = eligible.length / (effectiveN + 1);
const samples = [];
for (let i = 1; i <= effectiveN; i++) {
  samples.push(eligible[Math.max(0, Math.round(i * step) - 1)]);
}

const provider = buildProvider(backend, model);
const slug = model.replace(/[^a-z0-9.-]/gi, '_');
const outDir = join(root, 'probes', edition);
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, `${slug}.raw.jsonl`);
if (existsSync(outPath)) writeFileSync(outPath, '');

console.log(`probe: ${backend}:${model} × ${effectiveN} questões de ${edition}`);
console.log(`raw: ${outPath}`);
console.log('');

const formatCounts = {};
let suspect = 0;
for (const q of samples) {
  try {
    const res = await provider.run({
      question: q,
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: renderUserPrompt(q),
    });
    const raw = res.rawResponse;
    const parsed = parseLetter(raw);
    const format = classifyFormat(raw);
    const correct = parsed === q.correct;
    formatCounts[format] = (formatCounts[format] || 0) + 1;
    if (suspectParserBug(format)) suspect += 1;
    const preview = raw.replace(/\n/g, ' ').slice(0, 120);
    console.log(
      `  ${q.id}: gold=${q.correct} parsed=${parsed ?? '?'} ${correct ? 'OK' : 'MISS'} [${format}]`,
    );
    console.log(`    "${preview}${raw.length > 120 ? '…' : ''}"`);
    appendFileSync(
      outPath,
      JSON.stringify({
        editionId: edition,
        modelId: provider.id,
        questionId: q.id,
        parsed,
        correct,
        rawResponse: raw,
        format,
      }) + '\n',
    );
  } catch (err) {
    console.log(`  ${q.id}: ERRO — ${err instanceof Error ? err.message.slice(0, 120) : err}`);
  }
}

console.log('');
console.log('formatos:', Object.entries(formatCounts).map(([k, v]) => `${k}=${v}`).join(', '));
console.log(
  suspect > 0
    ? `SUSPEITO — ${suspect}/${effectiveN} amostras em formato vulnerável ao bug phantom-A. Rerun recomendado.`
    : 'OK — formatos cobertos pelo parser atual. Resumo existente provavelmente correto.',
);
