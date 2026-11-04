import { describe, expect, it } from 'vitest';

import { getModelMetadata, MODELS_METADATA } from '../models';
import { MODEL_PRICING } from './pricing';

describe('procedência de preços', () => {
  it('cada tarifa corresponde a ID existente e traz data, fonte e trechos', () => {
    expect(Object.keys(MODEL_PRICING).length).toBeGreaterThan(20);
    for (const [id, p] of Object.entries(MODEL_PRICING)) {
      expect(MODELS_METADATA[id], id).toBeDefined();
      expect(p.priceAsOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isFinite(Date.parse(p.priceAsOf))).toBe(true);
      expect(p.priceSource).toMatch(/^https:\/\//);
      expect(p.priceQuote.length).toBeGreaterThan(10);
      expect(p.priceProvider.length).toBeGreaterThan(3);
      expect(p.pricePerMTokInputUSD).toBeGreaterThanOrEqual(0);
      expect(p.pricePerMTokOutputUSD).toBeGreaterThanOrEqual(0);
      expect(getModelMetadata(id)).toMatchObject(p);
    }
  });
  it('não infere USD de BRL, preço local, alias ou antecessor', () => {
    for (const id of [
      'sabia-4',
      'sabia-4-thinking',
      'mlx-community/Qwen2.5-14B-Instruct-bf16',
      'hugo/protocolos-clinicos-br-rl-4gen-14b',
      'jaredpalmer/kev-4b',
      'new-model',
      'deepseek/deepseek-r1',
      'mistralai/mistral-large-2411',
    ]) {
      expect(getModelMetadata(id).pricePerMTokInputUSD, id).toBeUndefined();
    }
  });
  it('protege promoções e faixas condicionais verificadas', () => {
    expect(MODEL_PRICING['gpt-5.6-sol']!.priceValidThrough).toBe('2026-11-21');
    expect(MODEL_PRICING['gemini-2.5-pro']!.priceValidThrough).toBe('2026-11-30');
    expect(MODEL_PRICING['gemini-3.6-flash']!.priceValidThrough).toBe('2026-12-31');
    expect(MODEL_PRICING['x-ai/grok-4.7']!.priceMaxInputTokens).toBe(199_999);
  });
});
