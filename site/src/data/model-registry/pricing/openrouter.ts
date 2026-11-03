import type { PublishedPricing } from '../pricing-types';

/** Valores literais de pricing no catálogo oficial, consultado em 03/11/2026. */
function price(input: number, output: number, quote: string): PublishedPricing {
  return {
    priceAsOf: '2026-11-03',
    pricePerMTokInputUSD: input,
    pricePerMTokOutputUSD: output,
    priceProvider: 'OpenRouter (catálogo público)',
    priceQuote: quote,
    priceSource: 'https://openrouter.ai/api/v1/models',
  };
}

export const OPENROUTER_PRICING: Record<string, PublishedPricing> = {
  // prompt "0.00000029", completion "0.00000114" (USD/token).
  'deepseek/deepseek-chat-v3-0324': price(
    0.29,
    1.14,
    'prompt: "0.00000029", completion: "0.00000114"',
  ),
  // prompt "0.00000025", completion "0.00000095" (USD/token).
  'deepseek/deepseek-chat-v3.1': price(
    0.25,
    0.95,
    'prompt: "0.00000025", completion: "0.00000095"',
  ),
  // prompt "0.0000016", completion "0.0000032" (USD/token).
  'deepseek/deepseek-v4-pro': price(1.6, 3.2, 'prompt: "0.0000016", completion: "0.0000032"'),
  // prompt "0.000002", completion "0.000012"; override min_prompt_tokens=200000.
  'google/gemini-3.1-pro-preview': {
    ...price(2, 12, 'prompt: "0.000002", completion: "0.000012"'),
    priceMaxInputTokens: 199_999,
  },
  // prompt "0.0000002", completion "0.00000052" (USD/token).
  'meta-llama/llama-3.3-70b-instruct': price(
    0.2,
    0.52,
    'prompt: "0.0000002", completion: "0.00000052"',
  ),
  // prompt "0.0000001875", completion "0.0000006525" (USD/token).
  'meta-llama/llama-4-maverick': price(
    0.1875,
    0.6525,
    'prompt: "0.0000001875", completion: "0.0000006525"',
  ),
  // prompt "0.0000001", completion "0.0000003" (USD/token).
  'meta-llama/llama-4-scout': price(0.1, 0.3, 'prompt: "0.0000001", completion: "0.0000003"'),
  // prompt "0.0000005", completion "0.0000015" (USD/token).
  'mistralai/mistral-large-2512': price(0.5, 1.5, 'prompt: "0.0000005", completion: "0.0000015"'),
  // prompt "0.000000192", completion "0.000015" (USD/token).
  'moonshotai/kimi-k3': price(0.192, 15, 'prompt: "0.000000192", completion: "0.000015"'),
  // prompt "0.00000009", completion "0.00000055" (USD/token).
  'qwen/qwen3-235b-a22b-2507': price(0.09, 0.55, 'prompt: "0.00000009", completion: "0.00000055"'),
  // prompt "0.00000026", completion "0.00000208" (USD/token).
  'qwen/qwen3.5-122b-a10b': price(0.26, 2.08, 'prompt: "0.00000026", completion: "0.00000208"'),
  // prompt "0.000000325", completion "0.00000195"; override min_prompt_tokens=256000.
  'qwen/qwen3.6-plus': {
    ...price(0.325, 1.95, 'prompt: "0.000000325", completion: "0.00000195"'),
    priceMaxInputTokens: 255_999,
  },
  // prompt "0.000001475", completion "0.000004425" (USD/token).
  'qwen/qwen3.7-max': price(1.475, 4.425, 'prompt: "0.000001475", completion: "0.000004425"'),
  // prompt "0.000002", completion "0.000006"; override min_prompt_tokens=200000.
  'x-ai/grok-4.5': {
    ...price(2, 6, 'prompt: "0.000002", completion: "0.000006"'),
    priceMaxInputTokens: 199_999,
  },
  // prompt "0.000002", completion "0.000006"; override min_prompt_tokens=200000.
  'x-ai/grok-4.7': {
    ...price(2, 6, 'prompt: "0.000002", completion: "0.000006"'),
    priceMaxInputTokens: 199_999,
  },
};
