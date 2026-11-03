import type { PublishedPricing } from '../pricing-types';

const source = 'https://developers.openai.com/api/docs/pricing';
function price(input: number, output: number, quote: string): PublishedPricing {
  return {
    priceAsOf: '2026-11-03',
    pricePerMTokInputUSD: input,
    pricePerMTokOutputUSD: output,
    priceProvider: 'OpenAI (API direta)',
    priceQuote: quote,
    priceSource: source,
  };
}

export const OPENAI_PRICING: Record<string, PublishedPricing> = {
  // Standard: "| gpt-5.1 | $1.25 | $10.00 | $0.125 |".
  'gpt-5.1': price(1.25, 10, '| gpt-5.1 | $1.25 | $10.00 | $0.125 |'),
  // Standard: "| gpt-5.2 | $1.75 | $14.00 | $0.175 |".
  'gpt-5.2': price(1.75, 14, '| gpt-5.2 | $1.75 | $14.00 | $0.175 |'),
  // Standard, short context: "| gpt-5.4 (<272K context length) | $2.50 | $15.00 |".
  'gpt-5.4': {
    ...price(2.5, 15, '| gpt-5.4 (<272K context length) | $2.50 | $15.00 |'),
    priceMaxInputTokens: 272_000,
  },
  // Standard: "| gpt-5.6-sol | $4.00 | $20.00 |". Promoção "at least through November 21, 2026".
  'gpt-5.6-sol': {
    ...price(4, 20, '| gpt-5.6-sol | $4.00 | $20.00 |'),
    priceMaxInputTokens: 272_000,
    priceValidThrough: '2026-11-21',
  },
};
