import type { Provider, ProviderResponse, RunInput } from '../types.js';
import type { ProviderBaseOptions } from './_http.js';
import { fetchWithTimeout } from './_http.js';
import { providerHttpError, responseAccounting } from './_usage.js';

type GoogleProviderOptions = ProviderBaseOptions;

/**
 * Provider Google Gemini — single-turn, sem `tools`, sem Google Search, sem
 * code execution. ADR 0002. API: generativelanguage.googleapis.com/v1beta.
 */
export function googleProvider(opts: GoogleProviderOptions): Provider {
  const apiKey = opts.apiKey ?? process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY;
  // Argon: default medium e sampling ignorado. Fixamos HIGH e usamos o
  // mínimo recomendado de saída/timeout, sem mudar os Gemini já publicados.
  // Fonte: https://ai.google.dev/gemini-api/docs/latest-model
  const isArgon = opts.model === 'gemini-4-argon';
  // Gemini 2.5+ usa tokens de "thinking" que contam contra maxOutputTokens
  // junto com o texto da resposta. Casos reais no Revalida mostraram
  // thoughtsTokenCount de 1400-2500 tokens; 2048 cortava a resposta. 8192
  // dá folga para pensamento + conteúdo.
  const maxTokens = opts.maxTokens ?? (isArgon ? 32768 : 8192);
  const temperature = opts.temperature ?? 0;
  const timeoutMs = opts.timeoutMs ?? (isArgon ? 900_000 : 90_000);

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
          ...(isArgon ? { thinkingConfig: { thinkingLevel: 'HIGH' } } : { temperature }),
        },
        systemInstruction: {
          parts: [{ text: input.systemPrompt }],
        },
      };

      const start = Date.now();
      // API key via header `x-goog-api-key` — evita que a chave apareça em
      // logs de proxy, histórico de processos ou mensagens de erro que
      // incluam a URL. A API Gemini aceita ambos os estilos.
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${opts.model}:generateContent`;
      const res = await fetchWithTimeout(
        url,
        {
          body: JSON.stringify(requestParams),
          headers: {
            'content-type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          method: 'POST',
        },
        timeoutMs,
      );
      const durationMs = Date.now() - start;

      if (!res.ok) {
        throw await providerHttpError('Google', res, 'google', url);
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
        ...responseAccounting(res, body, 'google', url),
        parsedAnswer: null,
        rawResponse,
        // Nunca inclua a API key nos logs de parâmetros.
        requestParams: { model: opts.model, ...requestParams },
        ...(body.candidates?.[0]?.finishReason
          ? { stopReason: body.candidates[0].finishReason }
          : {}),
        timings: { durationMs },
      };
    },
    trainingCutoff: opts.trainingCutoff,
  };
}
