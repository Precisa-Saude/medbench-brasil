import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Edition, EditionId, ExamFamily } from './types.js';
import { EXAM_FAMILIES, examFamilyOf } from './types.js';

function dataDirFor(family: ExamFamily): string {
  return join(fileURLToPath(new URL(`../data/${family}/`, import.meta.url)));
}

export function listEditions(): EditionId[] {
  const ids: EditionId[] = [];
  for (const family of EXAM_FAMILIES) {
    const dir = dataDirFor(family);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.json')) continue;
      ids.push(`${family}-${f.replace(/\.json$/, '')}` as EditionId);
    }
  }
  return ids.sort();
}

export function loadEdition(id: EditionId): Edition {
  const family = examFamilyOf(id);
  const slug = id.slice(family.length + 1);
  const raw = readFileSync(join(dataDirFor(family), `${slug}.json`), 'utf8');
  return JSON.parse(raw) as Edition;
}

export function loadAll(): Edition[] {
  return listEditions().map(loadEdition);
}
