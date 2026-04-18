/**
 * Metadados editoriais das edições Revalida avaliadas.
 *
 * Cortes e taxas de aprovação vêm do edital oficial da INEP e do Painel
 * Revalida. A média humana estimada é retrocalculada a partir do corte + taxa
 * de aprovação assumindo distribuição normal (ver docs/human-baseline.md).
 */

export interface EditionMetadata {
  id: string;
  label: string;
  /** Nota de corte oficial, escala 0–1. */
  cutoffScore: number;
  /** Taxa de aprovação oficial, escala 0–1. */
  passRate: number;
  /** Média humana estimada, escala 0–1. */
  estimatedHumanMean: number;
  /** Desvio-padrão assumido no retrocálculo. */
  estimatedHumanSd: number;
  /** Ano-semestre para ordenação no eixo do gráfico. */
  publishedAt: string;
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
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416,
  ];
  const plow = 0.02425;
  const phigh = 1 - plow;
  let q: number;
  let r: number;
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
  r = q * q;
  return (
    ((((((a[0]! * r + a[1]!) * r + a[2]!) * r + a[3]!) * r + a[4]!) * r + a[5]!) * q) /
    (((((b[0]! * r + b[1]!) * r + b[2]!) * r + b[3]!) * r + b[4]!) * r + 1)
  );
}

const SD = 0.11;

export const EDITIONS: Record<string, EditionMetadata> = {
  'revalida-2025-1': {
    cutoffScore: 0.6,
    estimatedHumanMean: estimateHumanMean(0.6, 0.18, SD),
    estimatedHumanSd: SD,
    id: 'revalida-2025-1',
    label: 'Revalida 2025/1',
    passRate: 0.18,
    publishedAt: '2025-04-14',
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
