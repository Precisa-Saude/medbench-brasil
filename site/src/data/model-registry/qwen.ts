import type { ModelMetadata } from './types.js';

/**
 * Família Qwen (Alibaba) — inclui os checkpoints locais rodados via MLX para
 * o estudo de transferência PCDT→prova oficial INEP, que derivam do Qwen 2.5.
 *
 * Alibaba/Qwen não publica pretraining data cutoff em blog, model card HF ou
 * tech report para nenhuma geração da família. Todos ficam `undefined`.
 */
export const QWEN_MODELS: Record<string, ModelMetadata> = {
  'hugo/protocolos-clinicos-br-cpt-4gen-14b': {
    description:
      'Continued pretraining do Qwen 2.5 14B em Protocolos Clínicos e Diretrizes Terapêuticas (PCDTs) do SUS. Abonizio et al., arXiv:2605.01077.',
    homepage: 'https://arxiv.org/abs/2605.01077',
    label: 'Qwen 2.5 14B CPT-4gen (clinical-protocols-br)',
    modelId: 'hugo/protocolos-clinicos-br-cpt-4gen-14b',
    provider: 'Abonizio et al. · MLX local',
    releaseDate: '2026-05-01',
    tier: 'open-weight',
    trainingCutoff: undefined,
    trainingCutoffSource: undefined,
  },
  // Runs locais via MLX para o estudo de transferência PCDT→prova oficial INEP
  // (cpt-4gen e, em seguida, rl-4gen são checkpoints de Abonizio et al.,
  // arXiv:2605.01077, "Teaching LLMs Brazilian Healthcare: Injecting Knowledge
  // from Official Clinical Guidelines").
  'mlx-community/Qwen2.5-14B-Instruct-bf16': {
    description:
      'Baseline Qwen 2.5 14B Instruct (bf16), rodado localmente via MLX. Referência sem fine-tuning para o estudo de transferência PCDT→prova oficial INEP.',
    homepage: 'https://qwenlm.github.io/blog/qwen2.5/',
    label: 'Qwen 2.5 14B (MLX bf16)',
    modelId: 'mlx-community/Qwen2.5-14B-Instruct-bf16',
    provider: 'Alibaba · MLX local',
    releaseDate: '2024-09-19',
    tier: 'open-weight',
    trainingCutoff: undefined,
    trainingCutoffSource: undefined,
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
  // 3.7 Max: sem post de anúncio datado no blog da Qwen e sem repo público de
  // pesos no HF (o tier Max é servido só via API) — releaseDate usa a data de
  // listagem no OpenRouter (2026-05-21). Obs.: o Qwen3.8 Max (ago/2026) ainda
  // não está disponível via OpenRouter; este é o flagship Qwen acessível pelo
  // backend do harness.
  'qwen/qwen3.7-max': {
    description:
      'Flagship da linha Max da geração Qwen 3.7 (maio/2026), servido apenas via API, voltado a raciocínio e tarefas complexas.',
    homepage: 'https://qwenlm.github.io/',
    label: 'Qwen 3.7 Max',
    modelId: 'qwen/qwen3.7-max',
    provider: 'Alibaba · OpenRouter',
    releaseDate: '2026-05-21',
    tier: 'proprietaria',
    trainingCutoff: undefined,
    trainingCutoffSource: undefined,
  },
};
