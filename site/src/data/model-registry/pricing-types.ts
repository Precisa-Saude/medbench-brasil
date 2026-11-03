/** Tarifa padrão de referência, não cobrança da execução histórica. */
export interface PublishedPricing {
  priceAsOf: string;
  /** Condição suficiente: a entrada agregada inteira cabe nessa faixa. */
  priceMaxInputTokens?: number;
  pricePerMTokInputUSD: number;
  pricePerMTokOutputUSD: number;
  priceProvider: string;
  priceQuote: string;
  priceSource: string;
  priceValidThrough?: string;
}

export type PricingFields = PublishedPricing | { [K in keyof PublishedPricing]?: undefined };
