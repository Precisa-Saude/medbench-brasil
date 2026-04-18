/**
 * Resultados de avaliação agregados — placeholder para v1.
 * Cada objeto é o output do scorer (`EvaluationResult` de medbench-harness).
 * Em produção, estes JSONs serão gerados pelo harness e commitados em `results/`.
 */

export interface ModelResult {
  accuracy: number;
  accuracyByEdition: Record<string, number>;
  accuracyBySpecialty: Record<string, number>;
  ci95: [number, number];
  cleanAccuracy: number | null;
  contaminatedAccuracy: number | null;
  label: string;
  modelId: string;
  provider: string;
  releaseDate: string;
  tier: 'proprietaria' | 'open-weight' | 'brasileira';
  trainingCutoff: string | undefined;
}

export const MODELS: ModelResult[] = [];
