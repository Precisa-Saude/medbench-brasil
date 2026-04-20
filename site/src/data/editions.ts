/**
 * Metadados editoriais das edições Revalida avaliadas.
 *
 * Cortes e taxas de aprovação vêm do edital oficial da INEP e do Painel
 * Revalida. A média humana estimada é retrocalculada a partir do corte + taxa
 * de aprovação assumindo distribuição normal (ver docs/human-baseline.md).
 */

export interface EditionReference {
  /** Rótulo curto do chip flutuante (ex.: "Privada", "Pública"). */
  label: string;
  /** Posição horizontal no eixo 0–1 de precisão. */
  score: number;
  /** Texto exibido no tooltip ao passar o mouse. */
  tooltip: string;
}

export interface EditionSource {
  /** Autor institucional, em CAIXA ALTA conforme NBR 6023. */
  author: string;
  /** Local de publicação — quase sempre "Brasília". */
  location?: string;
  /** Data de publicação no formato "DD mmm. YYYY" (pt-BR abreviado). */
  publishedAt?: string;
  /** Título do recurso (renderizado em negrito). */
  title: string;
  /** URL canônica. */
  url: string;
}

export interface EditionMetadata {
  /** Nota de corte oficial, escala 0–1. */
  cutoffScore: number;
  /** Média humana estimada, escala 0–1. */
  estimatedHumanMean: number;
  /** Desvio-padrão assumido no retrocálculo. */
  estimatedHumanSd: number;
  /**
   * Linhas de referência extras (além de corte e média humana). Ex.: ENAMED
   * publica taxas de proficiência distintas para instituições públicas e
   * privadas — ajudam a contextualizar onde cada modelo cairia.
   */
  extraReferences?: EditionReference[];
  id: string;
  label: string;
  /** Taxa de aprovação oficial, escala 0–1. */
  passRate: number;
  /** Ano-semestre para ordenação no eixo do gráfico. */
  publishedAt: string;
  /**
   * Fontes para corte, taxa de aprovação e referências extras. Renderizadas
   * abaixo do gráfico em formato ABNT (NBR 6023:2018).
   */
  sources?: EditionSource[];
}

/**
 * Retrocálculo: se `cutoff` está no percentil `1 - passRate`, então
 *   z = Φ⁻¹(1 - passRate)
 *   mean = cutoff − z · sd
 * SD típico de provas padronizadas: 10–12% (usamos 11%).
 */
function estimateHumanMean(cutoff: number, passRate: number, sd = 0.11): number {
  const z = inverseNormal(1 - passRate);
  return cutoff - z * sd;
}

/** Aproximação de Φ⁻¹ (Beasley-Springer / Moro). Suficiente para fins de exibição. */
function inverseNormal(p: number): number {
  if (p <= 0 || p >= 1) return 0;
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2,
    -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1,
    -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734,
    4.374664141464968, 2.938163982698783,
  ];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const plow = 0.02425;
  const phigh = 1 - plow;
  let q: number;
  if (p < plow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
      ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1)
    );
  }
  if (p > phigh) {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return (
      -(((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
      ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1)
    );
  }
  q = p - 0.5;
  const r = q * q;
  return (
    ((((((a[0]! * r + a[1]!) * r + a[2]!) * r + a[3]!) * r + a[4]!) * r + a[5]!) * q) /
    (((((b[0]! * r + b[1]!) * r + b[2]!) * r + b[3]!) * r + b[4]!) * r + 1)
  );
}

const SD = 0.11;

export const EDITIONS: Record<string, EditionMetadata> = {
  // ENAMED 2025 — primeira edição, resultado divulgado em 12-dez-2025.
  // Nota de corte de proficiência: 60 pts na escala TRI (equivale a 57,87%
  // de itens corretos após exclusão de 10 itens por motivos administrativos/
  // psicométricos). Mantemos 0.60 no gráfico por simplicidade visual.
  // Taxa de proficiência: 75% geral (89.024 avaliados).
  // Pesos por tipo de instituição (para as linhas extras):
  //   Privada (for-profit 15409 × 57,2% + non-profit 12960 × 70,1%)/28369 ≈ 63,1%
  //   Pública (federal 6502 × 83,1% + estadual 2402 × 86,6%)/8904 ≈ 84,0%
  'enamed-2025': {
    cutoffScore: 0.6,
    estimatedHumanMean: estimateHumanMean(0.6, 0.75, SD),
    estimatedHumanSd: SD,
    extraReferences: [
      {
        label: 'Privada',
        score: 0.631,
        tooltip:
          'Média ponderada das instituições privadas (for-profit 57,2% e non-profit 70,1%, n=28.369).',
      },
      {
        label: 'Pública',
        score: 0.84,
        tooltip:
          'Média ponderada das instituições públicas (federais 83,1% e estaduais 86,6%, n=8.904).',
      },
    ],
    id: 'enamed-2025',
    label: 'ENAMED 2025',
    passRate: 0.75,
    publishedAt: '2025-10-26',
    sources: [
      {
        author: 'INSTITUTO NACIONAL DE ESTUDOS E PESQUISAS EDUCACIONAIS ANÍSIO TEIXEIRA',
        location: 'Brasília',
        publishedAt: '18 dez. 2025',
        title: 'Como são calculadas as notas do Enamed 2025',
        url: 'https://www.gov.br/inep/pt-br/centrais-de-conteudo/noticias/enamed/como-sao-calculadas-as-notas-do-enamed-2025',
      },
      {
        author: 'INSTITUTO NACIONAL DE ESTUDOS E PESQUISAS EDUCACIONAIS ANÍSIO TEIXEIRA',
        location: 'Brasília',
        publishedAt: '31 dez. 2025',
        title: 'Nota Técnica nº 19/2025 — cálculo do desempenho individual dos participantes',
        url: 'https://download.inep.gov.br/enamed/nota_tecnica_n_19_2025.pdf',
      },
      {
        author: 'INSTITUTO NACIONAL DE ESTUDOS E PESQUISAS EDUCACIONAIS ANÍSIO TEIXEIRA',
        location: 'Brasília',
        publishedAt: '19 jan. 2026',
        title: 'Divulgadas avaliação dos cursos de medicina e medidas de supervisão (Enamed 2025)',
        url: 'https://www.gov.br/inep/pt-br/centrais-de-conteudo/noticias/enamed/divulgadas-avaliacao-dos-cursos-de-medicina-e-medidas-de-supervisao',
      },
    ],
  },
  // Revalida 2024/1 — nota de corte 91,96/150 = 61,3%; aprovação 25,35%
  // (2.549 / 10.048 presentes na 1ª etapa).
  'revalida-2024-1': {
    cutoffScore: 0.6131,
    estimatedHumanMean: estimateHumanMean(0.6131, 0.2535, SD),
    estimatedHumanSd: SD,
    id: 'revalida-2024-1',
    label: 'Revalida 2024/1',
    passRate: 0.2535,
    publishedAt: '2024-04-14',
    sources: [
      {
        author: 'INSTITUTO NACIONAL DE ESTUDOS E PESQUISAS EDUCACIONAIS ANÍSIO TEIXEIRA',
        location: 'Brasília',
        publishedAt: '14 abr. 2024',
        title: 'Revalida 2024/1: nota de corte da 1ª etapa é de 91,96 pontos',
        url: 'https://www.gov.br/inep/pt-br/assuntos/noticias/revalida',
      },
      {
        author: 'ESTRATÉGIA MED',
        publishedAt: '2025',
        title: 'Como está a taxa de aprovação no Revalida Inep? Dados e números atualizados',
        url: 'https://med.estrategia.com/portal/revalida/aprovados-no-revalida-inep-confira-os-dados/',
      },
    ],
  },
  // Revalida 2024/2 — nota de corte 86,659/150 = 57,8%; aprovação 23,18%
  // (2.509 / 10.822).
  'revalida-2024-2': {
    cutoffScore: 0.5777,
    estimatedHumanMean: estimateHumanMean(0.5777, 0.2318, SD),
    estimatedHumanSd: SD,
    id: 'revalida-2024-2',
    label: 'Revalida 2024/2',
    passRate: 0.2318,
    publishedAt: '2024-10-20',
    sources: [
      {
        author: 'INSTITUTO NACIONAL DE ESTUDOS E PESQUISAS EDUCACIONAIS ANÍSIO TEIXEIRA',
        location: 'Brasília',
        publishedAt: '14 nov. 2024',
        title: 'Revalida 2024/2: nota de corte da 1ª etapa é de 86,659 pontos',
        url: 'https://www.gov.br/inep/pt-br/assuntos/noticias/revalida/revalida-2024-2-nota-de-corte-da-1a-etapa-e-de-86-659-pontos',
      },
      {
        author: 'ESTRATÉGIA MED',
        publishedAt: '2025',
        title: 'Como está a taxa de aprovação no Revalida Inep? Dados e números atualizados',
        url: 'https://med.estrategia.com/portal/revalida/aprovados-no-revalida-inep-confira-os-dados/',
      },
    ],
  },
  // Revalida 2025/1 — nota de corte 88/150 = 58,7%; aprovação 26,28%
  // (4.503 / 17.121 presentes na 1ª etapa).
  'revalida-2025-1': {
    cutoffScore: 0.5867,
    estimatedHumanMean: estimateHumanMean(0.5867, 0.2628, SD),
    estimatedHumanSd: SD,
    id: 'revalida-2025-1',
    label: 'Revalida 2025/1',
    passRate: 0.2628,
    publishedAt: '2025-04-14',
    sources: [
      {
        author: 'INSTITUTO NACIONAL DE ESTUDOS E PESQUISAS EDUCACIONAIS ANÍSIO TEIXEIRA',
        location: 'Brasília',
        publishedAt: '4 jun. 2025',
        title: 'Revalida 2025/1: nota de corte da 1ª etapa é de 88 pontos',
        url: 'https://www.gov.br/inep/pt-br/assuntos/noticias/revalida/revalida-2025-1-nota-de-corte-da-1a-etapa-e-de-88-pontos',
      },
      {
        author: 'ESTRATÉGIA MED',
        publishedAt: '2025',
        title: 'Como está a taxa de aprovação no Revalida Inep? Dados e números atualizados',
        url: 'https://med.estrategia.com/portal/revalida/aprovados-no-revalida-inep-confira-os-dados/',
      },
    ],
  },
};

export function getEditionMetadata(id: string): EditionMetadata {
  return (
    EDITIONS[id] ?? {
      cutoffScore: 0.6,
      estimatedHumanMean: 0.55,
      estimatedHumanSd: SD,
      id,
      label: id,
      passRate: 0.18,
      publishedAt: '',
    }
  );
}
