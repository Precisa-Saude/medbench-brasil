#!/usr/bin/env node

/**
 * Syncs the root package.json version to all publishable workspace packages.
 * Called by semantic-release via @semantic-release/exec before committing.
 *
 * Only packages without `"private": true` are synced — private packages
 * (e.g. packages/ingestion) keep their own version and are not published.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const rootPkg = JSON.parse(readFileSync('package.json', 'utf-8'));
const version = rootPkg.version;

const packages = ['packages/dataset', 'packages/eval-harness'];

for (const dir of packages) {
  const pkgPath = join(dir, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  pkg.version = version;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`${pkg.name}@${version}`);
}
