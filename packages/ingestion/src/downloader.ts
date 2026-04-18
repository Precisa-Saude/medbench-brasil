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

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Download falhou (${res.status}): ${url}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());

  const sha256 = createHash('sha256').update(buffer).digest('hex');
  writeFileSync(join(outDir, filename), buffer);

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
