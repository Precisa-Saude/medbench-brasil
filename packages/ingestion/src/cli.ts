#!/usr/bin/env node
/* eslint-disable no-console */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { downloadPdf } from './downloader.js';
import { extractPdfText } from './extractor.js';
import { parseEdition } from './parser.js';

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

function usage(): never {
  console.log(`uso:
  medbench-ingest download --edition revalida-2025-1 --prova <url> --gabarito <url>
  medbench-ingest extract  --edition revalida-2025-1
    (lê scripts/data/raw/revalida-2025-1/{prova.pdf,gabarito-definitivo.pdf},
     chama o parser Claude e escreve packages/dataset/data/revalida/2025-1.json)`);
  process.exit(1);
}

async function cmdDownload(args: Record<string, string>) {
  const edition = args.edition;
  const provaUrl = args.prova;
  const gabaritoUrl = args.gabarito;
  if (!edition || !provaUrl || !gabaritoUrl) usage();

  const outDir = join(process.cwd(), 'scripts', 'data', 'raw', edition);
  console.log(`baixando prova ${edition}…`);
  const prova = await downloadPdf(provaUrl, outDir, 'prova.pdf');
  console.log(
    `  → ${prova.filename} (${(prova.sizeBytes / 1024).toFixed(1)} KB, sha256 ${prova.sha256.slice(0, 8)}…)`,
  );

  console.log(`baixando gabarito definitivo ${edition}…`);
  const gab = await downloadPdf(gabaritoUrl, outDir, 'gabarito-definitivo.pdf');
  console.log(
    `  → ${gab.filename} (${(gab.sizeBytes / 1024).toFixed(1)} KB, sha256 ${gab.sha256.slice(0, 8)}…)`,
  );
}

async function cmdExtract(args: Record<string, string>) {
  const edition = args.edition;
  if (!edition) usage();

  const rawDir = join(process.cwd(), 'scripts', 'data', 'raw', edition);
  const provaPath = join(rawDir, 'prova.pdf');
  const gabaritoPath = join(rawDir, 'gabarito-definitivo.pdf');

  console.log(`extraindo texto de ${edition}…`);
  const provaBuf = readFileSync(provaPath);
  const gabaritoBuf = readFileSync(gabaritoPath);
  const [prova, gabarito] = await Promise.all([
    extractPdfText(provaBuf),
    extractPdfText(gabaritoBuf),
  ]);
  console.log(`  prova:    ${prova.pages} páginas, ${prova.text.length} caracteres`);
  console.log(`  gabarito: ${gabarito.pages} páginas, ${gabarito.text.length} caracteres`);

  console.log(`chamando Claude para estruturar questões…`);
  const parsed = await parseEdition({
    editionId: edition,
    gabaritoText: gabarito.text,
    model: args.model,
    provaText: prova.text,
  });
  console.log(
    `  → ${parsed.questions.length} questões extraídas, ${parsed.warnings.length} warnings`,
  );
  for (const w of parsed.warnings) console.log(`    [warn]${w}`);

  const editionSlug = edition.replace(/^revalida-/, '');
  const outPath = join(
    process.cwd(),
    'packages',
    'dataset',
    'data',
    'revalida',
    `${editionSlug}.json`,
  );
  const existing = safeReadJson(outPath) ?? {};
  const output = {
    ...existing,
    cutoffScore: existing.cutoffScore ?? 0.6,
    id: edition,
    passRate: existing.passRate ?? 0.18,
    publishedAt: existing.publishedAt ?? new Date().toISOString().slice(0, 10),
    questions: parsed.questions,
    source:
      existing.source ??
      'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/revalida/provas-e-gabaritos',
    year: existing.year ?? Number(editionSlug.split('-')[0]),
  };
  writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`gravado em ${outPath}`);
}

function safeReadJson(path: string): Record<string, unknown> | null {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);

  if (command === 'download') await cmdDownload(args);
  else if (command === 'extract') await cmdExtract(args);
  else usage();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
