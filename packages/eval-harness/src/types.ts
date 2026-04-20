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
  /**
   * Callback invocado uma vez por chamada ao modelo, com a resposta bruta.
   * O runner usa isso para persistir log JSONL auditável (ver cli.ts). Se
   * undefined, raw responses são descartadas após o parsing.
   */
  onRawResponse?: (record: RawResponseRecord) => void;
  /**
   * Resultados de execuções anteriores (do JSONL bruto). Se presente, o runner
   * reaproveita essas respostas em vez de chamar o provider — retomada sem
   * custo após falha no meio do run. Chave lógica: (editionId, questionId, run).
   */
  priorRecords?: RawResponseRecord[];
  runsPerQuestion: number;
}

export interface RawResponseRecord {
  correct: boolean;
  editionId: string;
  elapsedMs: number;
  modelId: string;
  parsed: QuestionOption | null;
  questionId: string;
  rawResponse: string;
  requestParams: Record<string, unknown>;
  run: number;
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
  /**
   * Agregado por edição. `passesCutoff` indica se a precisão do modelo nessa
   * edição atinge a nota de corte oficial (ver `Edition.cutoffScore`).
   * Opcional para manter back-compat com artefatos v0.
   */
  accuracyByEdition?: Record<string, { accuracy: number; n: number; passesCutoff?: boolean }>;
  ci95: [number, number];
  contaminationSplit: {
    clean: { accuracy: number; n: number } | null;
    contaminated: { accuracy: number; n: number } | null;
  };
  correct: number;
  /**
   * Macro-F1 não ponderado calculado sobre as quatro classes (A/B/C/D) a
   * partir da resposta majoritária por questão (maioria das runs). Reportado
   * lado a lado com Accuracy conforme Correia et al. (PROPOR 2026) para
   * detectar viés de classe quando o N é pequeno. Opcional por back-compat.
   */
  macroF1?: number;
  modelId: string;
  /**
   * Uma entrada por questão distinta, agregando as `runsPerQuestion` execuções.
   * Apenas a letra parseada é persistida — nunca texto bruto do modelo.
   * Opcional para manter back-compat com artefatos v0.
   */
  perQuestion?: PerQuestionResult[];
  perSpecialty: Record<string, { accuracy: number; n: number }>;
  runsPerQuestion: number;
  total: number;
}
