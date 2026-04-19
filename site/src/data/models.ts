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

export type ModelTier = 'proprietaria' | 'open-weight';

export interface ModelMetadata {
  /** Resumo curto (1–2 frases) para o header da página de detalhe. */
  description?: string;
  /** URL da página oficial do modelo no site do fornecedor. */
  homepage?: string;
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
    description:
      'Modelo flagship da Anthropic da geração Claude 4, lançado em meados de 2025 com foco em raciocínio e uso agêntico.',
    homepage: 'https://www.anthropic.com/claude',
    label: 'Claude Opus 4.5',
    modelId: 'claude-opus-4-5',
    provider: 'Anthropic',
    releaseDate: '2025-07-01',
    tier: 'proprietaria',
    trainingCutoff: '2024-07-01',
  },
  'claude-opus-4-6': {
    description:
      'Refresh intermediário do Opus 4 com janela de contexto maior e melhorias em tarefas longas de raciocínio.',
    homepage: 'https://www.anthropic.com/claude',
    label: 'Claude Opus 4.6',
    modelId: 'claude-opus-4-6',
    provider: 'Anthropic',
    releaseDate: '2025-10-01',
    tier: 'proprietaria',
    trainingCutoff: '2024-11-01',
  },
  'claude-opus-4-7': {
    description:
      'Flagship atual da Anthropic (2026), com thinking estendido e ganhos substanciais em benchmarks de saúde e ciência.',
    homepage: 'https://www.anthropic.com/claude',
    label: 'Claude Opus 4.7',
    modelId: 'claude-opus-4-7',
    provider: 'Anthropic',
    releaseDate: '2026-02-01',
    tier: 'proprietaria',
    trainingCutoff: '2025-03-01',
  },
  'gemini-2.5-pro': {
    description:
      'Flagship multimodal do Google DeepMind, base do Med-Gemini. Forte em raciocínio clínico e código.',
    homepage: 'https://deepmind.google/technologies/gemini/',
    label: 'Gemini 2.5 Pro',
    modelId: 'gemini-2.5-pro',
    provider: 'Google',
    releaseDate: '2025-03-25',
    tier: 'proprietaria',
    trainingCutoff: '2025-01-01',
  },
  'gemini-3.1-pro-preview': {
    description:
      'Preview da geração 3.1 do Gemini, com arquitetura atualizada e janela de contexto estendida.',
    homepage: 'https://deepmind.google/technologies/gemini/',
    label: 'Gemini 3.1 Pro',
    modelId: 'gemini-3.1-pro-preview',
    provider: 'Google',
    releaseDate: '2026-02-19',
    tier: 'proprietaria',
    trainingCutoff: '2025-11-01',
  },
  'gpt-5.1': {
    description:
      'Primeira revisão do GPT-5, lançada no final de 2025 com melhorias em instruction following e custo.',
    homepage: 'https://openai.com/index/gpt-5/',
    label: 'GPT-5.1',
    modelId: 'gpt-5.1',
    provider: 'OpenAI',
    releaseDate: '2025-11-13',
    tier: 'proprietaria',
    trainingCutoff: '2025-06-01',
  },
  'gpt-5.2': {
    description:
      'Atualização intermediária do GPT-5 com correções pós-lançamento e melhor desempenho em tarefas de domínio.',
    homepage: 'https://openai.com/index/gpt-5/',
    label: 'GPT-5.2',
    modelId: 'gpt-5.2',
    provider: 'OpenAI',
    releaseDate: '2025-12-11',
    tier: 'proprietaria',
    trainingCutoff: '2025-06-01',
  },
  'gpt-5.4': {
    description:
      'Iteração mais recente da linha GPT-5 da OpenAI, com corte de treino em 2026 e melhorias em raciocínio médico.',
    homepage: 'https://openai.com/index/gpt-5/',
    label: 'GPT-5.4',
    modelId: 'gpt-5.4',
    provider: 'OpenAI',
    releaseDate: '2026-03-05',
    tier: 'proprietaria',
    trainingCutoff: '2026-01-01',
  },
  'qwen3.6:35b-a3b-q8_0': {
    description:
      'Qwen 3.6 na variante MoE de 35B (3B ativos por token), quantizado Q8_0 — executado localmente via Ollama.',
    homepage: 'https://qwenlm.github.io/',
    label: 'Qwen 3.6 (36B MoE, Q8_0)',
    modelId: 'qwen3.6:35b-a3b-q8_0',
    provider: 'Alibaba · Ollama local',
    releaseDate: '2025-10-01',
    tier: 'open-weight',
    trainingCutoff: '2025-09-01',
  },
  'sabia-4': {
    description:
      'Modelo proprietário da Maritaca AI treinado com foco em português brasileiro, com forte desempenho em domínios locais.',
    homepage: 'https://maritaca.ai/',
    label: 'Sabiá 4',
    modelId: 'sabia-4',
    provider: 'Maritaca AI',
    releaseDate: '2025-07-01',
    tier: 'proprietaria',
    trainingCutoff: '2024-10-01',
  },
  'deepseek-ai/DeepSeek-R1': {
    description:
      'Modelo de reasoning aberto da DeepSeek, otimizado para cadeias de raciocínio longas antes da resposta final.',
    homepage: 'https://api-docs.deepseek.com/news/news250120',
    label: 'DeepSeek R1',
    modelId: 'deepseek-ai/DeepSeek-R1',
    provider: 'DeepSeek · Together AI',
    releaseDate: '2025-01-20',
    tier: 'open-weight',
    trainingCutoff: '2024-07-01',
  },
  'deepseek-ai/DeepSeek-V3.1': {
    description:
      'Modelo de chat aberto da DeepSeek, foco em uso geral sem cadeia de reasoning explícita.',
    homepage: 'https://api-docs.deepseek.com/',
    label: 'DeepSeek V3.1',
    modelId: 'deepseek-ai/DeepSeek-V3.1',
    provider: 'DeepSeek · Together AI',
    releaseDate: '2025-08-21',
    tier: 'open-weight',
    trainingCutoff: '2024-07-01',
  },
  'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8': {
    description:
      'Flagship da família Llama 4 da Meta (Maverick, MoE 17B × 128 experts, quantizado FP8).',
    homepage: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
    label: 'Llama 4 Maverick',
    modelId: 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8',
    provider: 'Meta · Together AI',
    releaseDate: '2025-04-05',
    tier: 'open-weight',
    trainingCutoff: '2024-08-01',
  },
  'Qwen/Qwen3.5-397B-A17B-FP8': {
    description:
      'Flagship da família Qwen 3.5 da Alibaba (397B MoE com 17B ativos, quantizado FP8).',
    homepage: 'https://qwenlm.github.io/',
    label: 'Qwen 3.5 397B',
    modelId: 'Qwen/Qwen3.5-397B-A17B-FP8',
    provider: 'Alibaba · Together AI',
    releaseDate: '2025-12-01',
    tier: 'open-weight',
    trainingCutoff: '2025-04-01',
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
  'open-weight': 'Open-weight',
  proprietaria: 'Proprietária',
};

export const TIER_COLOR: Record<ModelTier, string> = {
  'open-weight': 'var(--ps-violet)',
  proprietaria: 'var(--primary)',
};
