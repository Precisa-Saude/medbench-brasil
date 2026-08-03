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
// A partir do GPT-5.5 a OpenAI rejeita `temperature` diferente do default:
// "Unsupported value: 'temperature' does not support 0 with this model. Only
// the default (1) value is supported."
//
// O piso foi **medido**, não inferido — sondagem contra a API em 2026-08-03,
// mandando `temperature: 0` em cada modelo:
//
//   gpt-5.4      aceita
//   gpt-5.5      rejeita
//   gpt-5.6-sol  rejeita
//
// Ou seja, a fronteira é 5.5, não 5.6. Refazer a sondagem antes de mexer neste
// piso: a OpenAI não publica um esquema de versionamento que permita deduzi-lo.
//
// O corte é por comparação numérica da minor version, não por regex de dígitos:
// `gpt-5.10` é posterior a `gpt-5.5`, e uma classe como `[5-9]|\d{2,}` acerta
// esse caso por acidente enquanto classifica `gpt-5.05` errado. Comparar
// número com número deixa a intenção explícita — "5.5 em diante".
const GPT5_TEMPERATURE_FLOOR = 5;

// Casa o prefixo `gpt-5.<minor>` e ignora o que vier depois — sufixo de
// variante (`gpt-5.6-sol`) ou patch (`gpt-5.6.1`) não mudam o comportamento do
// parâmetro, que é definido pela minor. Devolve `null` para qualquer coisa
// fora do formato (`gpt-5-mini`, `gpt-4o`), tratada pelas outras regras.
function gpt5MinorVersion(model: string): null | number {
  const m = /^gpt-5\.(\d+)/i.exec(model);
  return m ? Number(m[1]) : null;
}

function openAiModelQuirks(model: string): {
  isReasoningModel: boolean;
  omitTemperature: boolean;
  usesNewParamName: boolean;
} {
  const isReasoningModel = /^gpt-5/i.test(model) || /^o[1-9]/i.test(model);
  // GPT-5.1, 5.2 e 5.4 **aceitam** `temperature: 0` e já estão publicados em
  // `results/` com esse valor. Mantê-los fora do corte preserva a
  // comparabilidade: um re-run deles precisa mandar o mesmo parâmetro.
  const minor = gpt5MinorVersion(model);
  return {
    isReasoningModel,
    omitTemperature:
      /^gpt-5-nano/i.test(model) ||
      /^gpt-5-mini/i.test(model) ||
      (minor !== null && minor >= GPT5_TEMPERATURE_FLOOR) ||
      /^o[1-9]/i.test(model),
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
