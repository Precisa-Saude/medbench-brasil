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
  accuracyByEdition?: Record<string, { accuracy: number; n: number; passesCutoff?: boolean }>;
  ci95: [number, number];
  /**
   * Em que se apoiou a classificação limpa/contaminada: corte declarado ou,
   * sem ele, a data de publicação dos pesos (open-weight) como limite
   * superior. Gravado pelo harness (`rescore --weights-release`).
   */
  contaminationBasis?: 'cutoff' | 'release-date';
  contaminationSplit: {
    clean: { accuracy: number; n: number } | null;
    contaminated: { accuracy: number; n: number } | null;
  };
  correct: number;
  macroF1?: number;
  modelId: string;
  perQuestion?: PerQuestionResult[];
  perSpecialty: Record<string, { accuracy: number; n: number }>;
  runsPerQuestion: number;
  total: number;
}

// `type` + intersection em vez de `interface extends` porque ModelMetadata é
// uma union discriminada (trainingCutoff/Source ambos string ou ambos
// undefined) — interface extending perde o narrowing entre os dois campos.
export type ModelResult = RawEvaluationArtifact &
  ModelMetadata & {
    accuracyByEdition: Record<string, { accuracy: number; n: number; passesCutoff?: boolean }>;
    cleanAccuracy: number | null;
    contaminatedAccuracy: number | null;
  };

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
  // Basta uma edição limpa pelo lançamento para a linha precisar dizer isso.
  const contaminationBasis = artifacts.some((a) => a.contaminationBasis === 'release-date')
    ? ('release-date' as const)
    : artifacts.find((a) => a.contaminationBasis)?.contaminationBasis;

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
    ...(contaminationBasis ? { contaminationBasis } : {}),
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

/**
 * Modelos que foram medidos mas **não** entram no leaderboard, com o motivo.
 *
 * A exclusão precisa ser explícita aqui: ter ou não entrada em
 * `model-registry/` não decide nada, porque `getModelMetadata` devolve um
 * fallback (`provider: 'desconhecido'`) para modelo sem metadado. Sem esta
 * lista, todo artefato em `results/` vira linha automaticamente.
 *
 * Medir e publicar são decisões distintas. O artefato fica no repositório em
 * qualquer caso — o que esta lista controla é a tabela pública.
 */
export const FORA_DO_LEADERBOARD: Record<string, string> = {
  // Controle de protocolo do ADR 0004, seção 10: pontua no acaso (24,7%,
  // IC95 19,8–30,3%) e serve para separar o efeito do protocolo do efeito do
  // modelo na comparação com o Kev-4B. A Convai posiciona o checkpoint para
  // roteamento, guardrails e moderação, nunca para conhecimento médico, então
  // não há alegação do fornecedor a verificar e a linha seria lida como o que
  // ela não é.
  'convaiinnovations/laya-multilingual': 'Controle de protocolo (ADR 0004, seção 10).',
};

export const MODELS: ModelResult[] = [...byModel.values()]
  .map((group) => normalise(combineArtifacts(group)))
  .filter((m) => !(m.modelId in FORA_DO_LEADERBOARD))
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
