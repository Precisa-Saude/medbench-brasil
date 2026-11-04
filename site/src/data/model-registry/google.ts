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
    // Servido via OpenRouter, não pela API nativa do Google — os raws de
    // enamed-2025 mostram requestParams no formato OpenAI-compat
    // (max_tokens/messages), não no nativo (contents/parts). Mesma convenção
    // 'Fornecedor · Rota' das entradas Qwen e xAI.
    provider: 'Google · OpenRouter',
    releaseDate: '2026-02-19',
    tier: 'proprietaria',
    // "Knowledge cutoff: January 2025" — Gemini API docs. Google não
    // diferenciou cutoff entre Gemini 3 Pro e 3.1 Pro em nenhuma doc oficial.
    trainingCutoff: '2025-01-01',
    trainingCutoffSource: 'https://ai.google.dev/gemini-api/docs/models/gemini-3.1-pro-preview',
  },
  // "The knowledge cutoff for Gemini 4 is March 2026", model card oficial:
  // https://deepmind.google/models/model-cards/gemini-4-argon/
  // Dia não publicado. Preservar unknown, sem inventar uma data completa.
  // Release GA: changelog Gemini API, 13/10/2026.
  'google/gemini-4-argon': {
    description:
      'Gemini 4 Argon avaliado sem ferramentas, com esforço alto, via OpenRouter. O fornecedor declara cutoff em março/2026, sem dia exato.',
    homepage: 'https://deepmind.google/models/model-cards/gemini-4-argon/',
    label: 'Gemini 4 Argon',
    modelId: 'google/gemini-4-argon',
    provider: 'Google · OpenRouter',
    releaseDate: '2026-10-13',
    releaseDateSource: 'https://ai.google.dev/gemini-api/docs/changelog',
    tier: 'proprietaria',
    trainingCutoff: undefined,
    trainingCutoffSource: undefined,
  },
};
