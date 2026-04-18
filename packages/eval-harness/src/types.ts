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
  /** Máximo de requisições simultâneas ao provider. Padrão 1 (serial). */
  concurrency?: number;
  editions: string[];
  excludeImages: boolean;
  excludeTables: boolean;
  runsPerQuestion: number;
}

export interface PerQuestionResult {
  contamination: 'likely-clean' | 'likely-contaminated' | 'unknown';
  correctAnswer: QuestionOption;
  editionId: string;
  majority: QuestionOption | null;
  majorityCorrect: boolean;
  questionId: string;
  questionNumber: number;
  runs: Array<{ correct: boolean; parsed: QuestionOption | null }>;
  specialty: string[];
}

export interface EvaluationResult {
  accuracy: number;
  /** Agregado por edição. Opcional para manter back-compat com artefatos v0. */
  accuracyByEdition?: Record<string, { accuracy: number; n: number }>;
  ci95: [number, number];
  contaminationSplit: {
    clean: { accuracy: number; n: number } | null;
    contaminated: { accuracy: number; n: number } | null;
  };
  correct: number;
  modelId: string;
  perSpecialty: Record<string, { accuracy: number; n: number }>;
  /**
   * Uma entrada por questão distinta, agregando as `runsPerQuestion` execuções.
   * Apenas a letra parseada é persistida — nunca texto bruto do modelo.
   * Opcional para manter back-compat com artefatos v0.
   */
  perQuestion?: PerQuestionResult[];
  runsPerQuestion: number;
  total: number;
}
