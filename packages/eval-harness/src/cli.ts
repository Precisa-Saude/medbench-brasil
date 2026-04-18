#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { anthropicProvider } from './providers/anthropic.js';
import { googleProvider } from './providers/google.js';
import { openAiProvider } from './providers/openai.js';
import { openAiCompatProvider } from './providers/openai-compat.js';
import { runEvaluation } from './runner.js';
import type { Provider } from './types.js';

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

type Backend = 'anthropic' | 'openai' | 'google' | 'ollama';

function buildProvider(backend: Backend, args: Record<string, string>): Provider {
  const model = args.model;
  if (!model) {
    throw new Error('--model é obrigatório');
  }
  const cutoff = args.cutoff;
  const label = args.label;

  switch (backend) {
    case 'anthropic':
      return anthropicProvider({ label, model, trainingCutoff: cutoff });
    case 'openai':
      return openAiProvider({ label, model, trainingCutoff: cutoff });
    case 'google':
      return googleProvider({ label, model, trainingCutoff: cutoff });
    case 'ollama':
      return openAiCompatProvider({
        baseUrl: args.baseUrl ?? 'http://localhost:11434/v1',
        label,
        model,
        provider: 'Ollama',
        trainingCutoff: cutoff,
      });
    default:
      throw new Error(`backend inválido: ${backend}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.model || !args.backend) {
    // eslint-disable-next-line no-console
    console.log(
      `uso: medbench --backend <anthropic|openai|google|ollama> --model <id>
              [--edition revalida-2025-1] [--runs 3] [--cutoff YYYY-MM-DD]
              [--label "Display Name"] [--baseUrl http://...] [--out results/]`,
    );
    process.exit(args.help ? 0 : 1);
  }

  const backend = args.backend as Backend;
  const provider = buildProvider(backend, args);

  // eslint-disable-next-line no-console
  console.log(
    `avaliando ${provider.label} via ${provider.provider} em ${args.edition ?? 'revalida-2025-1'}…`,
  );
  const defaultConcurrency = backend === 'ollama' ? 1 : 10;
  const concurrency = args.concurrency ? Number(args.concurrency) : defaultConcurrency;
  const result = await runEvaluation(provider, {
    concurrency,
    editions: [args.edition ?? 'revalida-2025-1'],
    excludeImages: true,
    excludeTables: true,
    runsPerQuestion: Number(args.runs ?? 3),
  });

  const outDir = args.out ?? 'results';
  mkdirSync(outDir, { recursive: true });
  const slug = provider.id.replace(/[^a-z0-9.-]/gi, '_');
  const outPath = join(outDir, `${slug}.json`);
  writeFileSync(outPath, JSON.stringify(result, null, 2));
  // eslint-disable-next-line no-console
  console.log(
    `resultado salvo em ${outPath} (acurácia ${(result.accuracy * 100).toFixed(1)}%, IC ${(result.ci95[0] * 100).toFixed(1)}–${(result.ci95[1] * 100).toFixed(1)}%)`,
  );
}

main().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
