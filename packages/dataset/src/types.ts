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

export type EditionId = `revalida-${number}-${1 | 2}` | `revalida-${number}`;

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
