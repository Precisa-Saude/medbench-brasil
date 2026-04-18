import type { Provider, ProviderResponse, RunInput } from '../types.js';

interface GoogleProviderOptions {
  apiKey?: string;
  label?: string;
  maxTokens?: number;
  model: string;
  temperature?: number;
  timeoutMs?: number;
  trainingCutoff?: string;
}

/**
 * Provider Google Gemini — single-turn, sem `tools`, sem Google Search, sem
 * code execution. ADR 0002. API: generativelanguage.googleapis.com/v1beta.
 */
export function googleProvider(opts: GoogleProviderOptions): Provider {
  const apiKey = opts.apiKey ?? process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY;
  // Gemini 2.5+ usa tokens de "thinking" que contam contra maxOutputTokens
  // junto com o texto da resposta. Casos reais no Revalida mostraram
  // thoughtsTokenCount de 1400-2500 tokens; 2048 cortava a resposta. 8192
  // dá folga para pensamento + conteúdo.
  const maxTokens = opts.maxTokens ?? 8192;
  const temperature = opts.temperature ?? 0;
  const timeoutMs = opts.timeoutMs ?? 90_000;

  return {
    id: opts.model,
    label: opts.label ?? opts.model,
    provider: 'Google',
    async run(input: RunInput): Promise<ProviderResponse> {
      if (!apiKey) {
        throw new Error(
          'GOOGLE_API_KEY (ou GEMINI_API_KEY) ausente — defina no ambiente antes de rodar.',
        );
      }
      const requestParams = {
        contents: [
          {
            parts: [{ text: input.userPrompt }],
            role: 'user',
          },
        ],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature,
        },
        systemInstruction: {
          parts: [{ text: input.systemPrompt }],
        },
      };

      const start = Date.now();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${opts.model}:generateContent?key=${apiKey}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      let res: Response;
      try {
        res = await fetch(url, {
          body: JSON.stringify(requestParams),
          headers: { 'content-type': 'application/json' },
          method: 'POST',
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }
      const durationMs = Date.now() - start;

      if (!res.ok) {
        throw new Error(`Google API erro ${res.status}: ${await res.text()}`);
      }
      const body = (await res.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
          finishReason?: string;
        }>;
      };
      // Gemini às vezes retorna candidates[0].content vazio (safety filter,
      // MAX_TOKENS sem texto, etc.). Retornamos string vazia nesses casos; o
      // runner marca a questão como incorreta com parsed=null. Evita crash.
      const parts = body.candidates?.[0]?.content?.parts ?? [];
      const rawResponse = parts.map((p) => p.text ?? '').join('');

      return {
        parsedAnswer: null,
        rawResponse,
        // Nunca inclua a API key nos logs de parâmetros.
        requestParams: { model: opts.model, ...requestParams },
        timings: { durationMs },
      };
    },
    trainingCutoff: opts.trainingCutoff,
  };
}
