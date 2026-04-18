import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { downloadPdf } from '../src/downloader.js';

describe('downloadPdf', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'medbench-ingest-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('baixa, calcula SHA-256 e grava manifest', async () => {
    const fakeBuffer = new TextEncoder().encode('%PDF-1.4 conteúdo de teste');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(fakeBuffer.buffer),
      }),
    );

    const manifest = await downloadPdf('https://example.com/fake.pdf', tempDir, 'fake.pdf');

    expect(manifest.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(manifest.sizeBytes).toBe(fakeBuffer.byteLength);
    expect(existsSync(join(tempDir, 'fake.pdf'))).toBe(true);

    const manifestJson = JSON.parse(readFileSync(join(tempDir, 'manifest.json'), 'utf8'));
    expect(manifestJson['fake.pdf']).toMatchObject({ url: 'https://example.com/fake.pdf' });
  });

  it('lança erro claro em HTTP não-ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404, arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)) }),
    );
    await expect(downloadPdf('https://example.com/missing.pdf', tempDir, 'x.pdf')).rejects.toThrow(
      /Download falhou \(404\)/,
    );
  });
});
