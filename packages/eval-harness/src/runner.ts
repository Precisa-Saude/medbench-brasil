import type { Edition, EditionId, Question, QuestionOption } from '@precisa-saude/medbench-dataset';
import { getModelContaminationRisk, loadEdition } from '@precisa-saude/medbench-dataset';

import { SYSTEM_PROMPT } from './prompt.js';
import { type RunRecord, scoreRun } from './scorer.js';
import type { EvaluationResult, Provider, RunConfig } from './types.js';

function renderUserPrompt(q: Question): string {
  const opts = (['A', 'B', 'C', 'D'] as QuestionOption[])
    .map((k) => `${k}) ${q.options[k]}`)
    .join('\n');
  return `${q.stem}\n\n${opts}`;
}

/**
 * Extrai a letra de resposta (A, B, C, D) do texto bruto emitido pelo modelo.
 *
 * Modelos com reasoning (Qwen 3.x, DeepSeek R1, etc.) emitem cadeias de
 * pensamento + resposta final, tipicamente com marcadores como "**D**",
 * "D)", "resposta é D", "alternativa D". Em pt-BR os artigos "A" e "O"
 * colidem com letras de opção, portanto um regex ingênuo pego no início do
 * texto responde "A" para qualquer frase que comece com "A resposta…".
 *
 * Estratégia (em ordem, a primeira que casar vence):
 *   1. Letra entre asteriscos em markdown: `**X**`
 *   2. Frases de compromisso: "resposta (correta )?é (a alternativa )?X",
 *      "é a letra X", "opção X", "alternativa X"
 *   3. Última ocorrência de `X)` (letra seguida de parêntese)
 *   4. Última ocorrência de letra isolada `\bX\b`
 */
export function parseLetter(raw: string): QuestionOption | null {
  const text = raw.trim();
  const upper = text.toUpperCase();

  const bold = upper.match(/\*\*\s*([ABCD])\s*\*\*/);
  if (bold) return bold[1] as QuestionOption;

  const commitment = upper.match(
    /(?:RESPOSTA(?:\s+CORRETA)?\s+É\s+(?:A\s+)?(?:LETRA\s+|ALTERNATIVA\s+|OP[CÇ][AÃ]O\s+)?|É\s+(?:A\s+)?(?:LETRA\s+|ALTERNATIVA\s+|OP[CÇ][AÃ]O\s+)|LETRA\s+|ALTERNATIVA\s+|OP[CÇ][AÃ]O\s+)([ABCD])\b/,
  );
  if (commitment) return commitment[1] as QuestionOption;

  const parenMatches = [...upper.matchAll(/\b([ABCD])\)/g)];
  if (parenMatches.length > 0) {
    return parenMatches[parenMatches.length - 1]![1] as QuestionOption;
  }

  const loneMatches = [...upper.matchAll(/\b([ABCD])\b/g)];
  if (loneMatches.length > 0) {
    return loneMatches[loneMatches.length - 1]![1] as QuestionOption;
  }

  return null;
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
