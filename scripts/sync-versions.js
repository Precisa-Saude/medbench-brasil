#!/usr/bin/env node

/**
 * Sincroniza a versão do root package.json para todos os pacotes do workspace.
 * Chamado pelo semantic-release via @semantic-release/exec antes do commit de release.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const rootPkg = JSON.parse(readFileSync('package.json', 'utf-8'));
const version = rootPkg.version;

// `ingestion` é private: true — versionamos junto para manter o workspace
// coerente, mas o workflow de publish só sobe os pacotes públicos.
const packages = ['packages/dataset', 'packages/eval-harness', 'packages/ingestion'];

for (const dir of packages) {
  const pkgPath = join(dir, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  pkg.version = version;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`${pkg.name}@${version}`);
}
