import { classifyContamination, loadEdition } from '@precisa-saude/medbench-dataset';
import { describe, expect, it } from 'vitest';

import { getModelMetadata } from '../models';

describe('cadastro do shortlist', () => {
  it('mantém Terra com fonte e data exatas publicadas pela OpenAI', () => {
    expect(getModelMetadata('openai/gpt-6.1-terra')).toMatchObject({
      provider: 'OpenAI · OpenRouter',
      trainingCutoff: '2026-06-01',
      trainingCutoffSource: 'https://developers.openai.com/api/docs/models/gpt-6.1-terra',
      priceMaxInputTokens: 271_999,
      pricePerMTokInputUSD: 1,
      pricePerMTokOutputUSD: 5,
      priceAsOf: '2026-11-04',
    });
  });

  it.each(['claude-haiku-5-5', 'google/gemini-4-argon'])(
    'não inventa dia para cutoff mensal de %s',
    (model) => {
      const metadata = getModelMetadata(model);
      expect(metadata.trainingCutoff).toBeUndefined();
      expect(metadata.trainingCutoffSource).toBeUndefined();
      for (const editionId of ['revalida-2025-2', 'revalida-2026-1'] as const) {
        expect(classifyContamination(loadEdition(editionId), metadata.trainingCutoff)).toEqual({
          basis: null,
          risk: 'unknown',
        });
      }
    },
  );

  it('mantém preços e rotas separados e protege condições', () => {
    expect(getModelMetadata('claude-haiku-5-5')).toMatchObject({
      provider: 'Anthropic',
      priceMaxInputTokens: 100_000,
      pricePerMTokInputUSD: 0.1,
      pricePerMTokOutputUSD: 0.5,
    });
    expect(getModelMetadata('google/gemini-4-argon')).toMatchObject({
      provider: 'Google · OpenRouter',
      pricePerMTokInputUSD: 2,
      pricePerMTokOutputUSD: 10,
      priceValidThrough: '2026-11-30',
    });
    expect(getModelMetadata('gemini-4-argon').priceSource).toBeUndefined();
    expect(getModelMetadata('gpt-6.1-terra').priceSource).toBeUndefined();
  });
});
