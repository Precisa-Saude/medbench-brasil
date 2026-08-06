import type { ModelMetadata } from './types.js';

/** Fornecedores com poucos modelos no benchmark: Maritaca AI e xAI. */
export const OUTROS_MODELS: Record<string, ModelMetadata> = {
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
  'sabia-4-thinking': {
    description:
      'Modelo de raciocínio da família Sabiá, da Maritaca AI, com pensamento estruturado passo a passo antes da resposta e foco em português brasileiro.',
    homepage: 'https://maritaca.ai/',
    label: 'Sabiá 4 Thinking',
    modelId: 'sabia-4-thinking',
    provider: 'Maritaca AI',
    // "23 de junho de 2026" — anúncio oficial, maritaca.ai/blog/sabia-4-thinking.
    releaseDate: '2026-06-23',
    tier: 'proprietaria',
    // Corte de treino não publicado pela Maritaca (docs.maritaca.ai/pt/modelos
    // não informa; anúncio oficial também não). Fica sem classificação.
    trainingCutoff: undefined,
    trainingCutoffSource: undefined,
  },
  'x-ai/grok-4.5': {
    description:
      'Flagship da xAI (julho/2026), voltado a código, chat e uso geral, com janela de contexto de 500k tokens.',
    homepage: 'https://x.ai/',
    label: 'Grok 4.5',
    modelId: 'x-ai/grok-4.5',
    provider: 'xAI · OpenRouter',
    releaseDate: '2026-07-08',
    tier: 'proprietaria',
    // "The knowledge cut-off date of Grok 4.5 is February 1, 2026." —
    // docs.x.ai, página Models.
    trainingCutoff: '2026-02-01',
    trainingCutoffSource: 'https://docs.x.ai/docs/models',
  },
};
