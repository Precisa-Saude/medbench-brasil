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

import { parseArgs } from './cli/args.js';
import type { Backend } from './cli/build-provider.js';
import { buildProvider } from './cli/build-provider.js';
import { printUsage } from './cli/usage.js';
import { SYSTEM_PROMPT } from './prompt.js';
import { parseLetter, runEvaluation } from './runner.js';
import type { RawResponseRecord } from './types.js';

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
