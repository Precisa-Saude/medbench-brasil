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
  accuracyByEdition: Record<string, { accuracy: number; n: number }>;
  cleanAccuracy: number | null;
  contaminatedAccuracy: number | null;
}

// Artefatos agora ficam em `results/<edition>/<model>.json` — um arquivo por
// par (modelo, edição). Precisamos agregar múltiplas edições para um mesmo
// modelId antes de renderizar no leaderboard.
const artifacts = import.meta.glob<RawEvaluationArtifact>('../../../results/*/*.json', {
  eager: true,
  import: 'default',
});

// Artefatos antigos (pré-update do scorer) não trazem accuracyByEdition. Como
// o path do arquivo já carrega a edição (results/<edition>/<model>.json),
// reconstruímos o campo quando estiver ausente — assim os gráficos por edição
// não deixam de fora modelos válidos só por falta de metadado na versão v0
// do artefato.
function backfillEdition(path: string, raw: RawEvaluationArtifact): RawEvaluationArtifact {
  if (raw.accuracyByEdition && Object.keys(raw.accuracyByEdition).length > 0) {
    return raw;
  }
  const editionMatch = path.match(/\/results\/([^/]+)\/[^/]+\.json$/);
  if (!editionMatch) return raw;
  const editionId = editionMatch[1]!;
  return {
    ...raw,
    accuracyByEdition: { [editionId]: { accuracy: raw.accuracy, n: raw.total } },
  };
}

type SplitBucket = { accuracy: number; n: number } | null;

function mergeBuckets(a: SplitBucket, b: SplitBucket): SplitBucket {
  if (!a) return b;
  if (!b) return a;
  const n = a.n + b.n;
  if (n === 0) return { accuracy: 0, n: 0 };
  const correct = a.accuracy * a.n + b.accuracy * b.n;
  return { accuracy: correct / n, n };
}

function mergePerSpecialty(
  a: RawEvaluationArtifact['perSpecialty'],
  b: RawEvaluationArtifact['perSpecialty'],
): RawEvaluationArtifact['perSpecialty'] {
  const out: RawEvaluationArtifact['perSpecialty'] = { ...a };
  for (const [sp, bucket] of Object.entries(b)) {
    const existing = out[sp];
    out[sp] = existing ? (mergeBuckets(existing, bucket) ?? bucket) : bucket;
  }
  return out;
}

function wilsonInterval(successes: number, total: number): [number, number] {
  if (total === 0) return [0, 0];
  const p = successes / total;
  const z = 1.96;
  const denom = 1 + (z * z) / total;
  const center = (p + (z * z) / (2 * total)) / denom;
  const margin = (z * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total))) / denom;
  return [Math.max(0, center - margin), Math.min(1, center + margin)];
}

function combineArtifacts(artifacts: RawEvaluationArtifact[]): RawEvaluationArtifact {
  const first = artifacts[0]!;
  let total = 0;
  let correct = 0;
  let accuracyByEdition: Record<string, { accuracy: number; n: number }> = {};
  let perSpecialty: RawEvaluationArtifact['perSpecialty'] = {};
  let perQuestion: PerQuestionResult[] = [];
  let clean: SplitBucket = null;
  let contaminated: SplitBucket = null;

  for (const a of artifacts) {
    total += a.total;
    correct += a.correct;
    accuracyByEdition = { ...accuracyByEdition, ...(a.accuracyByEdition ?? {}) };
    perSpecialty = mergePerSpecialty(perSpecialty, a.perSpecialty);
    perQuestion = [...perQuestion, ...(a.perQuestion ?? [])];
    clean = mergeBuckets(clean, a.contaminationSplit.clean);
    contaminated = mergeBuckets(contaminated, a.contaminationSplit.contaminated);
  }

  return {
    accuracy: total === 0 ? 0 : correct / total,
    accuracyByEdition,
    ci95: wilsonInterval(correct, total),
    contaminationSplit: { clean, contaminated },
    correct,
    modelId: first.modelId,
    perQuestion,
    perSpecialty,
    runsPerQuestion: first.runsPerQuestion,
    total,
  };
}

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

const byModel = new Map<string, RawEvaluationArtifact[]>();
for (const [path, raw] of Object.entries(artifacts)) {
  const enriched = backfillEdition(path, raw);
  const list = byModel.get(enriched.modelId) ?? [];
  list.push(enriched);
  byModel.set(enriched.modelId, list);
}

export const MODELS: ModelResult[] = [...byModel.values()]
  .map((group) => normalise(combineArtifacts(group)))
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
