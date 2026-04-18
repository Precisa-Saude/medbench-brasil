import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface DownloadManifest {
  downloadedAt: string;
  filename: string;
  sha256: string;
  sizeBytes: number;
  url: string;
}

/**
 * Baixa um PDF de uma URL pública e grava em `<outDir>/<filename>` junto com
 * um manifest.json contendo URL origem, SHA-256 e timestamp para auditoria.
 */
export async function downloadPdf(
  url: string,
  outDir: string,
  filename: string,
): Promise<DownloadManifest> {
  mkdirSync(outDir, { recursive: true });

  // Node.js fetch não confia na cadeia de certificados ICP-Brasil usada por
  // download.inep.gov.br por padrão. Usamos curl (que usa o trust store do
  // sistema) para garantir portabilidade e reprodutibilidade.
  const filePath = join(outDir, filename);
  try {
    execFileSync('curl', ['-sSL', '-A', 'Mozilla/5.0', '-o', filePath, url], {
      stdio: ['ignore', 'ignore', 'pipe'],
    });
  } catch (err) {
    throw new Error(`Download falhou: ${url}`, { cause: err });
  }
  const buffer = readFileSync(filePath);
  if (buffer.length === 0) {
    throw new Error(`Download vazio: ${url}`);
  }

  const sha256 = createHash('sha256').update(buffer).digest('hex');

  const manifest: DownloadManifest = {
    downloadedAt: new Date().toISOString(),
    filename,
    sha256,
    sizeBytes: buffer.length,
    url,
  };

  const manifestPath = join(outDir, 'manifest.json');
  const existing = readManifest(manifestPath);
  existing[filename] = manifest;
  writeFileSync(manifestPath, `${JSON.stringify(existing, null, 2)}\n`);

  return manifest;
}

function readManifest(path: string): Record<string, DownloadManifest> {
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Record<string, DownloadManifest>;
  } catch {
    return {};
  }
}
