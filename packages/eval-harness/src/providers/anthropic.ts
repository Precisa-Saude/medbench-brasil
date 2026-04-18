import type { Provider, ProviderResponse, RunInput } from '../types.js';

interface AnthropicProviderOptions {
  apiKey?: string;
  label?: string;
  maxTokens?: number;
  model: string;
  temperature?: number;
  /** Timeout por requisição em ms (padrão 90000). */
  timeoutMs?: number;
  trainingCutoff?: string;
}

/**
 * Provider Anthropic — single-turn, sem tools, sem connectors, sem extended
 * thinking. Os únicos parâmetros passados à API além da mensagem são
 * `model`, `max_tokens`, `temperature` e `system`.
 */
export function anthropicProvider(opts: AnthropicProviderOptions): Provider {
  const apiKey = opts.apiKey ?? process.env.ANTHROPIC_API_KEY;
  const maxTokens = opts.maxTokens ?? 1024;
  const temperature = opts.temperature ?? 0;
  // Opus 4.x com reasoning estendido chega a ultrapassar 90s por chamada em
  // questões longas. 180s dá folga sem mascarar hangs reais.
  const timeoutMs = opts.timeoutMs ?? 180_000;

  return {
    id: opts.model,
    label: opts.label ?? opts.model,
    provider: 'Anthropic',
    async run(input: RunInput): Promise<ProviderResponse> {
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY ausente — defina no ambiente antes de rodar o harness.');
      }
      // Modelos Opus 4.x (e demais famílias com reasoning fixo) deprecam
      // o parâmetro `temperature`. Em vez de mandar 0 e ser rejeitado,
      // omitimos quando o nome do modelo indica família Opus 4+.
      const omitTemperature = /^claude-opus-[4-9]/i.test(opts.model);
      const requestParams = {
        max_tokens: maxTokens,
        messages: [{ content: input.userPrompt, role: 'user' }],
        model: opts.model,
        system: input.systemPrompt,
        ...(omitTemperature ? {} : { temperature }),
      } as const;

      const start = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      let res: Response;
      try {
        res = await fetch('https://api.anthropic.com/v1/messages', {
          body: JSON.stringify(requestParams),
          headers: {
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
            'x-api-key': apiKey,
          },
          method: 'POST',
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }
      const durationMs = Date.now() - start;

      if (!res.ok) {
        throw new Error(`Anthropic API erro ${res.status}: ${await res.text()}`);
      }
      const body = (await res.json()) as { content: Array<{ text?: string; type: string }> };
      const rawResponse = body.content
        .map((c) => (c.type === 'text' ? (c.text ?? '') : ''))
        .join('');

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
