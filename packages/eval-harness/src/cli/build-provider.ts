import { anthropicProvider } from '../providers/anthropic.js';
import { googleProvider } from '../providers/google.js';
import { openAiProvider } from '../providers/openai.js';
import { openAiCompatProvider } from '../providers/openai-compat.js';
import type { Provider } from '../types.js';

export type Backend =
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'ollama'
  | 'maritaca'
  | 'together'
  | 'openrouter';

/**
 * Traduz os argumentos do CLI em uma instância de `Provider`. Backends
 * `maritaca`, `together` e `openrouter` reutilizam o provider OpenAI-compatível
 * apontando para os respectivos endpoints.
 */
export function buildProvider(backend: Backend, args: Record<string, string>): Provider {
  const model = args.model;
  if (!model) {
    throw new Error('--model é obrigatório');
  }
  const cutoff = args.cutoff;
  const label = args.label;

  switch (backend) {
    case 'anthropic':
      return anthropicProvider({ label, model, trainingCutoff: cutoff });
    case 'openai':
      return openAiProvider({ label, model, trainingCutoff: cutoff });
    case 'google':
      return googleProvider({ label, model, trainingCutoff: cutoff });
    case 'ollama':
      return openAiCompatProvider({
        baseUrl: args.baseUrl ?? 'http://localhost:11434/v1',
        label,
        model,
        provider: 'Ollama',
        trainingCutoff: cutoff,
      });
    case 'maritaca': {
      const apiKey = args.apiKey ?? process.env.MARITACA_API_KEY;
      if (!apiKey) {
        throw new Error('MARITACA_API_KEY ausente — defina no ambiente antes de rodar.');
      }
      return openAiCompatProvider({
        apiKey,
        baseUrl: args.baseUrl ?? 'https://chat.maritaca.ai/api',
        label,
        model,
        provider: 'Maritaca AI',
        trainingCutoff: cutoff,
      });
    }
    case 'together': {
      const apiKey = args.apiKey ?? process.env.TOGETHER_API_KEY;
      if (!apiKey) {
        throw new Error('TOGETHER_API_KEY ausente — defina no ambiente antes de rodar.');
      }
      return openAiCompatProvider({
        apiKey,
        baseUrl: args.baseUrl ?? 'https://api.together.xyz/v1',
        label,
        model,
        provider: 'Together AI',
        trainingCutoff: cutoff,
      });
    }
    case 'openrouter': {
      const apiKey = args.apiKey ?? process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY ausente — defina no ambiente antes de rodar.');
      }
      return openAiCompatProvider({
        apiKey,
        baseUrl: args.baseUrl ?? 'https://openrouter.ai/api/v1',
        label,
        model,
        provider: 'OpenRouter',
        trainingCutoff: cutoff,
      });
    }
    default:
      throw new Error(`backend inválido: ${backend as string}`);
  }
}
