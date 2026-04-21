#!/usr/bin/env node
// Compara accuracy agregada de dois artefatos `.json` do harness e indica
// se a nova run cai dentro do IC95 da run antiga.
//
// Contexto: para backfill de `raw.jsonl` ausente (PRE-194) precisamos
// re-rodar o modelo. A nova run é não-determinística e gera um novo
// `.json` com accuracy ligeiramente diferente. O critério de aceite é
// que a nova accuracy permaneça dentro do IC95 do `.json` antigo — do
// contrário há suspeita de deriva do provider e a substituição deve ser
// bloqueada.
//
// Uso:
//   node scripts/diff-accuracy-ic95.mjs <antigo.json> <novo.json>
//
// Exit codes:
//   0 — dentro do IC95
//   1 — fora do IC95 ou erro

import { readFileSync } from 'node:fs';

const [oldPath, newPath] = process.argv.slice(2);

if (!oldPath || !newPath) {
  console.error('Uso: diff-accuracy-ic95.mjs <antigo.json> <novo.json>');
  process.exit(1);
}

function load(path) {
  const parsed = JSON.parse(readFileSync(path, 'utf8'));
  if (!Array.isArray(parsed.ci95) || parsed.ci95.length !== 2) {
    throw new Error(`${path}: campo ci95 ausente ou malformado (esperado [lo, hi])`);
  }
  const [lo, hi] = parsed.ci95;
  if (!Number.isFinite(Number(lo)) || !Number.isFinite(Number(hi))) {
    throw new Error(`${path}: ci95 contém valor não-numérico: [${lo}, ${hi}]`);
  }
  if (!Number.isFinite(Number(parsed.accuracy))) {
    throw new Error(`${path}: accuracy ausente ou não-numérico`);
  }
  // total é só display (n=... na saída). Preferimos o campo explícito; se
  // faltar, tentamos perQuestion × runsPerQuestion; se nem isso for calculável,
  // caímos para null → render como "?". Melhor que zero silencioso.
  let total = Number.isFinite(Number(parsed.total)) ? Number(parsed.total) : null;
  if (total === null) {
    const rpq = Number(parsed.runsPerQuestion);
    const pq = Array.isArray(parsed.perQuestion) ? parsed.perQuestion.length : 0;
    if (Number.isFinite(rpq) && rpq > 0 && pq > 0) {
      total = pq * rpq;
    }
  }
  return {
    accuracy: Number(parsed.accuracy),
    ci95: [Number(lo), Number(hi)],
    modelId: parsed.modelId,
    total,
  };
}

let oldR;
let newR;
try {
  oldR = load(oldPath);
  newR = load(newPath);
} catch (err) {
  console.error(`[diff-accuracy-ic95] ${err.message}`);
  process.exit(1);
}

const pct = (x) => `${(x * 100).toFixed(1)}%`;
const inside = newR.accuracy >= oldR.ci95[0] && newR.accuracy <= oldR.ci95[1];
const delta = (newR.accuracy - oldR.accuracy) * 100;

console.log(`modelo: ${oldR.modelId} (antigo) vs ${newR.modelId} (novo)`);
const n = (t) => (t === null ? '?' : String(t));
console.log(`antigo: accuracy=${pct(oldR.accuracy)} ic95=[${pct(oldR.ci95[0])}, ${pct(oldR.ci95[1])}] n=${n(oldR.total)}`);
console.log(`novo:   accuracy=${pct(newR.accuracy)} ic95=[${pct(newR.ci95[0])}, ${pct(newR.ci95[1])}] n=${n(newR.total)}`);
console.log(`delta:  ${delta >= 0 ? '+' : ''}${delta.toFixed(1)}pp ${inside ? '(dentro do IC95 antigo)' : '(FORA do IC95 antigo)'}`);

process.exit(inside ? 0 : 1);
