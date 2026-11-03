import type { PublishedPricing } from '../pricing-types';
import { ANTHROPIC_PRICING } from './anthropic';
import { GOOGLE_PRICING } from './google';
import { OPENAI_PRICING } from './openai';
import { OPENROUTER_PRICING } from './openrouter';

export const MODEL_PRICING: Record<string, PublishedPricing> = {
  ...ANTHROPIC_PRICING,
  ...GOOGLE_PRICING,
  ...OPENAI_PRICING,
  ...OPENROUTER_PRICING,
};

// Maritaca publica tarifas em BRL: sem câmbio verificado, USD desconhecido.
// HUGO, MLX e Kev locais não recebem tarifa de API nem custo zero fictício.
// DeepSeek R1, Mistral 2411 e Jev não tiveram tarifa exata verificada aqui.
