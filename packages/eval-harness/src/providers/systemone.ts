import type { QuestionOption } from '@precisa-saude/medbench-dataset';

import type { Provider, ProviderResponse, RunInput } from '../types.js';
import type { ProviderBaseOptions } from './_http.js';
import { fetchWithTimeout } from './_http.js';

/**
 * Cliente da API System One — modelos de decisão.
 *
 * Serve Jev (hospedado no OpenRouter) e Kev (servidor local), que têm o
 * MESMO schema de requisição e resposta e diferem só no caminho:
 *
 * | Modelo | Base URL                  | Caminho                 |
 * | ------ | ------------------------- | ----------------------- |
 * | Jev    | https://openrouter.ai     | /api/alpha/decisions    |
 * | Kev    | http://localhost:8009     | /v1/systemone           |
 *
 * Diferente dos providers generativos, aqui não há texto para parsear: o
 * modelo devolve a alternativa escolhida e o vetor de probabilidades numa
 * passada. Ver ADR 0004 para o mapeamento do protocolo do ADR 0002.
 */
interface SystemOneOptions extends ProviderBaseOptions {
  baseUrl: string;
  /**
   * Caminho do endpoint. Não tem default de propósito: mandar o corpo do
   * System One para `/chat/completions` é recusado com erro explícito pelo
   * OpenRouter, e errar isso em silêncio seria pior.
   */
  path: string;
  provider: string;
}

/** Nome da pergunta no payload. Fixo — o protocolo é uma pergunta por chamada. */
const QUESTION_KEY = 'resposta';

interface SystemOneAnswer {
  choice?: string;
  confidence?: number;
  probabilities?: Record<string, number>;
  type?: string;
}

export function systemOneProvider(opts: SystemOneOptions): Provider {
  const timeoutMs = opts.timeoutMs ?? 300_000;

  return {
    id: opts.model,
    label: opts.label ?? opts.model,
    provider: opts.provider,
    async run(input: RunInput): Promise<ProviderResponse> {
      // `state` = enunciado verbatim; `criteria` = as quatro alternativas
      // chaveadas A–D, na mesma ordem que o modelo generativo vê.
      // `instructions` reusa o SYSTEM_PROMPT literal: mesma instrução nos dois
      // protocolos é o que mantém a comparação honesta (ADR 0004 §1).
      const requestParams = {
        // Registrados como não aplicáveis, não omitidos: a distinção entre
        // "não se aplica" e "não registramos" importa para auditoria.
        max_tokens: 'n/a',
        model: opts.model,
        questions: {
          [QUESTION_KEY]: {
            criteria: input.question.options,
            instructions: input.systemPrompt,
            type: 'choice',
          },
        },
        state: input.question.stem,
        temperature: 'n/a',
      };

      const start = Date.now();
      const res = await fetchWithTimeout(
        `${opts.baseUrl.replace(/\/$/, '')}${opts.path}`,
        {
          body: JSON.stringify(requestParams),
          headers: {
            ...(opts.apiKey ? { authorization: `Bearer ${opts.apiKey}` } : {}),
            'content-type': 'application/json',
          },
          method: 'POST',
        },
        timeoutMs,
      );
      const durationMs = Date.now() - start;

      if (!res.ok) {
        throw new Error(`${opts.provider} API erro ${res.status}: ${await res.text()}`);
      }

      const body = (await res.json()) as {
        answers?: Record<string, SystemOneAnswer>;
        model?: string;
        truncated?: boolean | null;
        usage?: Record<string, unknown>;
      };
      const answer = body.answers?.[QUESTION_KEY];
      if (!answer) {
        throw new Error(
          `${opts.provider}: resposta sem a pergunta "${QUESTION_KEY}" — corpo: ${JSON.stringify(body).slice(0, 200)}`,
        );
      }

      const choice = answer.choice;
      const parsedAnswer =
        choice === 'A' || choice === 'B' || choice === 'C' || choice === 'D'
          ? (choice as QuestionOption)
          : null;

      // O vetor inteiro vai para o raw.jsonl: sem ele não há como recalcular
      // calibração nem refazer o score depois (ADR 0004 §6). Guardamos também
      // o snapshot resolvido que o provider reporta — é a identidade real do
      // modelo por trás de um alias.
      const rawResponse = JSON.stringify({
        choice: choice ?? null,
        confidence: answer.confidence ?? null,
        probabilities: answer.probabilities ?? null,
        resolvedModel: body.model ?? null,
        // Vem do provider, e `null` quando ele não informa. Antes era a
        // constante `false`, o que gravava "não truncou" sem ninguém ter
        // medido — exatamente a confusão entre "não se aplica" e "não
        // registramos" que o ADR 0004 §6 existe para evitar. Um teto de
        // contexto estourado silenciosamente é o tipo de coisa que viraria
        // conclusão errada sobre o modelo.
        truncated: body.truncated ?? null,
        usage: body.usage ?? null,
      });

      return {
        parsedAnswer,
        rawResponse,
        requestParams,
        timings: { durationMs },
      };
    },
    trainingCutoff: opts.trainingCutoff,
  };
}
