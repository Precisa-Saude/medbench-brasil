/**
 * Metadados dos modelos avaliados.
 *
 * Os artefatos em `results/` só carregam o que o scorer produz (acurácia,
 * IC95, splits). Dados editoriais — rótulo, fornecedor, tier, release,
 * corte de treino — vivem aqui, chaveados por `modelId`.
 *
 * Para adicionar um novo modelo ao leaderboard:
 *   1. Rodar `medbench --backend ... --model <id> ...` e commitar `results/<id>.json`.
 *   2. Acrescentar uma entrada abaixo.
 */

export type ModelTier = 'proprietaria' | 'open-weight' | 'brasileira';

export interface ModelMetadata {
  label: string;
  modelId: string;
  /** ISO YYYY-MM-DD do lançamento público do modelo. Usado no eixo X do scatter. */
  releaseDate: string;
  provider: string;
  tier: ModelTier;
  /** ISO YYYY-MM-DD — fonte oficial do fornecedor. Ver docs/contamination.md. */
  trainingCutoff: string | undefined;
}

export const MODELS_METADATA: Record<string, ModelMetadata> = {
  'claude-opus-4-7': {
    label: 'Claude Opus 4.7',
    modelId: 'claude-opus-4-7',
    provider: 'Anthropic',
    releaseDate: '2026-02-01',
    tier: 'proprietaria',
    trainingCutoff: '2025-03-01',
  },
  'gpt-5.4': {
    label: 'GPT-5.4',
    modelId: 'gpt-5.4',
    provider: 'OpenAI',
    releaseDate: '2026-01-15',
    tier: 'proprietaria',
    trainingCutoff: '2025-06-01',
  },
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
    }
  );
}

export const TIER_LABEL: Record<ModelTier, string> = {
  brasileira: 'Brasileira',
  'open-weight': 'Open-weight',
  proprietaria: 'Proprietária',
};

export const TIER_COLOR: Record<ModelTier, string> = {
  brasileira: 'var(--ps-green)',
  'open-weight': 'var(--ps-amber)',
  proprietaria: 'var(--ps-violet)',
};
