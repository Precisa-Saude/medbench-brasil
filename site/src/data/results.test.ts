import { describe, expect, it } from 'vitest';

import { MODELS_METADATA } from './models';
import { FORA_DO_LEADERBOARD, MODELS } from './results';

describe('composição do leaderboard', () => {
  it('não publica modelo marcado como fora do leaderboard', () => {
    // Regressão: ausência de entrada no registry NÃO basta para esconder um
    // modelo — `getModelMetadata` tem fallback, então todo artefato em
    // `results/` viraria linha. A exclusão tem que ser explícita.
    for (const modelId of Object.keys(FORA_DO_LEADERBOARD)) {
      expect(MODELS.find((m) => m.modelId === modelId)).toBeUndefined();
    }
  });

  it('mantém o Laya fora da tabela, como controle de protocolo', () => {
    expect(FORA_DO_LEADERBOARD).toHaveProperty('convaiinnovations/laya-multilingual');
  });

  it('publica os modelos de decisão que têm entrada no registry', () => {
    for (const modelId of ['jaredpalmer/kev-4b', 'typesafe/jev-1.13-20260917']) {
      expect(MODELS.find((m) => m.modelId === modelId)).toBeDefined();
      expect(MODELS_METADATA[modelId]?.isDecisionModel).toBe(true);
    }
  });

  it('não deixa modelo publicado sem metadado editorial', () => {
    // `provider: 'desconhecido'` é o fallback; se aparecer na tabela, faltou
    // entrada no registry ou faltou excluir o modelo de propósito.
    const semMetadado = MODELS.filter((m) => m.provider === 'desconhecido').map((m) => m.modelId);
    expect(semMetadado).toEqual([]);
  });
});
