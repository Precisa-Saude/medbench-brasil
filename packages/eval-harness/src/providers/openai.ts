import type { Provider, ProviderResponse, RunInput } from '../types.js';
import type { ProviderBaseOptions } from './_http.js';
import { fetchWithTimeout } from './_http.js';

type OpenAIProviderOptions = ProviderBaseOptions;

// Modelos GPT-5.x e família o1/o3 são reasoning models — gastam o budget de
// saída em cadeias de pensamento internas antes de emitir a letra final.
// 2048 é suficiente para GPT-4 mas ocasionalmente trunca reasoning em
// enunciados clínicos longos (observado em ENAMED 2025). Default maior para
// reasoning models; GPT-4 continua em 2048.
//
// Modelos GPT-5.x exigem `max_completion_tokens` (e `max_tokens` é rejeitado).
// Modelos GPT-4.x aceitam `max_tokens` e rejeitam o novo nome. gpt-5-nano,
// gpt-5-mini e a família o1/o3 rejeitam `temperature != 1` — omitimos.
function openAiModelQuirks(model: string): {
  isReasoningModel: boolean;
  omitTemperature: boolean;
  usesNewParamName: boolean;
} {
  const isReasoningModel = /^gpt-5/i.test(model) || /^o[1-9]/i.test(model);
  return {
    isReasoningModel,
    omitTemperature:
      /^gpt-5-nano/i.test(model) || /^gpt-5-mini/i.test(model) || /^o[1-9]/i.test(model),
    usesNewParamName: isReasoningModel,
  };
}

/**
 * Provider OpenAI — single-turn, sem `tools`, sem function calling, sem
 * `response_format` estruturado. Apenas `model`, `messages`, `max_tokens`,
 * `temperature`. ADR 0002.
 */
export function openAiProvider(opts: OpenAIProviderOptions): Provider {
  const apiKey = opts.apiKey ?? process.env.OPENAI_API_KEY;
  const quirks = openAiModelQuirks(opts.model);
  const maxTokens = opts.maxTokens ?? (quirks.isReasoningModel ? 8192 : 2048);
  const temperature = opts.temperature ?? 0;
  const timeoutMs = opts.timeoutMs ?? 90_000;

  return {
    id: opts.model,
    label: opts.label ?? opts.model,
    provider: 'OpenAI',
    async run(input: RunInput): Promise<ProviderResponse> {
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY ausente — defina no ambiente antes de rodar o harness.');
      }
      const requestParams = {
        ...(quirks.usesNewParamName
          ? { max_completion_tokens: maxTokens }
          : { max_tokens: maxTokens }),
        messages: [
          { content: input.systemPrompt, role: 'system' },
          { content: input.userPrompt, role: 'user' },
        ],
        model: opts.model,
        ...(quirks.omitTemperature ? {} : { temperature }),
      } as const;

      const start = Date.now();
      const res = await fetchWithTimeout(
        'https://api.openai.com/v1/chat/completions',
        {
          body: JSON.stringify(requestParams),
          headers: {
            authorization: `Bearer ${apiKey}`,
            'content-type': 'application/json',
          },
          method: 'POST',
        },
        timeoutMs,
      );
      const durationMs = Date.now() - start;

      if (!res.ok) {
        throw new Error(`OpenAI API erro ${res.status}: ${await res.text()}`);
      }
      const body = (await res.json()) as {
        choices: Array<{ message: { content: string } }>;
      };
      const rawResponse = body.choices[0]?.message.content ?? '';

      return {
        parsedAnswer: null,
        rawResponse,
        requestParams,
        timings: { durationMs },
      };
    },
    trainingCutoff: opts.trainingCutoff,
  };
}
