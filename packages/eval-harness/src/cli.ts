#!/usr/bin/env node
/* eslint-disable no-console */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { config as loadDotenv } from 'dotenv';

// Carrega .env.local (preferido) e .env no cwd antes de instanciar providers,
// para que API keys possam vir de arquivos locais e não de `export` shell.
loadDotenv({ path: '.env.local' });
loadDotenv();

import type { EditionId } from '@precisa-saude/medbench-dataset';
import { loadEdition } from '@precisa-saude/medbench-dataset';

import { SYSTEM_PROMPT } from './prompt.js';
import { anthropicProvider } from './providers/anthropic.js';
import { googleProvider } from './providers/google.js';
import { openAiProvider } from './providers/openai.js';
import { openAiCompatProvider } from './providers/openai-compat.js';
import { parseLetter, runEvaluation } from './runner.js';
import type { Provider, RawResponseRecord } from './types.js';

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg?.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        out[key] = next;
        i++;
      } else {
        out[key] = 'true';
      }
    }
  }
  return out;
}

type Backend =
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'ollama'
  | 'maritaca'
  | 'together'
  | 'openrouter';

function buildProvider(backend: Backend, args: Record<string, string>): Provider {
  const model = args.model;
  if (!model) {
    throw new Error('--model é obrigatório');
  }
  const cutoff = args.cutoff;
  const label = args.label;

  switch (backend) {
    case 'anthropic':
      return anthropicProvider({ label, model, trainingCutoff: cutoff });
    case 'openai':
      return openAiProvider({ label, model, trainingCutoff: cutoff });
    case 'google':
      return googleProvider({ label, model, trainingCutoff: cutoff });
    case 'ollama':
      return openAiCompatProvider({
        baseUrl: args.baseUrl ?? 'http://localhost:11434/v1',
        label,
        model,
        provider: 'Ollama',
        trainingCutoff: cutoff,
      });
    case 'maritaca': {
      const apiKey = args.apiKey ?? process.env.MARITACA_API_KEY;
      if (!apiKey) {
        throw new Error('MARITACA_API_KEY ausente — defina no ambiente antes de rodar.');
      }
      return openAiCompatProvider({
        apiKey,
        baseUrl: args.baseUrl ?? 'https://chat.maritaca.ai/api',
        label,
        model,
        provider: 'Maritaca AI',
        trainingCutoff: cutoff,
      });
    }
    case 'together': {
      const apiKey = args.apiKey ?? process.env.TOGETHER_API_KEY;
      if (!apiKey) {
        throw new Error('TOGETHER_API_KEY ausente — defina no ambiente antes de rodar.');
      }
      return openAiCompatProvider({
        apiKey,
        baseUrl: args.baseUrl ?? 'https://api.together.xyz/v1',
        label,
        model,
        provider: 'Together AI',
        trainingCutoff: cutoff,
      });
    }
    case 'openrouter': {
      const apiKey = args.apiKey ?? process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY ausente — defina no ambiente antes de rodar.');
      }
      return openAiCompatProvider({
        apiKey,
        baseUrl: args.baseUrl ?? 'https://openrouter.ai/api/v1',
        label,
        model,
        provider: 'OpenRouter',
        trainingCutoff: cutoff,
      });
    }
    default:
      throw new Error(`backend inválido: ${backend}`);
  }
}

function printUsage() {
  console.log(`uso: medbench <comando> [opções]

Comandos:
  eval    Roda avaliação completa (todas as questões × --runs)
  smoke   Pré-flight: roda ~8 questões e valida parser. Aborta com código não-zero
          se taxa de parse correto ficar abaixo do threshold.
          Use SEMPRE antes de eval em um modelo novo.

Opções comuns (ambos os comandos):
  --backend <anthropic|openai|google|ollama|maritaca|together|openrouter>  (obrigatório)
  --model <id>                (obrigatório)
  --edition revalida-2025-1   (padrão)
  --label "Nome legível"
  --cutoff YYYY-MM-DD
  --concurrency N             (padrão: 10 para APIs, 1 para ollama)

Opções de eval:
  --runs N                    (padrão: 3)
  --out DIR                   (padrão: results/)
  --no-raw-log                Desabilita JSONL bruto (por padrão ativado)
  --restart                   Descarta JSONL prévio e recomeça do zero
                              (padrão: retoma de onde parou)

Opções de smoke:
  --samples N                 (padrão: 8)
  --threshold 0.7             (padrão: 0.7 = exige ≥70% de parses corretos)`);
}

function renderUserPrompt(q: {
  options: Record<'A' | 'B' | 'C' | 'D', string>;
  stem: string;
}): string {
  const opts = (['A', 'B', 'C', 'D'] as const).map((k) => `${k}) ${q.options[k]}`).join('\n');
  return `${q.stem}\n\n${opts}`;
}

function samplePickIds(total: number, n: number): number[] {
  // Spread evenly — 8 amostras de 85: 10, 21, 32, 43, 54, 65, 76, 85 (ou similar).
  const ids: number[] = [];
  const step = total / (n + 1);
  for (let i = 1; i <= n; i++) ids.push(Math.round(i * step));
  return ids;
}

async function runSmoke(args: Record<string, string>) {
  const backend = args.backend as Backend;
  const provider = buildProvider(backend, args);
  const editionId = (args.edition ?? 'revalida-2025-1') as EditionId;
  const n = Number(args.samples ?? 8);
  const threshold = Number(args.threshold ?? 0.7);

  const edition = loadEdition(editionId);
  const eligible = edition.questions.filter((q) => !q.annulled && !q.hasImage && !q.hasTable);
  const pickNumbers = samplePickIds(eligible.length, n);
  const samples = pickNumbers.map((i) => eligible[i - 1]!).filter(Boolean);

  console.log(
    `smoke: ${provider.label} × ${samples.length} questões de ${editionId} (threshold ${(threshold * 100).toFixed(0)}%)`,
  );

  let ok = 0;
  const failures: Array<{ parsed: string | null; qid: string; tail: string }> = [];
  for (const q of samples) {
    try {
      const res = await provider.run({
        question: q,
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: renderUserPrompt(q),
      });
      const parsed = res.parsedAnswer ?? parseLetter(res.rawResponse);
      const correct = parsed === q.correct;
      if (correct) ok += 1;
      else
        failures.push({ parsed, qid: q.id, tail: res.rawResponse.slice(-180).replace(/\n/g, ' ') });
      console.log(`  ${q.id}: parsed=${parsed ?? '?'} vs ${q.correct} ${correct ? 'OK' : 'MISS'}`);
    } catch (err) {
      failures.push({
        parsed: null,
        qid: q.id,
        tail: err instanceof Error ? err.message.slice(0, 180) : String(err),
      });
      console.log(`  ${q.id}: ERRO — ${err instanceof Error ? err.message.slice(0, 120) : err}`);
    }
  }

  const rate = ok / samples.length;
  const verdict = rate >= threshold ? 'PASS' : 'FAIL';
  console.log(`\n${verdict} — ${ok}/${samples.length} (${(rate * 100).toFixed(1)}%)`);

  if (verdict === 'FAIL') {
    console.log(
      '\nModelo provavelmente emite resposta em formato que o parser não reconhece, OU o modelo é genuinamente ruim em pt-BR médico. Revise os exemplos falhos:',
    );
    for (const f of failures) {
      console.log(`  ${f.qid} → parsed=${f.parsed ?? '?'} | ...${f.tail}`);
    }
    process.exit(1);
  }
}

async function runEval(args: Record<string, string>) {
  const backend = args.backend as Backend;
  const provider = buildProvider(backend, args);

  const defaultConcurrency = backend === 'ollama' ? 1 : 10;
  const concurrency = args.concurrency ? Number(args.concurrency) : defaultConcurrency;
  const edition = args.edition ?? 'revalida-2025-1';
  const logRaw = args['no-raw-log'] !== 'true';
  const forceRestart = args.restart === 'true';

  console.log(`avaliando ${provider.label} via ${provider.provider} em ${edition}…`);

  // Layout por edição — espelha packages/dataset/data/revalida/<edition>.json.
  const baseDir = args.out ?? 'results';
  const outDir = join(baseDir, edition);
  mkdirSync(outDir, { recursive: true });
  const slug = provider.id.replace(/[^a-z0-9.-]/gi, '_');
  const outPath = join(outDir, `${slug}.json`);
  const rawLogPath = join(outDir, `${slug}.raw.jsonl`);

  // Retomada: se existe JSONL prévio, carrega os registros e reaproveita.
  // Com --restart, descarta e recomeça do zero.
  const priorRecords: RawResponseRecord[] = [];
  if (logRaw && existsSync(rawLogPath) && !forceRestart) {
    const raw = readFileSync(rawLogPath, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        priorRecords.push(JSON.parse(trimmed) as RawResponseRecord);
      } catch {
        // linha corrompida — ignora, será re-executada
      }
    }
    if (priorRecords.length > 0) {
      console.log(
        `retomando: ${priorRecords.length} execuções encontradas em ${rawLogPath} (use --restart para descartar)`,
      );
    }
  } else if (logRaw) {
    writeFileSync(rawLogPath, '');
  }

  const result = await runEvaluation(provider, {
    concurrency,
    editions: [edition],
    excludeImages: true,
    excludeTables: true,
    onRawResponse: logRaw
      ? (record: RawResponseRecord) => {
          appendFileSync(rawLogPath, `${JSON.stringify(record)}\n`);
        }
      : undefined,
    priorRecords,
    runsPerQuestion: Number(args.runs ?? 3),
  });

  writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(
    `resultado salvo em ${outPath} (precisão ${(result.accuracy * 100).toFixed(1)}%, IC ${(result.ci95[0] * 100).toFixed(1)}–${(result.ci95[1] * 100).toFixed(1)}%)`,
  );
  if (logRaw) console.log(`log bruto em ${rawLogPath}`);
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);

  if (args.help || !command) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }
  if (!args.backend || !args.model) {
    console.log('--backend e --model são obrigatórios. Use --help para detalhes.');
    process.exit(1);
  }

  if (command === 'smoke') {
    await runSmoke(args);
  } else if (command === 'eval') {
    await runEval(args);
  } else {
    console.log(`comando desconhecido: ${command}. Use 'smoke' ou 'eval'.`);
    printUsage();
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
