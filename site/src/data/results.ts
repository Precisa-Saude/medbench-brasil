/**
 * Carrega todos os artefatos `results/*.json` no build e os expõe já
 * enriquecidos com os metadados editoriais do modelo.
 *
 * Os campos `accuracyByEdition` e `perQuestion` são opcionais no artefato
 * (v0 do scorer não os produzia). Componentes dependentes devem fazer
 * fallback gracioso.
 */

import { getModelMetadata, type ModelMetadata } from './models';

export interface PerQuestionResult {
  contamination: 'likely-clean' | 'likely-contaminated' | 'unknown';
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  editionId: string;
  majority: 'A' | 'B' | 'C' | 'D' | null;
  majorityCorrect: boolean;
  questionId: string;
  questionNumber: number;
  runs: Array<{ correct: boolean; parsed: 'A' | 'B' | 'C' | 'D' | null }>;
  specialty: string[];
}

export interface RawEvaluationArtifact {
  accuracy: number;
  accuracyByEdition?: Record<string, { accuracy: number; n: number }>;
  ci95: [number, number];
  contaminationSplit: {
    clean: { accuracy: number; n: number } | null;
    contaminated: { accuracy: number; n: number } | null;
  };
  correct: number;
  modelId: string;
  perQuestion?: PerQuestionResult[];
  perSpecialty: Record<string, { accuracy: number; n: number }>;
  runsPerQuestion: number;
  total: number;
}

export interface ModelResult extends RawEvaluationArtifact, ModelMetadata {
  cleanAccuracy: number | null;
  contaminatedAccuracy: number | null;
  accuracyByEdition: Record<string, { accuracy: number; n: number }>;
}

const artifacts = import.meta.glob<RawEvaluationArtifact>('../../../results/*.json', {
  eager: true,
  import: 'default',
});

function normalise(raw: RawEvaluationArtifact): ModelResult {
  const meta = getModelMetadata(raw.modelId);
  const cleanAccuracy = raw.contaminationSplit.clean?.accuracy ?? null;
  const contaminatedAccuracy = raw.contaminationSplit.contaminated?.accuracy ?? null;
  return {
    ...raw,
    ...meta,
    accuracyByEdition: raw.accuracyByEdition ?? {},
    cleanAccuracy,
    contaminatedAccuracy,
  };
}

export const MODELS: ModelResult[] = Object.values(artifacts)
  .map((raw) => normalise(raw))
  .sort((a, b) => b.accuracy - a.accuracy);

export function findModel(modelId: string): ModelResult | undefined {
  return MODELS.find((m) => m.modelId === modelId);
}

export function allEditionIds(): string[] {
  const ids = new Set<string>();
  for (const m of MODELS) {
    for (const eid of Object.keys(m.accuracyByEdition)) ids.add(eid);
    for (const q of m.perQuestion ?? []) ids.add(q.editionId);
  }
  return [...ids].sort();
}
