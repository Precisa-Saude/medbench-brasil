import { describe, expect, it } from 'vitest';

import { parseEdition } from '../src/parser.js';

describe('parseEdition', () => {
  it('exige ANTHROPIC_API_KEY no ambiente', async () => {
    const prev = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    await expect(
      parseEdition({
        apiKey: undefined,
        editionId: 'revalida-2025-1',
        gabaritoText: '',
        provaText: '',
      }),
    ).rejects.toThrow(/ANTHROPIC_API_KEY/);
    if (prev) process.env.ANTHROPIC_API_KEY = prev;
  });
});
