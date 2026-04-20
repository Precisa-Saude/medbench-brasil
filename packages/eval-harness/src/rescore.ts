/**
 * Utilitários de re-scoring offline: recomputam métricas (Macro-F1,
 * passesCutoff, Enade) a partir dos artefatos já persistidos em `results/`,
 * sem chamar providers. Útil para retroagir mudanças no `scorer` sem custo
 * de API/GPU — desde que o `raw.jsonl` ou o `perQuestion` do scored JSON
 * tenha sido preservado.
 */
import { readFileSync } from 'node:fs';

import type {
  ContaminationRisk,
  EditionId,
  Question,
  QuestionOption,
} from '@precisa-saude/medbench-dataset';
import { getModelContaminationRisk, loadEdition } from '@precisa-saude/medbench-dataset';

import { type RunRecord, scoreRun } from './scorer.js';
import type { EvaluationResult, PerQuestionResult, RawResponseRecord } from './types.js';

interface ScoredArtifact {
  modelId: string;
  perQuestion?: PerQuestionResult[];
  runsPerQuestion: number;
}

/**
 * Reconstrói RunRecord[] a partir do `perQuestion` de um scored JSON
 * existente e re-score. Preserva `modelId` e `runsPerQuestion` originais.
 * Não lê raw.jsonl — já sabemos a resposta parseada e o status de correção
 * de cada run.
 */
export function rescoreFromScored(scoredJsonPath: string): EvaluationResult {
  const raw = readFileSync(scoredJsonPath, 'utf8');
  const artifact = JSON.parse(raw) as ScoredArtifact;
  if (!artifact.perQuestion) {
    throw new Error(`scored artifact sem perQuestion — não pode ser re-scored: ${scoredJsonPath}`);
  }
  const records: RunRecord[] = [];
  for (const pq of artifact.perQuestion) {
    const question = pqToQuestion(pq);
    for (const run of pq.runs) {
      records.push({
        contamination: pq.contamination,
        correct: run.correct,
        parsed: run.parsed,
        question,
      });
    }
  }
  return scoreRun(artifact.modelId, artifact.runsPerQuestion, records);
}

/**
 * Reconstrói RunRecord[] a partir de um raw.jsonl. Usa o dataset canônico
 * para recuperar a `Question` completa e deriva a contaminação a partir do
 * `trainingCutoff` informado.
 *
 * Caso de uso típico: um scored JSON foi perdido mas o raw.jsonl ainda
 * existe (o chamado "órfão"). Este caminho é mais lento pois carrega a
 * edição inteira; quando possível prefira `rescoreFromScored`.
 */
export function rescoreFromRaw(options: {
  editionId: EditionId;
  excludeImages?: boolean;
  excludeTables?: boolean;
  modelId: string;
  rawLogPath: string;
  runsPerQuestion: number;
  trainingCutoff: string | undefined;
}): EvaluationResult {
  const raw = readFileSync(options.rawLogPath, 'utf8');
  const records: RawResponseRecord[] = [];
  let skipped = 0;
  let totalLines = 0;
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    totalLines += 1;
    try {
      records.push(JSON.parse(trimmed) as RawResponseRecord);
    } catch {
      skipped += 1;
    }
  }
  if (skipped > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      `rescoreFromRaw: ${skipped}/${totalLines} linhas corrompidas em ${options.rawLogPath} — descartadas.`,
    );
  }

  const edition = loadEdition(options.editionId);
  const contamination = getModelContaminationRisk(edition, options.trainingCutoff);
  const excludeImages = options.excludeImages ?? true;
  const excludeTables = options.excludeTables ?? true;
  const questions = new Map<string, Question>(
    edition.questions
      .filter(
        (q) => !q.annulled && (!excludeImages || !q.hasImage) && (!excludeTables || !q.hasTable),
      )
      .map((q) => [q.id, q]),
  );

  const runRecords: RunRecord[] = [];
  for (const rec of records) {
    if (rec.editionId !== options.editionId) continue;
    const question = questions.get(rec.questionId);
    if (!question) continue;
    runRecords.push({
      contamination,
      correct: rec.correct,
      parsed: rec.parsed,
      question,
    });
  }

  return scoreRun(options.modelId, options.runsPerQuestion, runRecords);
}

/**
 * Reconstrói uma `Question` apenas com os campos que `scoreRun` lê hoje
 * (id, number, editionId, correct, specialty). Os demais campos — `stem`,
 * `options`, `hasImage`, `hasTable`, `annulled` — ficam vazios porque não
 * são usados no cálculo de métricas. Se o scorer passar a depender desses
 * campos, o `rescoreFromScored` precisa evoluir para carregar a edição real
 * em vez de reconstruir a partir de `perQuestion`.
 */
function pqToQuestion(pq: PerQuestionResult): Question {
  return {
    annulled: false,
    correct: pq.correctAnswer,
    editionId: pq.editionId as EditionId,
    hasImage: false,
    hasTable: false,
    id: pq.questionId,
    number: pq.questionNumber,
    options: { A: '', B: '', C: '', D: '' },
    specialty: pq.specialty as Question['specialty'],
    stem: '',
  };
}

// Referência explícita para manter a tipagem `ContaminationRisk` acessível
// ao consumidor; TypeScript faz tree-shake do re-export se não for usado.
export type { ContaminationRisk, QuestionOption };
