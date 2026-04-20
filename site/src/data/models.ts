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

interface ModelMetadataBase {
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
}

/**
 * `trainingCutoff` e `trainingCutoffSource` sempre andam juntos: ou ambos têm
 * valor (corte publicado pelo fornecedor + URL da fonte) ou ambos são
 * `undefined` (corte não publicado → contaminação `unknown`). Modelado como
 * union discriminada para que o type system impeça estados inválidos (ex.:
 * corte sem fonte). Ver docs/contamination.md.
 */
type TrainingCutoffFields =
  | { trainingCutoff: string; trainingCutoffSource: string }
  | { trainingCutoff: undefined; trainingCutoffSource: undefined };

export type ModelMetadata = ModelMetadataBase & TrainingCutoffFields;

// Regra: `trainingCutoff` vem exclusivamente de documentação publicada pelo
// fornecedor (docs de API, model card no HF, tech report no arXiv, release
// notes). Quando o fornecedor não publica, o campo fica `undefined` e a
// contaminação é classificada como `unknown` — nunca estimamos. A fonte exata
// de cada valor está em `trainingCutoffSource` e no comentário acima da
// entrada, incluindo a citação verbatim quando disponível.
export const MODELS_METADATA: Record<string, ModelMetadata> = {
  // Anthropic publica dois cutoffs por modelo: "training data cutoff" (janela
  // ampla do corpus) e "reliable knowledge cutoff" (data em que o
  // conhecimento é considerado confiável). Usamos o training data cutoff —
  // é o mais conservador para contaminação (qualquer dado dentro da janela
  // pode ter sido memorizado). Fonte única para 4.5/4.6/4.7: tabela Models
  // overview em platform.claude.com (mais estável e canônica que o Help
  // Center, que também publica os mesmos valores).
  'claude-opus-4-5': {
    description:
      'Modelo flagship da Anthropic da geração Claude 4, lançado em meados de 2025 com foco em raciocínio e uso agêntico.',
    homepage: 'https://www.anthropic.com/claude/opus',
    label: 'Claude Opus 4.5',
    modelId: 'claude-opus-4-5',
    provider: 'Anthropic',
    releaseDate: '2025-07-01',
    tier: 'proprietaria',
    // "Claude Opus 4.5 ... Training data cutoff Aug 2025" — Models overview.
    trainingCutoff: '2025-08-01',
    trainingCutoffSource: 'https://platform.claude.com/docs/en/about-claude/models/overview',
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
    // "Claude Opus 4.6 ... Training data cutoff Aug 2025" — Models overview.
    trainingCutoff: '2025-08-01',
    trainingCutoffSource: 'https://platform.claude.com/docs/en/about-claude/models/overview',
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
    // "Claude Opus 4.7 ... Training data cutoff Jan 2026" — Models overview.
    trainingCutoff: '2026-01-01',
    trainingCutoffSource: 'https://platform.claude.com/docs/en/about-claude/models/overview',
  },
  // DeepSeek só publica cutoff explícito para um modelo: R1. O paper R1
  // (arXiv:2501.12948, seção Decontamination) afirma "DeepSeek-V3 base has a
  // knowledge cutoff date of July 2024" no contexto de justificar que R1 é
  // decontaminado em relação a benchmarks pós-jul/2024 — portanto o paper
  // atesta o cutoff de R1 via V3-Base.
  //
  // Os snapshots V3-0324 e V3.1 **não** têm declaração similar: V3-0324 é
  // pós-treinado a partir de V3-Base (data dos dados de pós-treinamento não
  // divulgada) e V3.1 faz extensão de long-context com "additional long
  // documents" de data não divulgada. Para manter a política de não
  // estimar, V3-0324 e V3.1 ficam `undefined`.
  'deepseek/deepseek-chat-v3-0324': {
    description:
      'Versão original do DeepSeek V3 (snapshot de 2025-03-24), antecessora imediata do V3.1. Sem reasoning explícito.',
    homepage: 'https://api-docs.deepseek.com/',
    label: 'DeepSeek V3 (0324)',
    modelId: 'deepseek/deepseek-chat-v3-0324',
    provider: 'DeepSeek · OpenRouter',
    releaseDate: '2025-03-24',
    tier: 'open-weight',
    trainingCutoff: undefined,
    trainingCutoffSource: undefined,
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
    trainingCutoff: undefined,
    trainingCutoffSource: undefined,
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
    // "DeepSeek-V3 base has a knowledge cutoff date of July 2024" —
    // DeepSeek-R1 paper, arXiv:2501.12948, seção Decontamination. O paper
    // usa essa afirmação para justificar que R1 é decontaminado para
    // benchmarks pós-jul/2024, portanto atesta o cutoff de R1.
    trainingCutoff: '2024-07-01',
    trainingCutoffSource: 'https://arxiv.org/abs/2501.12948',
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
    // "Knowledge cutoff: January 2025" — Gemini API docs, tabela do modelo.
    trainingCutoff: '2025-01-01',
    trainingCutoffSource: 'https://ai.google.dev/gemini-api/docs/models/gemini-2.5-pro',
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
    // "Knowledge cutoff: January 2025" — Gemini API docs. Google não
    // diferenciou cutoff entre Gemini 3 Pro e 3.1 Pro em nenhuma doc oficial.
    trainingCutoff: '2025-01-01',
    trainingCutoffSource: 'https://ai.google.dev/gemini-api/docs/models/gemini-3.1-pro-preview',
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
    // "Sep 30, 2024 knowledge cutoff" — OpenAI developer docs (página do modelo).
    trainingCutoff: '2024-09-30',
    trainingCutoffSource: 'https://developers.openai.com/api/docs/models/gpt-5.1',
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
    // "Aug 31, 2025 knowledge cutoff" — OpenAI developer docs. Mesmo corte
    // para as variantes Instant/Thinking/Pro conforme anúncio oficial.
    trainingCutoff: '2025-08-31',
    trainingCutoffSource: 'https://developers.openai.com/api/docs/models/gpt-5.2',
  },
  'gpt-5.4': {
    description:
      'Iteração mais recente da linha GPT-5 da OpenAI, com melhorias em raciocínio médico.',
    homepage: 'https://openai.com/gpt-5/',
    label: 'GPT-5.4',
    modelId: 'gpt-5.4',
    provider: 'OpenAI',
    releaseDate: '2026-03-05',
    tier: 'proprietaria',
    // "Aug 31, 2025 knowledge cutoff" — OpenAI developer docs. Não houve
    // refresh de corpus entre GPT-5.2 e 5.4 (mesma data).
    trainingCutoff: '2025-08-31',
    trainingCutoffSource: 'https://developers.openai.com/api/docs/models/gpt-5.4',
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
    // "Data Freshness: The pretraining data has a cutoff of December 2023" — model card HF.
    trainingCutoff: '2023-12-01',
    trainingCutoffSource: 'https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct',
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
    // "Data Freshness: The pretraining data has a cutoff of August 2024" — model card HF.
    trainingCutoff: '2024-08-01',
    trainingCutoffSource: 'https://huggingface.co/meta-llama/Llama-4-Maverick-17B-128E-Instruct',
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
    // "Data Freshness: The pretraining data has a cutoff of August 2024" — model card HF.
    trainingCutoff: '2024-08-01',
    trainingCutoffSource: 'https://huggingface.co/meta-llama/Llama-4-Scout-17B-16E-Instruct',
  },
  // Mistral não publica cutoff por modelo na documentação oficial nem nos
  // model cards. O único valor encontrado nos SYSTEM_PROMPT.txt dos repos HF
  // ("2023-10-01") é boilerplate reusado inclusive no Large 3 (Dez 2025) —
  // claramente não corresponde ao corpus real. Ficam `undefined`.
  'mistralai/mistral-large-2411': {
    description:
      'Versão de nov/2024 do Mistral Large — antecessora imediata do Mistral Large 2512.',
    homepage: 'https://mistral.ai/',
    label: 'Mistral Large (2411)',
    modelId: 'mistralai/mistral-large-2411',
    provider: 'Mistral · OpenRouter',
    releaseDate: '2024-11-18',
    tier: 'open-weight',
    trainingCutoff: undefined,
    trainingCutoffSource: undefined,
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
    trainingCutoff: undefined,
    trainingCutoffSource: undefined,
  },
  // Alibaba/Qwen não publica pretraining data cutoff em blog, model card HF
  // ou tech report para a família Qwen3/3.5/3.6. Ficam `undefined`.
  'qwen/qwen3-235b-a22b-2507': {
    description:
      'Qwen 3 235B MoE (22B ativos), variante 2025-07 sem thinking — comparável aos outros modelos open-weight sem reasoning estendido.',
    homepage: 'https://qwenlm.github.io/',
    label: 'Qwen 3 235B',
    modelId: 'qwen/qwen3-235b-a22b-2507',
    provider: 'Alibaba · OpenRouter',
    releaseDate: '2025-07-01',
    tier: 'open-weight',
    trainingCutoff: undefined,
    trainingCutoffSource: undefined,
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
    trainingCutoff: undefined,
    trainingCutoffSource: undefined,
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
    trainingCutoff: undefined,
    trainingCutoffSource: undefined,
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
    // "Knowledge Cutoff: Mid-2023" — Sabiá-3 technical report (Table 1),
    // arXiv:2410.12049. Também: "Até meados de 2023" em docs.maritaca.ai/pt/modelos.
    // Representamos "mid-2023" como 2023-06-01.
    trainingCutoff: '2023-06-01',
    trainingCutoffSource: 'https://arxiv.org/abs/2410.12049',
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
    // "atualizado até agosto de 2024" — docs.maritaca.ai/pt/modelos (Sabiá 4).
    trainingCutoff: '2024-08-01',
    trainingCutoffSource: 'https://docs.maritaca.ai/pt/modelos',
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
