#!/usr/bin/env node
/**
 * Recomputa o resumo de uma avaliação a partir do raw.jsonl correspondente,
 * usando o parser atual. Útil quando o parser (ou outra etapa do scorer) foi
 * corrigido e queremos reaproveitar o log bruto sem gastar nova chamada de API.
 *
 * Uso:
 *   node scripts/rescore.mjs <edition> <modelSlug>
 *   node scripts/rescore.mjs revalida-2025-1 gpt-5.4
 *   node scripts/rescore.mjs --all                 # todos os raw.jsonl
 *
 * Sobrescreve results/<edition>/<modelSlug>.json. Imprime diff (correct old -> new).
 */
/* eslint-disable no-console */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadEdition } from '@precisa-saude/medbench-dataset';

// Raiz do repositório (saímos de packages/eval-harness/scripts/).
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const distPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'index.js');
if (!existsSync(distPath)) {
  console.error(
    `dist/ ausente em packages/eval-harness/. Rode:\n` +
      `  pnpm --filter @precisa-saude/medbench-harness build\n`,
  );
  process.exit(1);
}
const { parseLetter, scoreRun } = await import(distPath);

function rescoreOne(edition, slug) {
  const resultsDir = join(root, 'results', edition);
  const summaryPath = join(resultsDir, `${slug}.json`);
  const rawPath = join(resultsDir, `${slug}.raw.jsonl`);

  if (!existsSync(rawPath)) {
    console.log(`SKIP ${edition}/${slug}: sem raw.jsonl`);
    return;
  }
  const summaryBefore = existsSync(summaryPath)
    ? JSON.parse(readFileSync(summaryPath, 'utf8'))
    : null;

  // Carrega edição e monta mapa id -> Question.
  const ed = loadEdition(edition);
  const byId = new Map(ed.questions.map((q) => [q.id, q]));

  // Contamination é uniforme por edição (calculada uma vez com o cutoff do
  // modelo). O raw.jsonl não persiste o cutoff, então recuperamos a
  // classificação do resumo antigo — se não houver perQuestion preenchido,
  // caímos para 'unknown' e os buckets clean/contaminated ficam null (o que
  // é detectável no audit).
  const contamination = summaryBefore?.perQuestion?.[0]?.contamination ?? 'unknown';
  if (contamination === 'unknown' && !summaryBefore?.perQuestion?.length) {
    console.warn(
      `  [warn] ${edition}/${slug}: resumo antigo sem perQuestion — contamination caindo para 'unknown'. ` +
        'Rode eval completo para obter contaminationSplit correto.',
    );
  }

  // Carrega raw, re-parseia, recomputa correct.
  const lines = readFileSync(rawPath, 'utf8').split('\n').filter((l) => l.trim());
  const records = [];
  let reparsedDiffs = 0;
  for (const line of lines) {
    const rec = JSON.parse(line);
    const question = byId.get(rec.questionId);
    if (!question) {
      console.warn(`  [warn] raw menciona questão desconhecida: ${rec.questionId}`);
      continue;
    }
    const parsed = parseLetter(rec.rawResponse);
    const correct = parsed === question.correct;
    if (parsed !== rec.parsed) reparsedDiffs += 1;
    records.push({
      contamination,
      correct,
      parsed,
      question,
    });
  }

  // runsPerQuestion: o raw tem run=1..N por questão; infere do total.
  // Guarda para records vazio (todos os questionIds desconhecidos): evita
  // Math.max(...[]) = -Infinity que quebraria scoreRun silenciosamente.
  if (records.length === 0) {
    console.warn(`  [warn] ${edition}/${slug}: 0 records após parse — skipping.`);
    return;
  }
  const runsPerQ = records.reduce((m, r) => {
    const k = r.question.id;
    m.set(k, (m.get(k) ?? 0) + 1);
    return m;
  }, new Map());
  const counts = [...runsPerQ.values()];
  const minRuns = Math.min(...counts);
  const maxRuns = Math.max(...counts);
  if (minRuns !== maxRuns) {
    console.warn(
      `  [warn] ${edition}/${slug}: runs por questão não uniforme (${minRuns}..${maxRuns}) — ` +
        `usando max, mas accuracy do scoreRun assume uniformidade. Considere --restart do eval.`,
    );
  }
  const runsPerQuestion = maxRuns;
  const modelId = lines[0] ? JSON.parse(lines[0]).modelId : slug;

  const summary = scoreRun(modelId, runsPerQuestion, records);
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + '\n');

  const before = summaryBefore
    ? `${summaryBefore.correct}/${summaryBefore.total} (${(summaryBefore.accuracy * 100).toFixed(1)}%)`
    : 'N/A';
  const after = `${summary.correct}/${summary.total} (${(summary.accuracy * 100).toFixed(1)}%)`;
  console.log(
    `RESCORED ${edition}/${slug}: ${before} -> ${after}  [${reparsedDiffs} parses alteradas]`,
  );
}

function findAllRawSlugs() {
  const resultsRoot = join(root, 'results');
  const out = [];
  for (const entry of readdirSync(resultsRoot)) {
    const dir = join(resultsRoot, entry);
    // results/ pode conter arquivos diretamente (ex.: README) além dos
    // subdiretórios por edição — pula se não for diretório.
    if (!statSync(dir).isDirectory()) continue;
    for (const f of readdirSync(dir)) {
      if (f.endsWith('.raw.jsonl')) out.push([entry, f.replace(/\.raw\.jsonl$/, '')]);
    }
  }
  return out;
}

const args = process.argv.slice(2);
if (args[0] === '--all') {
  for (const [ed, slug] of findAllRawSlugs()) rescoreOne(ed, slug);
} else if (args.length === 2) {
  rescoreOne(args[0], args[1]);
} else {
  console.error(
    'uso: node scripts/rescore.mjs <edition> <modelSlug>  |  node scripts/rescore.mjs --all',
  );
  process.exit(1);
}
