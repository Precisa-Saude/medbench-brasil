export type QuestionOption = 'A' | 'B' | 'C' | 'D';

export type ContaminationRisk = 'likely-clean' | 'likely-contaminated' | 'unknown';

/**
 * Situação do gabarito que produziu os escores de uma edição.
 *
 * A INEP publica o gabarito em duas etapas: um preliminar poucos dias após a
 * aplicação e o definitivo depois da análise de recursos — na ENAMED 2026, a
 * prova foi em 13/09/2026 e o definitivo está previsto para 04/12/2026.
 * Rodar contra o preliminar é deliberado (a janela limpa fecha quando as
 * questões circulam na internet), mas o escore é provisório até o reprocesso
 * com `rescore --from-raw`. Este campo existe para que essa diferença nunca
 * fique implícita — nem no dataset, nem no site.
 */
export type AnswerKeyStatus = 'preliminar' | 'definitivo';

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
  /**
   * Parâmetro de dificuldade `b` do modelo Rasch 1PL, quando publicado pelo
   * INEP. Escala logit (≈ [−4, 4]). Opcional — só preenchido para edições
   * cujos parâmetros psicométricos oficiais estão disponíveis. Usado para
   * avaliação via IRT (ver Correia et al., PROPOR 2026).
   */
  difficulty?: number;
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

export const EXAM_FAMILIES = ['revalida', 'enamed'] as const satisfies readonly ExamFamily[];

/**
 * Extrai a família do exame a partir do `EditionId`. Ex.: `revalida-2025-1` →
 * `revalida`, `enamed-2025` → `enamed`. Usado pelo loader e pelo ingestor
 * para resolver o diretório de dados correto.
 *
 * Valida em runtime — se o prefixo não é uma família conhecida, lança.
 * Isso protege contra strings inválidas vindas de fora do sistema de tipos
 * (ex.: argumentos de CLI, JSON do disco) que o compilador não cobre.
 */
export function examFamilyOf(id: EditionId): ExamFamily {
  const family = id.split('-')[0];
  if (family !== 'revalida' && family !== 'enamed') {
    throw new Error(`EditionId inválido: "${id}" — família desconhecida "${family}"`);
  }
  return family;
}

export interface Edition {
  /**
   * Situação do gabarito usado. Ausente equivale a `'definitivo'` — todas as
   * edições anteriores à ENAMED 2026 foram ingeridas com gabarito pós-recurso.
   */
  answerKeyStatus?: AnswerKeyStatus;
  /**
   * Nota de corte oficial, escala 0–1. Opcional: só existe depois que a INEP
   * publica o edital de resultado. Ausente significa "não sabemos" — nunca
   * um valor plausível chutado, que viraria base de gráfico e citação.
   */
  cutoffScore?: number;
  /**
   * URL da publicação que fixa o `cutoffScore`.
   *
   * Regra: se o número está no arquivo, a fonte também está — a mesma regra
   * que o registry de modelos aplica ao corte de treino. Prefira publicação
   * oficial da INEP (edital, nota técnica, notícia institucional); quando só
   * houver fonte secundária, registre-a ainda assim, porque procedência real
   * e fraca é melhor que citação forte não verificada. Sem nenhuma fonte, o
   * campo fica ausente e o número também deveria ficar.
   *
   * Links da INEP podem responder 403/login durante o período eleitoral, sem
   * que a URL esteja errada.
   */
  cutoffScoreSource?: string;
  id: EditionId;
  /**
   * Taxa de aprovação oficial, escala 0–1. Opcional pelo mesmo motivo do
   * `cutoffScore`, e com atraso maior: é resultado da aplicação, não do
   * edital. Na ENAMED 2026 só sai em 04/12/2026.
   */
  passRate?: number;
  /**
   * URL da publicação que fixa o `passRate`. Ver `cutoffScoreSource`.
   *
   * Nas edições Revalida o valor vem hoje de fonte secundária, não da INEP —
   * a substanciação contra o Painel Revalida está pendente.
   */
  passRateSource?: string;
  publishedAt: string;
  questions: Question[];
  source: string;
  totalInscritos?: number;
  year: number;
}
