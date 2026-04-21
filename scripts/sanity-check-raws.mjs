#!/usr/bin/env node
// Sanity check: para cada `<edition>/<model>.json` em results/, exige que
// `<edition>/<model>.raw.jsonl` exista e tenha exatamente
// `perQuestion.length × runsPerQuestion` linhas não-vazias.
//
// ADR-0002 exige que toda run publicada tenha raw log re-scoreável. Sem
// o raw, a run não é auditável. Este check trava o invariant no CI.
//
// Uso:
//   node scripts/sanity-check-raws.mjs              # falha ao primeiro erro agregado
//   node scripts/sanity-check-raws.mjs results/     # diretório custom
//   node scripts/sanity-check-raws.mjs --allow-missing-raw results/   # apenas line-count
//
// Exit codes:
//   0 — todos os pares ok
//   1 — algum par com raw ausente ou contagem divergente

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const allowMissing = args.includes('--allow-missing-raw');
const baseDir = args.find((a) => !a.startsWith('--')) ?? 'results';

function listEditions(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

function listScoredJsons(editionDir) {
  return readdirSync(editionDir)
    .filter((f) => f.endsWith('.json') && !f.endsWith('.raw.jsonl'))
    .sort();
}

function countJsonlLines(path) {
  const txt = readFileSync(path, 'utf8');
  let count = 0;
  for (const line of txt.split('\n')) {
    if (line.trim().length > 0) count += 1;
  }
  return count;
}

let problems = 0;
let ok = 0;

try {
  statSync(baseDir);
} catch {
  console.error(`[sanity-check-raws] diretório não encontrado: ${baseDir}`);
  process.exit(1);
}

for (const edition of listEditions(baseDir)) {
  const editionDir = join(baseDir, edition);
  for (const jsonFile of listScoredJsons(editionDir)) {
    const jsonPath = join(editionDir, jsonFile);
    const slug = jsonFile.replace(/\.json$/, '');
    const rawPath = join(editionDir, `${slug}.raw.jsonl`);
    let parsed;
    try {
      parsed = JSON.parse(readFileSync(jsonPath, 'utf8'));
    } catch (err) {
      console.error(`[FAIL] ${edition}/${jsonFile}: JSON inválido — ${err.message}`);
      problems += 1;
      continue;
    }

    const perQuestion = Array.isArray(parsed.perQuestion) ? parsed.perQuestion.length : 0;
    const runsPerQuestion = Number(parsed.runsPerQuestion ?? 0);
    const expected = perQuestion * runsPerQuestion;
    if (expected === 0) {
      console.error(
        `[FAIL] ${edition}/${jsonFile}: perQuestion=${perQuestion} runsPerQuestion=${runsPerQuestion} — esperado > 0`,
      );
      problems += 1;
      continue;
    }

    let rawExists = false;
    try {
      statSync(rawPath);
      rawExists = true;
    } catch {
      /* missing */
    }

    if (!rawExists) {
      if (allowMissing) {
        console.warn(`[warn] ${edition}/${slug}.raw.jsonl ausente (--allow-missing-raw)`);
        continue;
      }
      console.error(`[FAIL] ${edition}/${slug}.raw.jsonl ausente (esperado ${expected} linhas)`);
      problems += 1;
      continue;
    }

    const rawLines = countJsonlLines(rawPath);
    if (rawLines !== expected) {
      console.error(
        `[FAIL] ${edition}/${slug}.raw.jsonl: ${rawLines} linhas, esperado ${expected} (perQuestion=${perQuestion} × runs=${runsPerQuestion})`,
      );
      problems += 1;
      continue;
    }
    ok += 1;
  }
}

if (problems > 0) {
  console.error(`\n[sanity-check-raws] ${problems} problema(s), ${ok} ok. Falhou.`);
  process.exit(1);
}
console.log(`[sanity-check-raws] ${ok} pares ok em ${baseDir}/.`);
