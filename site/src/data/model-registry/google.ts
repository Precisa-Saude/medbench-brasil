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
  // 3.1 Flash-Lite: nem o model card ("Gemini 3.1 Flash-Lite is based on Gemini
  // 3 Pro.", sem data de corte), nem a página do modelo na Gemini API (só
  // "Latest update: May 2026", que não é corte), nem o changelog publicam
  // knowledge cutoff (verificado em 2026-09-27) → `undefined`. O corte do 3 Pro
  // não é herdado: seria inferência, não declaração do fornecedor. Release GA em
  // 2026-05-07 conforme o changelog ("Gemini 3.1 Flash-Lite" GA; preview em
  // 2026-03-03).
  'gemini-3.1-flash-lite': {
    description:
      'Modelo mais leve da geração 3.1 do Gemini, otimizado para latência, escala e custo. Avaliado no default da API, sem raciocínio.',
    homepage: 'https://deepmind.google/technologies/gemini/',
    label: 'Gemini 3.1 Flash-Lite',
    modelId: 'gemini-3.1-flash-lite',
    provider: 'Google',
    releaseDate: '2026-05-07',
    tier: 'proprietaria',
    trainingCutoff: undefined,
    trainingCutoffSource: undefined,
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
  // "The knowledge cutoff date for Gemini 3.7 Flash is March 2026 – users can
  // expect updated information for some domains while in others they may
  // experience the model's knowledge is limited to January 2025" — model card
  // do Gemini 3.7 Flash (DeepMind). Usamos o corte declarado (março/2026), que é
  // o conservador para contaminação. Release em 2026-08-13 conforme o changelog
  // da Gemini API.
  'gemini-3.7-flash': {
    description:
      'Flash da geração 3.7 do Gemini (agosto/2026), com raciocínio ativado por padrão na API.',
    homepage: 'https://deepmind.google/technologies/gemini/',
    label: 'Gemini 3.7 Flash',
    modelId: 'gemini-3.7-flash',
    provider: 'Google',
    releaseDate: '2026-08-13',
    tier: 'proprietaria',
    trainingCutoff: '2026-03-01',
    trainingCutoffSource: 'https://deepmind.google/models/model-cards/gemini-3-7-flash/',
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
