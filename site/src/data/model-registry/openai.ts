import type { ModelMetadata } from './types.js';

export const OPENAI_MODELS: Record<string, ModelMetadata> = {
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
      'Iteração mais recente da linha GPT-5 da OpenAI, com melhorias em benchmarks de domínio médico.',
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
  'gpt-5.6-sol': {
    description:
      'Variante frontier da família GPT-5.6 (Sol, Terra e Luna; julho/2026), voltada a raciocínio avançado, pesquisa científica e agentes complexos.',
    homepage: 'https://openai.com/gpt-5/',
    label: 'GPT-5.6 Sol',
    modelId: 'gpt-5.6-sol',
    provider: 'OpenAI',
    releaseDate: '2026-07-09',
    tier: 'proprietaria',
    // "Feb 16, 2026 knowledge cutoff" — OpenAI developer docs (página do
    // modelo gpt-5.6; o alias `gpt-5.6` roteia para o Sol).
    trainingCutoff: '2026-02-16',
    trainingCutoffSource: 'https://developers.openai.com/api/docs/models/gpt-5.6',
  },
};
