#!/usr/bin/env node

/**
 * Syncs the root package.json version to all publishable workspace packages.
 * Called by semantic-release via @semantic-release/exec before committing.
 *
 * Descobre pacotes dinamicamente iterando `packages/*` e lendo cada
 * package.json — filtra os que têm `"private": true` (não publicáveis,
 * ex.: packages/ingestion). Evita precisar atualizar este script cada
 * vez que um novo pacote é adicionado.
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const rootPkg = JSON.parse(readFileSync('package.json', 'utf-8'));
const version = rootPkg.version;

const packagesDir = 'packages';
const entries = readdirSync(packagesDir)
  .map((name) => join(packagesDir, name))
  .filter((p) => statSync(p).isDirectory());

for (const dir of entries) {
  const pkgPath = join(dir, 'package.json');
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  } catch {
    // diretório sem package.json — ignora
    continue;
  }
  if (pkg.private === true) {
    console.log(`skip ${pkg.name} (private)`);
    continue;
  }
  pkg.version = version;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`${pkg.name}@${version}`);
}
