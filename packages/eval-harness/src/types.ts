import type { Question, QuestionOption } from '@precisa-saude/medbench-dataset';

export interface Provider {
  /** Identificador estável no leaderboard (ex.: 'claude-sonnet-4-6'). */
  id: string;
  /** Rótulo humano (ex.: 'Claude Sonnet 4.6'). */
  label: string;
  /** Empresa responsável (ex.: 'Anthropic'). */
  provider: string;
  /**
   * Envia uma questão única ao modelo e retorna a resposta bruta + parâmetros.
   * Implementações DEVEM ser single-turn, sem ferramentas, sem histórico.
   */
  run: (input: RunInput) => Promise<ProviderResponse>;
  /** ISO-8601 (YYYY-MM-DD). Declarado pelo fornecedor. */
  trainingCutoff: string | undefined;
}

export interface RunInput {
  question: Question;
  systemPrompt: string;
  userPrompt: string;
}

export interface ProviderResponse {
  parsedAnswer: QuestionOption | null;
  rawResponse: string;
  requestParams: Record<string, unknown>;
  timings: { durationMs: number };
}

export interface RunConfig {
  editions: string[];
  excludeImages: boolean;
  excludeTables: boolean;
  runsPerQuestion: number;
}

export interface EvaluationResult {
  accuracy: number;
  ci95: [number, number];
  contaminationSplit: {
    clean: { accuracy: number; n: number } | null;
    contaminated: { accuracy: number; n: number } | null;
  };
  correct: number;
  modelId: string;
  perSpecialty: Record<string, { accuracy: number; n: number }>;
  runsPerQuestion: number;
  total: number;
}
