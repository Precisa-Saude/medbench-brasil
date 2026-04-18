import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const execFileSyncMock = vi.hoisted(() => vi.fn());

vi.mock('node:child_process', async () => {
  const actual = await vi.importActual<typeof import('node:child_process')>('node:child_process');
  return { ...actual, execFileSync: execFileSyncMock };
});

const { downloadPdf } = await import('../src/downloader.js');

describe('downloadPdf', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'medbench-ingest-'));
    execFileSyncMock.mockReset();
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('baixa via curl, calcula SHA-256 e grava manifest', async () => {
    const fakeContent = Buffer.from('%PDF-1.4 conteúdo de teste');
    execFileSyncMock.mockImplementation((_cmd: string, args: string[]) => {
      const outIdx = args.indexOf('-o');
      writeFileSync(args[outIdx + 1]!, fakeContent);
      return Buffer.alloc(0);
    });

    const manifest = await downloadPdf('https://example.com/fake.pdf', tempDir, 'fake.pdf');

    expect(manifest.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(manifest.sizeBytes).toBe(fakeContent.length);
    expect(existsSync(join(tempDir, 'fake.pdf'))).toBe(true);

    const manifestJson = JSON.parse(readFileSync(join(tempDir, 'manifest.json'), 'utf8'));
    expect(manifestJson['fake.pdf']).toMatchObject({ url: 'https://example.com/fake.pdf' });
  });

  it('lança erro claro quando curl falha', async () => {
    execFileSyncMock.mockImplementation(() => {
      throw new Error('curl: (22) The requested URL returned error: 404');
    });

    await expect(downloadPdf('https://example.com/missing.pdf', tempDir, 'x.pdf')).rejects.toThrow(
      /Download falhou/,
    );
  });
});
