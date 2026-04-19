export type QuestionOption = 'A' | 'B' | 'C' | 'D';

export type ContaminationRisk = 'likely-clean' | 'likely-contaminated' | 'unknown';

export type Specialty =
  | 'cirurgia'
  | 'clinica-medica'
  | 'ginecologia-obstetricia'
  | 'medicina-familia-comunidade'
  | 'pediatria'
  | 'saude-publica';

export interface Question {
  annulled: boolean;
  correct: QuestionOption;
  editionId: EditionId;
  hasImage: boolean;
  hasTable: boolean;
  id: string;
  notes?: string;
  number: number;
  options: Record<QuestionOption, string>;
  specialty: Specialty[];
  stem: string;
}

export type ExamFamily = 'revalida' | 'enamed';

export type EditionId = `revalida-${number}-${1 | 2}` | `revalida-${number}` | `enamed-${number}`;

/**
 * Extrai a família do exame a partir do `EditionId`. Ex.: `revalida-2025-1` →
 * `revalida`, `enamed-2025` → `enamed`. Usado pelo loader e pelo ingestor
 * para resolver o diretório de dados correto.
 */
export function examFamilyOf(id: EditionId): ExamFamily {
  return id.split('-')[0] as ExamFamily;
}

export interface Edition {
  cutoffScore: number;
  id: EditionId;
  passRate: number;
  publishedAt: string;
  questions: Question[];
  source: string;
  totalInscritos?: number;
  year: number;
}
