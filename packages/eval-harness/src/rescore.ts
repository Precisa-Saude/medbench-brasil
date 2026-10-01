/**
 * Utilitários de re-scoring offline: recomputam métricas (Macro-F1,
 * passesCutoff, Enade) a partir dos artefatos já persistidos em `results/`,
 * sem chamar providers. Útil para retroagir mudanças no `scorer` sem custo
 * de API/GPU — desde que o `raw.jsonl` ou o `perQuestion` do scored JSON
 * tenha sido preservado.
 */
import { readFileSync } from 'node:fs';

import type {
  ContaminationBasis,
  ContaminationRisk,
  EditionId,
  Question,
  QuestionOption,
} from '@precisa-saude/medbench-dataset';
import { classifyContamination, loadEdition } from '@precisa-saude/medbench-dataset';

import {
  describeRawCoverage,
  hasRawExclusions,
  isRawCoverageComplete,
  partitionRawRecords,
} from './raw-coverage.js';
import { type RunRecord, scoreRun } from './scorer.js';
import type { EvaluationResult, PerQuestionResult, RawResponseRecord } from './types.js';

interface ScoredArtifact {
  contaminationBasis?: ContaminationBasis;
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
  // A contaminação vem do `perQuestion` já persistido, então a base que a
  // decidiu também precisa atravessar o re-score — sem isso um `rescore` geral
  // apagaria a marcação de que o "limpo" veio da data de lançamento.
  const result = scoreRun(artifact.modelId, artifact.runsPerQuestion, records);
  return artifact.contaminationBasis
    ? { ...result, contaminationBasis: artifact.contaminationBasis }
    : result;
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
  /**
   * Pontua mesmo com cobertura incompleta, registrando `rawCoverage` no
   * resultado. Escape hatch para trabalho de recuperação — o padrão é
   * reprovar, para que perda de dado não passe por resultado melhor (#45).
   */
  allowPartial?: boolean;
  editionId: EditionId;
  excludeImages?: boolean;
  excludeTables?: boolean;
  modelId: string;
  rawLogPath: string;
  runsPerQuestion: number;
  trainingCutoff: string | undefined;
  /**
   * Data de publicação dos pesos, usada como limite superior do corte quando
   * `trainingCutoff` não foi declarado. Só para open-weight com data de fonte
   * publicada — ver `classifyContamination` e docs/contamination.md.
   */
  weightsReleaseDate?: string;
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
  const { basis, risk: contamination } = classifyContamination(
    edition,
    options.trainingCutoff,
    options.weightsReleaseDate,
  );
  const excludeImages = options.excludeImages ?? true;
  const excludeTables = options.excludeTables ?? true;
  const questions = new Map<string, Question>(
    edition.questions
      .filter(
        (q) => !q.annulled && (!excludeImages || !q.hasImage) && (!excludeTables || !q.hasTable),
      )
      .map((q) => [q.id, q]),
  );

  // Valida a matriz questões-elegíveis × runs ANTES de pontuar: sem isso um
  // log truncado produz métricas de aparência normal sobre o que sobrou (#45).
  // `accepted` vem da MESMA passada que calculou a cobertura, então
  // `runRecords.length` é sempre igual a `coverage.observedRecords`.
  const { accepted, coverage } = partitionRawRecords({
    editionId: options.editionId,
    eligibleQuestionIds: questions.keys(),
    malformedLines: skipped,
    records,
    runsPerQuestion: options.runsPerQuestion,
  });
  const complete = isRawCoverageComplete(coverage);
  if (!complete && options.allowPartial !== true) {
    throw new Error(describeRawCoverage(coverage, options.rawLogPath));
  }
  if (complete && hasRawExclusions(coverage)) {
    // A matriz fechou, então não reprova — mas registro descartado não pode
    // desaparecer sem deixar rastro: artefato completo não grava `rawCoverage`.
    const naoZeradas = Object.entries(coverage.exclusions)
      .filter(([, n]) => n > 0)
      .map(([motivo, n]) => `${motivo}=${n}`)
      .join(', ');
    // eslint-disable-next-line no-console
    console.warn(
      `rescoreFromRaw: cobertura completa em ${options.rawLogPath}, com exclusões — ${naoZeradas}`,
    );
  }

  const runRecords: RunRecord[] = accepted.map((rec) => {
    // `accepted` só contém registro cujo `questionId` passou por
    // `eligible.has(...)`, e `eligible` é construído de `questions.keys()`
    // logo acima — então o `get` não pode falhar. Falha aqui significa que a
    // invariante se rompeu; erro alto e explícito em vez de `!` silencioso.
    //
    // Deliberadamente NÃO é `continue`: pular o registro faria
    // `runRecords.length` cair abaixo de `coverage.observedRecords`, quebrando
    // em silêncio a invariante que o partition único existe para garantir.
    const question = questions.get(rec.questionId);
    if (!question) {
      throw new Error(
        `invariante rompida: ${rec.questionId} está em accepted mas não no conjunto elegível de ${options.editionId}`,
      );
    }
    return { contamination, correct: rec.correct, parsed: rec.parsed, question };
  });

  const scored = scoreRun(options.modelId, options.runsPerQuestion, runRecords);
  const result = basis ? { ...scored, contaminationBasis: basis } : scored;
  // Presença de `rawCoverage` no artefato = algo não fechou. Cobertura
  // completa não grava o campo, mantendo os artefatos estáveis byte a byte.
  return complete ? result : { ...result, rawCoverage: coverage };
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
