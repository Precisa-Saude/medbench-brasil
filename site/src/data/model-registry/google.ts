import type { ModelMetadata } from './types.js';

export const GOOGLE_MODELS: Record<string, ModelMetadata> = {
  'gemini-2.5-pro': {
    description:
      'Flagship multimodal do Google DeepMind, base do Med-Gemini. Forte em tarefas de domínio médico e código.',
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
  // 3.6 Flash: nem a página do modelo nem o changelog da Gemini API publicam
  // knowledge cutoff (verificado em 2026-08-03) → `undefined`. Release em
  // 2026-07-21 conforme o changelog ("Gemini 3.6 Flash and Gemini 3.5
  // Flash-Lite generally available (GA)").
  'gemini-3.6-flash': {
    description:
      'Modelo mais recente da linha Flash do Gemini (julho/2026), inteligência de fronteira sustentada com foco em velocidade e custo.',
    homepage: 'https://deepmind.google/technologies/gemini/',
    label: 'Gemini 3.6 Flash',
    modelId: 'gemini-3.6-flash',
    provider: 'Google',
    releaseDate: '2026-07-21',
    tier: 'proprietaria',
    trainingCutoff: undefined,
    trainingCutoffSource: undefined,
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
};
