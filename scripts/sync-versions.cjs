#!/usr/bin/env node

/**
 * Sincroniza a versão do root package.json para todos os pacotes
 * publicáveis do workspace. Chamado pelo semantic-release via
 * @semantic-release/exec no prepareCmd.
 *
 * A lista de pacotes vem de `scripts/list-publishable-packages.cjs` —
 * mesma fonte usada pelo `@semantic-release/git assets` em `.releaserc.cjs`,
 * garantindo que não há drift entre o que é sincronizado e o que é
 * stageado no commit chore(release).
 */

const { readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { listPublishablePackages } = require('./list-publishable-packages.cjs');

const rootPkg = JSON.parse(readFileSync('package.json', 'utf-8'));
const version = rootPkg.version;

for (const dir of listPublishablePackages()) {
  const pkgPath = join(dir, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  pkg.version = version;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`${pkg.name}@${version}`);
}
