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

  // Ordem dos padrões (do sinal mais forte para o mais fraco):
  //   1. Strict commit: "resposta/alternativa/letra/opção" + "correta/é/foi"
  //      — take LAST, cobre modelos que argumentam várias letras antes de fechar.
  //   2. Bold **X** (fallback se não houve commit explícito) — take FIRST.
  //   3. Loose commit: só a palavra de compromisso — "Resposta: A".
  //   4. Última ocorrência de X)
  //   5. Última letra isolada \bX\b.
  const commitWord = String.raw`(?:\bresposta\b|\balternativa\b|\bletra\b|\bop[cç][aã]o\b)`;
  const commitSuffix = String.raw`(?:\bcorreta\b|\bé\b|\bser[íi]a?\b|\bfoi\b)`;
  const strictPhrase = new RegExp(`${commitWord}[\\s,.:*\\-–]*${commitSuffix}`, 'gi');
  const loosePhrase = new RegExp(commitWord, 'gi');

  const strictMatches = [...text.matchAll(strictPhrase)];
  for (let i = strictMatches.length - 1; i >= 0; i--) {
    const m = strictMatches[i]!;
    if (m.index === undefined) continue;
    const lookahead = text.slice(m.index + m[0].length, m.index + m[0].length + 80);
    const firstLetter = lookahead.match(/\b([ABCD])\b/);
    if (firstLetter) return firstLetter[1] as QuestionOption;
  }

  const bold = upper.match(/\*\*\s*([ABCD])\s*\*\*/);
  if (bold) return bold[1] as QuestionOption;

  const looseMatches = [...text.matchAll(loosePhrase)];
  for (let i = looseMatches.length - 1; i >= 0; i--) {
    const m = looseMatches[i]!;
    if (m.index === undefined) continue;
    const lookahead = text.slice(m.index + m[0].length, m.index + m[0].length + 80);
    const firstLetter = lookahead.match(/\b([ABCD])\b/);
    if (firstLetter) return firstLetter[1] as QuestionOption;
  }

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

const RETRY_DELAYS_MS = [1000, 3000, 10_000];

function isRetryable(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const name = err.name;
  const msg = err.message;
  // undici às vezes embrulha ECONNRESET em 'TypeError: terminated' com a
  // causa real na propriedade .cause (err.cause.message === 'read ECONNRESET').
  // Checamos mensagem + nome + cause.message.
  const causeMsg =
    err.cause && err.cause instanceof Error
      ? err.cause.message
      : typeof err.cause === 'object' && err.cause && 'message' in err.cause
        ? String((err.cause as { message: unknown }).message)
        : '';
  const haystack = `${name}\n${msg}\n${causeMsg}`;
  if (name === 'AbortError' || /operation was aborted/i.test(haystack)) return true;
  if (/ECONNRESET|ETIMEDOUT|ENETUNREACH|EAI_AGAIN|fetch failed|terminated/i.test(haystack))
    return true;
  if (/erro 5\d\d/i.test(haystack)) return true;
  if (/erro 429/i.test(haystack)) return true;
  return false;
}

async function runWithRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === RETRY_DELAYS_MS.length || !isRetryable(err)) throw err;
      const delay = RETRY_DELAYS_MS[attempt]!;
      // eslint-disable-next-line no-console
      console.warn(
        `[${label}] tentativa ${attempt + 1} falhou, retry em ${delay}ms:`,
        err instanceof Error ? err.message.slice(0, 120) : err,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error(`[${label}] retry loop inesperado`);
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
    const tasks: Array<{ q: Question; run: number }> = [];
    for (const q of questions) {
      for (let run = 0; run < config.runsPerQuestion; run++) {
        tasks.push({ q, run });
      }
    }
    const total = tasks.length;
    const concurrency = Math.max(1, config.concurrency ?? 1);
    let cursor = 0;
    let done = 0;
    let correctSoFar = 0;
    const startAll = Date.now();

    async function worker() {
      while (true) {
        const idx = cursor++;
        if (idx >= tasks.length) return;
        const { q, run } = tasks[idx]!;
        const start = Date.now();
        const response = await runWithRetry(
          () =>
            provider.run({
              question: q,
              systemPrompt: SYSTEM_PROMPT,
              userPrompt: renderUserPrompt(q),
            }),
          `${provider.id} ${q.id} run${run + 1}`,
        );
        const parsed = response.parsedAnswer ?? parseLetter(response.rawResponse);
        const correct = parsed === q.correct;
        records.push({ contamination, correct, parsed, question: q });
        if (config.onRawResponse) {
          config.onRawResponse({
            correct,
            editionId,
            elapsedMs: response.timings.durationMs,
            modelId: provider.id,
            parsed,
            questionId: q.id,
            rawResponse: response.rawResponse,
            requestParams: response.requestParams,
            run: run + 1,
          });
        }
        done += 1;
        if (correct) correctSoFar += 1;
        const elapsedMs = Date.now() - start;
        const totalElapsed = (Date.now() - startAll) / 1000;
        const etaSec = done > 0 ? Math.round((totalElapsed / done) * (total - done)) : 0;
        // eslint-disable-next-line no-console
        console.log(
          `  [${done}/${total}] ${q.id} run${run + 1}: ${parsed ?? '?'} vs ${q.correct} ${correct ? 'OK' : '--'} (${elapsedMs}ms) | acc ${((correctSoFar / done) * 100).toFixed(1)}% | eta ${etaSec}s`,
        );
      }
    }

    await Promise.all(Array.from({ length: concurrency }, () => worker()));
  }

  return scoreRun(provider.id, config.runsPerQuestion, records);
}
