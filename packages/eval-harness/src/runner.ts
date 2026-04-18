import { getModelContaminationRisk, loadEdition } from '@precisa-saude/medbench-dataset';
import type { Edition, EditionId, Question, QuestionOption } from '@precisa-saude/medbench-dataset';

import { SYSTEM_PROMPT } from './prompt.js';
import { scoreRun, type RunRecord } from './scorer.js';
import type { EvaluationResult, Provider, RunConfig } from './types.js';

function renderUserPrompt(q: Question): string {
  const opts = (['A', 'B', 'C', 'D'] as QuestionOption[])
    .map((k) => `${k}) ${q.options[k]}`)
    .join('\n');
  return `${q.stem}\n\n${opts}`;
}

function parseLetter(raw: string): QuestionOption | null {
  const m = raw.trim().toUpperCase().match(/\b([ABCD])\b/);
  return m ? (m[1] as QuestionOption) : null;
}

export async function runEvaluation(
  provider: Provider,
  config: RunConfig,
): Promise<EvaluationResult> {
  const records: RunRecord[] = [];

  for (const editionId of config.editions) {
    const edition: Edition = loadEdition(editionId as EditionId);
    const questions = edition.questions.filter(
      (q) =>
        !q.annulled &&
        (!config.excludeImages || !q.hasImage) &&
        (!config.excludeTables || !q.hasTable),
    );

    const contamination = getModelContaminationRisk(edition, provider.trainingCutoff);

    for (const q of questions) {
      for (let run = 0; run < config.runsPerQuestion; run++) {
        const response = await provider.run({
          question: q,
          systemPrompt: SYSTEM_PROMPT,
          userPrompt: renderUserPrompt(q),
        });
        const parsed = response.parsedAnswer ?? parseLetter(response.rawResponse);
        records.push({
          contamination,
          correct: parsed === q.correct,
          parsed,
          question: q,
        });
      }
    }
  }

  return scoreRun(provider.id, config.runsPerQuestion, records);
}
