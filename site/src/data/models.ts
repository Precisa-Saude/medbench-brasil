/**
 * Metadados dos modelos avaliados.
 *
 * Os artefatos em `results/` só carregam o que o scorer produz (precisão,
 * IC95, splits). Dados editoriais — rótulo, fornecedor, tier, release,
 * corte de treino — vivem em `model-registry/`, chaveados por `modelId`.
 *
 * Este arquivo é só o barrel: agrega os módulos por fornecedor e expõe os
 * helpers consumidos pelo site. A divisão por fornecedor existe porque o
 * registry cresce a cada modelo avaliado — um arquivo único passava do
 * limite de linhas do ESLint e concentrava conflitos de merge.
 *
 * Para adicionar um novo modelo ao leaderboard:
 *   1. Rodar `medbench --backend ... --model <id> ...` e commitar `results/<id>.json`.
 *   2. Acrescentar uma entrada no módulo do fornecedor em `model-registry/`.
 */

import { ANTHROPIC_MODELS } from './model-registry/anthropic.js';
import { GOOGLE_MODELS } from './model-registry/google.js';
import { OPEN_WEIGHT_MODELS } from './model-registry/open-weights.js';
import { OPENAI_MODELS } from './model-registry/openai.js';
import { OUTROS_MODELS } from './model-registry/outros.js';
import { QWEN_MODELS } from './model-registry/qwen.js';
import type { ModelMetadata, ModelTier } from './model-registry/types.js';

export type { ModelMetadata, ModelTier } from './model-registry/types.js';

// Regra: `trainingCutoff` vem exclusivamente de documentação publicada pelo
// fornecedor (docs de API, model card no HF, tech report no arXiv, release
// notes). Quando o fornecedor não publica, o campo fica `undefined` e a
// contaminação é classificada como `unknown` — nunca estimamos. A fonte exata
// de cada valor está em `trainingCutoffSource` e no comentário acima da
// entrada, incluindo a citação verbatim quando disponível.
export const MODELS_METADATA: Record<string, ModelMetadata> = {
  ...ANTHROPIC_MODELS,
  ...GOOGLE_MODELS,
  ...OPENAI_MODELS,
  ...OPEN_WEIGHT_MODELS,
  ...OUTROS_MODELS,
  ...QWEN_MODELS,
};

export function getModelMetadata(modelId: string): ModelMetadata {
  return (
    MODELS_METADATA[modelId] ?? {
      label: modelId,
      modelId,
      provider: 'desconhecido',
      releaseDate: '',
      tier: 'open-weight',
      trainingCutoff: undefined,
      trainingCutoffSource: undefined,
    }
  );
}

export const TIER_LABEL: Record<ModelTier, string> = {
  'open-weight': 'Open-weight',
  proprietaria: 'Proprietária',
};

export const TIER_COLOR: Record<ModelTier, string> = {
  'open-weight': 'var(--ps-violet)',
  proprietaria: 'var(--primary)',
};
