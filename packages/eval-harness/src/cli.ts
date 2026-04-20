#!/usr/bin/env node
/* eslint-disable no-console */
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
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
import { findConsensusErrors } from './consensus.js';
import { computeEnadeConcept } from './enade.js';
import { SYSTEM_PROMPT } from './prompt.js';
import { rescoreFromRaw, rescoreFromScored } from './rescore.js';
import { parseLetter, runEvaluation } from './runner.js';
import type { EvaluationResult, RawResponseRecord } from './types.js';

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

function runRescore(args: Record<string, string>) {
  const baseDir = args.out ?? 'results';
  const editionFilter = args.edition;
  const modelFilter = args.model;
  const fromRaw = args['from-raw'] === 'true';

  if (fromRaw) {
    if (!editionFilter || !modelFilter) {
      console.log('--from-raw exige --edition e --model. Ver --help.');
      process.exit(1);
    }
    const slug = modelFilter.replace(/[^a-z0-9.-]/gi, '_');
    const dir = join(baseDir, editionFilter);
    const rawLogPath = join(dir, `${slug}.raw.jsonl`);
    if (!existsSync(rawLogPath)) {
      console.log(`raw.jsonl não encontrado: ${rawLogPath}`);
      process.exit(1);
    }
    const result = rescoreFromRaw({
      editionId: editionFilter as EditionId,
      modelId: modelFilter,
      rawLogPath,
      runsPerQuestion: Number(args.runs ?? 3),
      trainingCutoff: args.cutoff,
    });
    const outPath = join(dir, `${slug}.json`);
    writeFileSync(outPath, JSON.stringify(result, null, 2));
    console.log(
      `scored gerado em ${outPath} (precisão ${(result.accuracy * 100).toFixed(1)}%, macro-F1 ${((result.macroF1 ?? 0) * 100).toFixed(1)}%)`,
    );
    return;
  }

  const editions = editionFilter
    ? [editionFilter]
    : readdirSync(baseDir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name);

  let touched = 0;
  let skipped = 0;
  for (const edition of editions) {
    const dir = join(baseDir, edition);
    if (!existsSync(dir)) continue;
    const files = readdirSync(dir).filter((f) => f.endsWith('.json') && !f.endsWith('.raw.jsonl'));
    for (const file of files) {
      if (modelFilter) {
        const slug = modelFilter.replace(/[^a-z0-9.-]/gi, '_');
        if (file !== `${slug}.json`) continue;
      }
      const path = join(dir, file);
      try {
        const result = rescoreFromScored(path);
        writeFileSync(path, JSON.stringify(result, null, 2));
        touched += 1;
      } catch (err) {
        skipped += 1;
        console.warn(`  pulado ${path}: ${err instanceof Error ? err.message.slice(0, 120) : err}`);
      }
    }
  }
  console.log(`re-scored ${touched} artefato(s) em ${baseDir}/. pulados: ${skipped}.`);
}

function runReport(args: Record<string, string>) {
  const baseDir = args.out ?? 'results';
  const editionId = args.edition;
  if (!editionId) {
    console.log('--edition é obrigatório para report. Ver --help.');
    process.exit(1);
  }
  const dir = join(baseDir, editionId);
  if (!existsSync(dir)) {
    console.log(`edição sem artefatos em ${dir}`);
    process.exit(1);
  }

  const results: EvaluationResult[] = [];
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.json') || file.endsWith('.raw.jsonl')) continue;
    const path = join(dir, file);
    results.push(JSON.parse(readFileSync(path, 'utf8')) as EvaluationResult);
  }

  if (args.enade === 'true' || args.enade === undefined) {
    const concept = computeEnadeConcept(results, editionId);
    if (concept) {
      console.log(
        `Conceito Enade (${editionId}): nível ${concept.level} — ${concept.approvedCount}/${concept.totalCount} aprovados (${(concept.approvedRate * 100).toFixed(1)}%, corte ${(concept.cutoffScore * 100).toFixed(1)}%)`,
      );
    } else {
      console.log(`Conceito Enade (${editionId}): não disponível (nenhum modelo avaliado).`);
    }
  }

  if (args['consensus-errors'] === 'true') {
    const errors = findConsensusErrors(results, editionId, {
      minFailingCount: Number(args['min-failing-count'] ?? 3),
      minFailingRate: Number(args['min-failing-rate'] ?? 0.8),
    });
    console.log(`\nErros de consenso em ${editionId}: ${errors.length} questão(ões).`);
    for (const err of errors.slice(0, Number(args.limit ?? 20))) {
      console.log(
        `  Q${String(err.questionNumber).padStart(3, '0')} (${err.questionId}): ${err.failingCount} reprovaram → ${err.consensusDistractor} (${(err.failingRate * 100).toFixed(0)}% dos reprovados); gabarito ${err.correctAnswer}`,
      );
    }
  }
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);

  if (args.help || !command) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }

  const needsProvider = command === 'smoke' || command === 'eval';
  if (needsProvider && (!args.backend || !args.model)) {
    console.log('--backend e --model são obrigatórios. Use --help para detalhes.');
    process.exit(1);
  }

  if (command === 'smoke') {
    await runSmoke(args);
  } else if (command === 'eval') {
    await runEval(args);
  } else if (command === 'rescore') {
    runRescore(args);
  } else if (command === 'report') {
    runReport(args);
  } else {
    console.log(`comando desconhecido: ${command}. Use 'smoke', 'eval', 'rescore' ou 'report'.`);
    printUsage();
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
