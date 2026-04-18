/**
 * Metadados dos modelos avaliados.
 *
 * Os artefatos em `results/` só carregam o que o scorer produz (precisão,
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
  provider: string;
  /** ISO YYYY-MM-DD do lançamento público do modelo. Usado no eixo X do scatter. */
  releaseDate: string;
  tier: ModelTier;
  /** ISO YYYY-MM-DD — fonte oficial do fornecedor. Ver docs/contamination.md. */
  trainingCutoff: string | undefined;
}

// Cortes de treino abaixo são estimativas públicas (documentação do fornecedor
// quando disponível, caso contrário a data mais recente plausível). Sempre
// que uma fonte oficial for localizada, atualizar e referenciar no comentário.
export const MODELS_METADATA: Record<string, ModelMetadata> = {
  'claude-opus-4-5': {
    label: 'Claude Opus 4.5',
    modelId: 'claude-opus-4-5',
    provider: 'Anthropic',
    releaseDate: '2025-07-01',
    tier: 'proprietaria',
    trainingCutoff: '2024-07-01',
  },
  'claude-opus-4-6': {
    label: 'Claude Opus 4.6',
    modelId: 'claude-opus-4-6',
    provider: 'Anthropic',
    releaseDate: '2025-10-01',
    tier: 'proprietaria',
    trainingCutoff: '2024-11-01',
  },
  'claude-opus-4-7': {
    label: 'Claude Opus 4.7',
    modelId: 'claude-opus-4-7',
    provider: 'Anthropic',
    releaseDate: '2026-02-01',
    tier: 'proprietaria',
    trainingCutoff: '2025-03-01',
  },
  'gemini-2.5-pro': {
    label: 'Gemini 2.5 Pro',
    modelId: 'gemini-2.5-pro',
    provider: 'Google',
    releaseDate: '2025-03-25',
    tier: 'proprietaria',
    trainingCutoff: '2025-01-01',
  },
  'gemini-3.1-pro-preview': {
    label: 'Gemini 3.1 Pro',
    modelId: 'gemini-3.1-pro-preview',
    provider: 'Google',
    releaseDate: '2026-02-19',
    tier: 'proprietaria',
    trainingCutoff: '2025-11-01',
  },
  'gpt-5.1': {
    label: 'GPT-5.1',
    modelId: 'gpt-5.1',
    provider: 'OpenAI',
    releaseDate: '2025-11-13',
    tier: 'proprietaria',
    trainingCutoff: '2025-06-01',
  },
  'gpt-5.2': {
    label: 'GPT-5.2',
    modelId: 'gpt-5.2',
    provider: 'OpenAI',
    releaseDate: '2025-12-11',
    tier: 'proprietaria',
    trainingCutoff: '2025-06-01',
  },
  'gpt-5.4': {
    label: 'GPT-5.4',
    modelId: 'gpt-5.4',
    provider: 'OpenAI',
    releaseDate: '2026-03-05',
    tier: 'proprietaria',
    trainingCutoff: '2026-01-01',
  },
  'sabia-4': {
    label: 'Sabiá 4',
    modelId: 'sabia-4',
    provider: 'Maritaca AI',
    releaseDate: '2025-07-01',
    tier: 'brasileira',
    trainingCutoff: '2024-10-01',
  },
  'qwen3.6:35b-a3b-q8_0': {
    label: 'Qwen 3.6 (36B MoE, Q8_0)',
    modelId: 'qwen3.6:35b-a3b-q8_0',
    provider: 'Alibaba · Ollama local',
    releaseDate: '2025-10-01',
    tier: 'open-weight',
    trainingCutoff: '2025-09-01',
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
