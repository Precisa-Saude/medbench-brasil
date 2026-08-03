import type { Provider, ProviderResponse, RunInput } from '../types.js';
import type { ProviderBaseOptions } from './_http.js';
import { fetchWithTimeout } from './_http.js';

type AnthropicProviderOptions = ProviderBaseOptions;

// Modelos Opus 4.x (e demais famílias com reasoning fixo) deprecam o parâmetro
// `temperature`. Fable 5, Mythos 5 e a geração 5 (Opus 5, Sonnet 5) vão além:
// rejeitam sampling params com 400 ("`temperature` is deprecated for this
// model"). Em vez de mandar 0 e ser rejeitado, omitimos quando o nome do
// modelo indica essas famílias.
const OMITS_TEMPERATURE = /^claude-(opus-[4-9]|sonnet-[5-9]|fable-|mythos-)/i;

// Famílias que raciocinam SEM o parâmetro `thinking` ser enviado: Fable 5 e
// Mythos 5 (thinking sempre ativo, não desligável) e a geração 5 (Opus 5 e
// Sonnet 5, adaptive thinking ligado por padrão). Nessas, `max_tokens` limita
// thinking + texto visível JUNTOS — com o teto de 1024 a resposta é truncada
// (`stop_reason: "max_tokens"`) e às vezes sai vazia. Pior: truncar o
// raciocínio no meio muda a letra escolhida, então o teto baixo não mede
// conhecimento médico, mede quão rápido o modelo conclui. Opus 4.7/4.8 NÃO
// entram aqui: sem o parâmetro `thinking` eles rodam sem raciocínio e 1024
// basta para o texto da resposta.
const THINKS_BY_DEFAULT = /^claude-(opus-[5-9]|sonnet-[5-9]|fable-|mythos-)/i;

// Teto para modelos que raciocinam por padrão. 8192 é o mesmo valor já usado
// por todos os modelos servidos via OpenAI-compat no corpus, então mantém a
// comparação entre fornecedores em pé de igualdade.
const THINKING_MAX_TOKENS = 8192;
const DEFAULT_MAX_TOKENS = 1024;

function anthropicModelQuirks(model: string): {
  defaultMaxTokens: number;
  omitTemperature: boolean;
} {
  return {
    defaultMaxTokens: THINKS_BY_DEFAULT.test(model) ? THINKING_MAX_TOKENS : DEFAULT_MAX_TOKENS,
    omitTemperature: OMITS_TEMPERATURE.test(model),
  };
}

/**
 * Provider Anthropic — single-turn, sem tools e sem connectors. Os únicos
 * parâmetros passados à API além da mensagem são `model`, `max_tokens`,
 * `temperature` e `system`.
 *
 * O parâmetro `thinking` nunca é enviado. Isso não equivale a "sem reasoning":
 * Fable 5 e Mythos 5 raciocinam sempre (não é desligável pela API) e Opus 5 e
 * Sonnet 5 raciocinam por padrão quando o parâmetro é omitido. Ver
 * `THINKS_BY_DEFAULT` — é por isso que essas famílias precisam de um
 * `max_tokens` maior.
 */
export function anthropicProvider(opts: AnthropicProviderOptions): Provider {
  const apiKey = opts.apiKey ?? process.env.ANTHROPIC_API_KEY;
  const { defaultMaxTokens, omitTemperature } = anthropicModelQuirks(opts.model);
  const maxTokens = opts.maxTokens ?? defaultMaxTokens;
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
      const requestParams = {
        max_tokens: maxTokens,
        messages: [{ content: input.userPrompt, role: 'user' }],
        model: opts.model,
        system: input.systemPrompt,
        ...(omitTemperature ? {} : { temperature }),
      } as const;

      const start = Date.now();
      const res = await fetchWithTimeout(
        'https://api.anthropic.com/v1/messages',
        {
          body: JSON.stringify(requestParams),
          headers: {
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
            'x-api-key': apiKey,
          },
          method: 'POST',
        },
        timeoutMs,
      );
      const durationMs = Date.now() - start;

      if (!res.ok) {
        throw new Error(`Anthropic API erro ${res.status}: ${await res.text()}`);
      }
      const body = (await res.json()) as {
        content: Array<{ text?: string; type: string }>;
        stop_reason?: string;
      };
      const rawResponse = body.content
        .map((c) => (c.type === 'text' ? (c.text ?? '') : ''))
        .join('');

      return {
        parsedAnswer: null,
        rawResponse,
        requestParams,
        stopReason: body.stop_reason,
        timings: { durationMs },
      };
    },
    trainingCutoff: opts.trainingCutoff,
  };
}
