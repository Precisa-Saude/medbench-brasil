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
    homepage: 'https://www.anthropic.com/claude/opus',
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
    homepage: 'https://www.anthropic.com/claude/opus',
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
    homepage: 'https://www.anthropic.com/claude/opus',
    label: 'Claude Opus 4.7',
    modelId: 'claude-opus-4-7',
    provider: 'Anthropic',
    releaseDate: '2026-02-01',
    tier: 'proprietaria',
    trainingCutoff: '2025-03-01',
  },
  'deepseek/deepseek-chat-v3-0324': {
    description:
      'Versão original do DeepSeek V3 (snapshot de 2025-03-24), antecessora imediata do V3.1. Sem reasoning explícito.',
    homepage: 'https://api-docs.deepseek.com/',
    label: 'DeepSeek V3 (0324)',
    modelId: 'deepseek/deepseek-chat-v3-0324',
    provider: 'DeepSeek · OpenRouter',
    releaseDate: '2025-03-24',
    tier: 'open-weight',
    trainingCutoff: '2024-07-01',
  },
  'deepseek/deepseek-chat-v3.1': {
    description:
      'Modelo de chat aberto da DeepSeek, foco em uso geral sem cadeia de reasoning explícita.',
    homepage: 'https://api-docs.deepseek.com/',
    label: 'DeepSeek V3.1',
    modelId: 'deepseek/deepseek-chat-v3.1',
    provider: 'DeepSeek · OpenRouter',
    releaseDate: '2025-08-21',
    tier: 'open-weight',
    trainingCutoff: '2024-07-01',
  },
  'deepseek/deepseek-r1': {
    description:
      'Modelo de reasoning aberto da DeepSeek, otimizado para cadeias de raciocínio longas antes da resposta final.',
    homepage: 'https://api-docs.deepseek.com/news/news250120',
    label: 'DeepSeek R1',
    modelId: 'deepseek/deepseek-r1',
    provider: 'DeepSeek · OpenRouter',
    releaseDate: '2025-01-20',
    tier: 'open-weight',
    trainingCutoff: '2024-07-01',
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
  'google/gemini-3.1-pro-preview': {
    description:
      'Preview da geração 3.1 do Gemini, com arquitetura atualizada e janela de contexto estendida.',
    homepage: 'https://deepmind.google/technologies/gemini/',
    label: 'Gemini 3.1 Pro',
    modelId: 'google/gemini-3.1-pro-preview',
    provider: 'Google',
    releaseDate: '2026-02-19',
    tier: 'proprietaria',
    trainingCutoff: '2025-11-01',
  },
  'gpt-5.1': {
    description:
      'Primeira revisão do GPT-5, lançada no final de 2025 com melhorias em instruction following e custo.',
    homepage: 'https://openai.com/gpt-5/',
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
    homepage: 'https://openai.com/gpt-5/',
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
    homepage: 'https://openai.com/gpt-5/',
    label: 'GPT-5.4',
    modelId: 'gpt-5.4',
    provider: 'OpenAI',
    releaseDate: '2026-03-05',
    tier: 'proprietaria',
    trainingCutoff: '2026-01-01',
  },
  'meta-llama/llama-3.3-70b-instruct': {
    description:
      'Llama 3.3 70B Instruct — flagship dense da geração anterior ao Llama 4, lançado em dezembro de 2024.',
    homepage: 'https://ai.meta.com/blog/llama-3-3-new-models/',
    label: 'Llama 3.3 70B',
    modelId: 'meta-llama/llama-3.3-70b-instruct',
    provider: 'Meta · OpenRouter',
    releaseDate: '2024-12-06',
    tier: 'open-weight',
    trainingCutoff: '2023-12-01',
  },
  'meta-llama/llama-4-maverick': {
    description:
      'Flagship da família Llama 4 da Meta (Maverick, MoE 17B × 128 experts, 400B total). Multimodal nativo.',
    homepage: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
    label: 'Llama 4 Maverick',
    modelId: 'meta-llama/llama-4-maverick',
    provider: 'Meta · OpenRouter',
    releaseDate: '2025-04-05',
    tier: 'open-weight',
    trainingCutoff: '2024-08-01',
  },
  'meta-llama/llama-4-scout': {
    description:
      'Variante menor da família Llama 4 (Scout, MoE 17B × 16 experts, 109B total). Foco em custo e latência.',
    homepage: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
    label: 'Llama 4 Scout',
    modelId: 'meta-llama/llama-4-scout',
    provider: 'Meta · OpenRouter',
    releaseDate: '2025-04-05',
    tier: 'open-weight',
    trainingCutoff: '2024-08-01',
  },
  'mistralai/mistral-large-2411': {
    description:
      'Versão de nov/2024 do Mistral Large — antecessora imediata do Mistral Large 2512.',
    homepage: 'https://mistral.ai/',
    label: 'Mistral Large (2411)',
    modelId: 'mistralai/mistral-large-2411',
    provider: 'Mistral · OpenRouter',
    releaseDate: '2024-11-18',
    tier: 'open-weight',
    trainingCutoff: '2024-07-01',
  },
  'mistralai/mistral-large-2512': {
    description:
      'Flagship atual da Mistral (dez/2025), modelo denso com foco em raciocínio multilíngue.',
    homepage: 'https://mistral.ai/',
    label: 'Mistral Large (2512)',
    modelId: 'mistralai/mistral-large-2512',
    provider: 'Mistral · OpenRouter',
    releaseDate: '2025-12-01',
    tier: 'open-weight',
    trainingCutoff: '2025-06-01',
  },
  'qwen/qwen3-235b-a22b-2507': {
    description:
      'Qwen 3 235B MoE (22B ativos), variante 2025-07 sem thinking — comparável aos outros modelos open-weight sem reasoning estendido.',
    homepage: 'https://qwenlm.github.io/',
    label: 'Qwen 3 235B',
    modelId: 'qwen/qwen3-235b-a22b-2507',
    provider: 'Alibaba · OpenRouter',
    releaseDate: '2025-07-01',
    tier: 'open-weight',
    trainingCutoff: '2025-04-01',
  },
  'qwen/qwen3.5-122b-a10b': {
    description:
      'Qwen 3.5 flagship MoE (122B total, 10B ativos). Antecessora imediata do Qwen 3.6 Plus.',
    homepage: 'https://qwenlm.github.io/',
    label: 'Qwen 3.5 122B',
    modelId: 'qwen/qwen3.5-122b-a10b',
    provider: 'Alibaba · OpenRouter',
    releaseDate: '2026-01-01',
    tier: 'open-weight',
    trainingCutoff: '2025-08-01',
  },
  'qwen/qwen3.6-plus': {
    description:
      'Qwen 3.6 Plus — nova arquitetura híbrida (atenção linear + MoE esparso), 283B tokens de treinamento, janela de 1M.',
    homepage: 'https://qwenlm.github.io/',
    label: 'Qwen 3.6 Plus',
    modelId: 'qwen/qwen3.6-plus',
    provider: 'Alibaba · OpenRouter',
    releaseDate: '2026-04-02',
    tier: 'open-weight',
    trainingCutoff: '2025-12-01',
  },
  'sabia-3': {
    description:
      'Versão anterior do Sabiá da Maritaca AI, treinado com foco em português brasileiro. Benchmark publicado no paper original em 2024.',
    homepage: 'https://maritaca.ai/',
    label: 'Sabiá 3',
    modelId: 'sabia-3',
    provider: 'Maritaca AI',
    releaseDate: '2024-09-01',
    tier: 'proprietaria',
    trainingCutoff: '2024-03-01',
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
