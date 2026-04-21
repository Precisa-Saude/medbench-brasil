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
  const [lo, hi] = parsed.ci95 ?? [NaN, NaN];
  return {
    accuracy: Number(parsed.accuracy),
    ci95: [Number(lo), Number(hi)],
    modelId: parsed.modelId,
    total: Number(parsed.total ?? (parsed.perQuestion?.length ?? 0) * (parsed.runsPerQuestion ?? 1)),
  };
}

const oldR = load(oldPath);
const newR = load(newPath);

const pct = (x) => `${(x * 100).toFixed(1)}%`;
const inside = newR.accuracy >= oldR.ci95[0] && newR.accuracy <= oldR.ci95[1];
const delta = (newR.accuracy - oldR.accuracy) * 100;

console.log(`modelo: ${oldR.modelId} (antigo) vs ${newR.modelId} (novo)`);
console.log(`antigo: accuracy=${pct(oldR.accuracy)} ic95=[${pct(oldR.ci95[0])}, ${pct(oldR.ci95[1])}] n=${oldR.total}`);
console.log(`novo:   accuracy=${pct(newR.accuracy)} ic95=[${pct(newR.ci95[0])}, ${pct(newR.ci95[1])}] n=${newR.total}`);
console.log(`delta:  ${delta >= 0 ? '+' : ''}${delta.toFixed(1)}pp ${inside ? '(dentro do IC95 antigo)' : '(FORA do IC95 antigo)'}`);

process.exit(inside ? 0 : 1);
