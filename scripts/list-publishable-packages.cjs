/**
 * Enumera diretórios em `packages/` que contêm `package.json` e não são
 * marcados como `"private": true`. Fonte única para `scripts/sync-versions.cjs`
 * e `.releaserc.cjs` — evita drift entre a lista de pacotes sincronizados
 * pelo sync-versions e os assets stageados pelo @semantic-release/git.
 *
 * Retorna caminhos relativos ao CWD (ex.: ['packages/dataset',
 * 'packages/eval-harness']). Se o diretório `packages/` não existe ou está
 * vazio, retorna lista vazia — nunca lança.
 */

const { readdirSync, readFileSync, statSync } = require('node:fs');
const { join } = require('node:path');

function listPublishablePackages() {
  const packagesDir = 'packages';
  let entries;
  try {
    entries = readdirSync(packagesDir);
  } catch {
    return [];
  }

  const out = [];
  for (const name of entries) {
    const dir = join(packagesDir, name);
    try {
      if (!statSync(dir).isDirectory()) continue;
      const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf-8'));
      if (pkg.private === true) continue;
      out.push(dir);
    } catch {
      // diretório sem package.json ou com JSON inválido — ignora
    }
  }
  return out;
}

module.exports = { listPublishablePackages };
