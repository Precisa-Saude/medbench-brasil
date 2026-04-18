import type { Provider, ProviderResponse, RunInput } from '../types.js';

interface OpenAICompatOptions {
  apiKey?: string;
  /** Base URL sem o path — ex.: `http://localhost:11434/v1` para Ollama. */
  baseUrl: string;
  label?: string;
  maxTokens?: number;
  model: string;
  /** Nome do fornecedor para display — ex.: 'Ollama', 'vLLM'. */
  provider: string;
  temperature?: number;
  /** Timeout por requisição em ms (padrão 300000 — inferência local costuma ser lenta). */
  timeoutMs?: number;
  trainingCutoff?: string;
}

/**
 * Provider OpenAI-compatible genérico — usado para Ollama, vLLM, LiteLLM ou
 * qualquer endpoint que implemente `POST /chat/completions`. Mesmo protocolo
 * zero-tools do provider OpenAI oficial.
 */
export function openAiCompatProvider(opts: OpenAICompatOptions): Provider {
  const apiKey = opts.apiKey;
  // Modelos locais com reasoning (Qwen 3.x, DeepSeek R1) emitem cadeias de
  // pensamento longas antes de committar na resposta. Testes com Qwen 3.6
  // em questões do Revalida mostraram reasoning_len ~2500+ tokens; 2048 cortava
  // antes da letra. 8192 dá folga confortável para o conteúdo final.
  const maxTokens = opts.maxTokens ?? 8192;
  const temperature = opts.temperature ?? 0;
  const timeoutMs = opts.timeoutMs ?? 300_000;

  return {
    id: opts.model,
    label: opts.label ?? opts.model,
    provider: opts.provider,
    async run(input: RunInput): Promise<ProviderResponse> {
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
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      let res: Response;
      try {
        res = await fetch(`${opts.baseUrl.replace(/\/$/, '')}/chat/completions`, {
          body: JSON.stringify(requestParams),
          headers: {
            ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
            'content-type': 'application/json',
          },
          method: 'POST',
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }
      const durationMs = Date.now() - start;

      if (!res.ok) {
        throw new Error(`${opts.provider} API erro ${res.status}: ${await res.text()}`);
      }
      const body = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const rawResponse = body.choices?.[0]?.message?.content ?? '';

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
