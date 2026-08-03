import type { ModelMetadata } from './types.js';

/**
 * Modelos de pesos abertos servidos via OpenRouter (DeepSeek, Meta, Mistral,
 * Moonshot) — exceto a família Qwen, que tem arquivo próprio por concentrar
 * também os checkpoints locais do estudo PCDT.
 */
export const OPEN_WEIGHT_MODELS: Record<string, ModelMetadata> = {
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
  // V4 Pro: o model card no HF declara pré-treino em "more than 32T diverse
  // and high-quality tokens" mas não declara knowledge cutoff (verificado em
  // 2026-08-03) → `undefined`.
  'deepseek/deepseek-v4-pro': {
    description:
      'Flagship aberto da geração V4 da DeepSeek (abril/2026), pré-treinado em mais de 32T tokens, licença MIT.',
    homepage: 'https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro',
    label: 'DeepSeek V4 Pro',
    modelId: 'deepseek/deepseek-v4-pro',
    provider: 'DeepSeek · OpenRouter',
    releaseDate: '2026-04-24',
    tier: 'open-weight',
    trainingCutoff: undefined,
    trainingCutoffSource: undefined,
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
  // K3: o model card no HF confirma pesos abertos ("We release the full Kimi
  // K3 model weights under the Kimi K3 License") mas não declara knowledge
  // cutoff (verificado em 2026-08-03) → `undefined`.
  'moonshotai/kimi-k3': {
    description:
      'Modelo aberto de fronteira da Moonshot AI (julho/2026), pesos completos liberados sob a Kimi K3 License.',
    homepage: 'https://huggingface.co/moonshotai/Kimi-K3',
    label: 'Kimi K3',
    modelId: 'moonshotai/kimi-k3',
    provider: 'Moonshot AI · OpenRouter',
    releaseDate: '2026-07-16',
    tier: 'open-weight',
    trainingCutoff: undefined,
    trainingCutoffSource: undefined,
  },
};
