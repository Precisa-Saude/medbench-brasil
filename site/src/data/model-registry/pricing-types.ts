/** Tarifa padrão de referência, não cobrança da execução histórica. */
export interface PublishedPricing {
  priceAsOf: string;
  /** Limite inclusivo de entrada por chamada na faixa de preço registrada. */
  priceMaxInputTokens?: number;
  pricePerMTokInputUSD: number;
  pricePerMTokOutputUSD: number;
  priceProvider: string;
  priceQuote: string;
  priceSource: string;
  priceValidThrough?: string;
}

export type PricingFields = PublishedPricing | { [K in keyof PublishedPricing]?: undefined };
