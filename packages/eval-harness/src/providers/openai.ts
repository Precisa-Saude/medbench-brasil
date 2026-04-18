import type { Provider, ProviderResponse, RunInput } from '../types.js';

interface OpenAIProviderOptions {
  apiKey?: string;
  label?: string;
  maxTokens?: number;
  model: string;
  temperature?: number;
  trainingCutoff?: string;
}

/**
 * Provider OpenAI — single-turn, sem `tools`, sem function calling, sem
 * `response_format` estruturado. Apenas `model`, `messages`, `max_tokens`,
 * `temperature`. ADR 0002.
 */
export function openAiProvider(opts: OpenAIProviderOptions): Provider {
  const apiKey = opts.apiKey ?? process.env.OPENAI_API_KEY;
  const maxTokens = opts.maxTokens ?? 16;
  const temperature = opts.temperature ?? 0;

  return {
    id: opts.model,
    label: opts.label ?? opts.model,
    provider: 'OpenAI',
    async run(input: RunInput): Promise<ProviderResponse> {
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY ausente — defina no ambiente antes de rodar o harness.');
      }
      const requestParams = {
        max_tokens: maxTokens,
        messages: [
          { content: input.systemPrompt, role: 'system' },
          { content: input.userPrompt, role: 'user' },
        ],
        model: opts.model,
        temperature,
      } as const;

      const start = Date.now();
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        body: JSON.stringify(requestParams),
        headers: {
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json',
        },
        method: 'POST',
      });
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
