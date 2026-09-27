#!/usr/bin/env node
/* eslint-disable no-console */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { EditionId, ExamFamily } from '@precisa-saude/medbench-dataset';
import { examFamilyOf } from '@precisa-saude/medbench-dataset';

import { gabaritoFilename, parseAnswerKeyStatus, resolveAnswerKey } from './answer-key.js';
import { downloadPdf } from './downloader.js';
import { extractPdfText } from './extractor.js';
import { parseEdition } from './parser.js';

const INEP_SOURCE_BY_FAMILY: Record<ExamFamily, string> = {
  enamed: 'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enamed',
  revalida:
    'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/revalida/provas-e-gabaritos',
};

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
  medbench-ingest download --edition <revalida-YYYY-N|enamed-YYYY> --prova <url> --gabarito <url>
                           [--gabarito-status preliminar|definitivo]
    (--gabarito-status default: definitivo. Use "preliminar" para o gabarito
     pré-recurso, que grava gabarito-preliminar.pdf e marca a edição como
     provisória — reprocessar com rescore --from-raw quando sair o definitivo)
  medbench-ingest extract  --edition <revalida-YYYY-N|enamed-YYYY>
                           [--backend bedrock|anthropic-api] [--model <id>] [--region sa-east-1]
    (lê scripts/data/raw/<edition>/prova.pdf e o gabarito disponível
     — prefere gabarito-definitivo.pdf, cai para gabarito-preliminar.pdf —
     chama Claude (Bedrock por padrão) e escreve
     packages/dataset/data/<família>/<slug>.json)`);
  process.exit(1);
}

async function cmdDownload(args: Record<string, string>) {
  const edition = args.edition;
  const provaUrl = args.prova;
  const gabaritoUrl = args.gabarito;
  if (!edition || !provaUrl || !gabaritoUrl) usage();

  const status = parseAnswerKeyStatus(args['gabarito-status']);
  const outDir = join(process.cwd(), 'scripts', 'data', 'raw', edition);
  console.log(`baixando prova ${edition}…`);
  const prova = await downloadPdf(provaUrl, outDir, 'prova.pdf');
  console.log(
    `  → ${prova.filename} (${(prova.sizeBytes / 1024).toFixed(1)} KB, sha256 ${prova.sha256.slice(0, 8)}…)`,
  );

  console.log(`baixando gabarito ${status} ${edition}…`);
  const gab = await downloadPdf(gabaritoUrl, outDir, gabaritoFilename(status));
  console.log(
    `  → ${gab.filename} (${(gab.sizeBytes / 1024).toFixed(1)} KB, sha256 ${gab.sha256.slice(0, 8)}…)`,
  );
}

async function cmdExtract(args: Record<string, string>) {
  const edition = args.edition;
  if (!edition) usage();

  const rawDir = join(process.cwd(), 'scripts', 'data', 'raw', edition);
  const provaPath = join(rawDir, 'prova.pdf');
  const answerKey = resolveAnswerKey((filename) => existsSync(join(rawDir, filename)));
  const gabaritoPath = join(rawDir, answerKey.filename);

  console.log(`extraindo texto de ${edition} (gabarito ${answerKey.status})…`);
  const provaBuf = readRawPdf(provaPath, edition);
  const gabaritoBuf = readRawPdf(gabaritoPath, edition);
  const [prova, gabarito] = await Promise.all([
    extractPdfText(provaBuf),
    extractPdfText(gabaritoBuf),
  ]);
  console.log(`  prova:    ${prova.pages} páginas, ${prova.text.length} caracteres`);
  console.log(`  gabarito: ${gabarito.pages} páginas, ${gabarito.text.length} caracteres`);

  const backend = (args.backend as 'bedrock' | 'anthropic-api' | undefined) ?? 'bedrock';
  console.log(`chamando Claude via ${backend} para estruturar questões…`);
  const parsed = await parseEdition({
    backend,
    editionId: edition,
    gabaritoText: gabarito.text,
    model: args.model,
    provaText: prova.text,
    region: args.region,
  });
  console.log(
    `  → ${parsed.questions.length} questões extraídas, ${parsed.warnings.length} warnings`,
  );
  for (const w of parsed.warnings) console.log(`    [warn]${w}`);

  const family = examFamilyOf(edition as EditionId);
  const editionSlug = edition.slice(family.length + 1);
  const outPath = join(process.cwd(), 'packages', 'dataset', 'data', family, `${editionSlug}.json`);
  const existing = safeReadJson(outPath) ?? {};
  // `cutoffScore` e `passRate` NÃO recebem default: são valores oficiais da
  // INEP e um chute plausível aqui viraria eixo de gráfico e número citado.
  // Ficam ausentes até alguém preencher com fonte (ver Edition no dataset).
  const output = {
    ...existing,
    answerKeyStatus: answerKey.status,
    id: edition,
    publishedAt: existing.publishedAt ?? new Date().toISOString().slice(0, 10),
    questions: parsed.questions,
    source: existing.source ?? INEP_SOURCE_BY_FAMILY[family],
    year: existing.year ?? Number(editionSlug.split('-')[0]),
  };
  writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`gravado em ${outPath}`);
}

/**
 * Lê um PDF bruto da edição com erro acionável.
 *
 * `download` e `extract` são passos separados, então rodar `extract` antes do
 * download é um erro de uso plausível — e o ENOENT cru não diz o que fazer.
 * O gabarito já ganha mensagem explícita do `resolveAnswerKey`; isto fecha a
 * assimetria para a prova.
 */
function readRawPdf(path: string, edition: string): Buffer {
  try {
    return readFileSync(path);
  } catch (cause) {
    throw new Error(
      `não foi possível ler ${path} — rode "medbench-ingest download --edition ${edition} --prova <url> --gabarito <url>" antes do extract`,
      { cause },
    );
  }
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
