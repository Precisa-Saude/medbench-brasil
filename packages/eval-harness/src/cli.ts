#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { anthropicProvider } from './providers/anthropic.js';
import { runEvaluation } from './runner.js';

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg?.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        out[key] = next;
        i++;
      } else {
        out[key] = 'true';
      }
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.model) {
    // eslint-disable-next-line no-console
    console.log(
      'uso: medbench --model <id> --edition <revalida-AAAA-N> [--runs 3] [--cutoff YYYY-MM-DD]',
    );
    process.exit(args.help ? 0 : 1);
  }

  const provider = anthropicProvider({
    model: args.model,
    trainingCutoff: args.cutoff,
  });

  const result = await runEvaluation(provider, {
    editions: [args.edition ?? 'revalida-2025-1'],
    excludeImages: true,
    excludeTables: true,
    runsPerQuestion: Number(args.runs ?? 3),
  });

  mkdirSync('results', { recursive: true });
  const outPath = join('results', `${provider.id}.json`);
  writeFileSync(outPath, JSON.stringify(result, null, 2));
  // eslint-disable-next-line no-console
  console.log(`resultado salvo em ${outPath} (acurácia ${(result.accuracy * 100).toFixed(1)}%)`);
}

main().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
