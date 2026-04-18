import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Edition, EditionId } from './types.js';

const dataDir = join(fileURLToPath(new URL('../data/revalida/', import.meta.url)));

function slugToId(filename: string): EditionId {
  return `revalida-${filename.replace(/\.json$/, '')}` as EditionId;
}

export function listEditions(): EditionId[] {
  return readdirSync(dataDir)
    .filter((f) => f.endsWith('.json'))
    .map(slugToId)
    .sort();
}

export function loadEdition(id: EditionId): Edition {
  const slug = id.replace(/^revalida-/, '');
  const raw = readFileSync(join(dataDir, `${slug}.json`), 'utf8');
  return JSON.parse(raw) as Edition;
}

export function loadAll(): Edition[] {
  return listEditions().map(loadEdition);
}
