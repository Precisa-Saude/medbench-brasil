import { anthropicProvider } from '../providers/anthropic.js';
import { googleProvider } from '../providers/google.js';
import { openAiProvider } from '../providers/openai.js';
import { openAiCompatProvider } from '../providers/openai-compat.js';
import { systemOneProvider } from '../providers/systemone.js';
import type { Provider } from '../types.js';

export type Backend =
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'ollama'
  | 'mlx'
  | 'maritaca'
  | 'together'
  | 'openrouter'
  | 'jev'
  | 'kev'
  | 'laya';

/**
 * Traduz os argumentos do CLI em uma instância de `Provider`. Backends
 * `maritaca`, `together`, `openrouter`, `ollama` e `mlx` reutilizam o provider
 * OpenAI-compatível apontando para os respectivos endpoints.
 */
export function buildProvider(backend: Backend, args: Record<string, string>): Provider {
  const model = args.model;
  if (!model) {
    throw new Error('--model é obrigatório');
  }
  const cutoff = args.cutoff;
  const label = args.label;
  const maxTokens = args['max-tokens'] ? Number(args['max-tokens']) : undefined;
  const timeoutMs = args['timeout-ms'] ? Number(args['timeout-ms']) : undefined;

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
        maxTokens,
        model,
        provider: 'Ollama',
        timeoutMs,
        trainingCutoff: cutoff,
      });
    case 'mlx':
      return openAiCompatProvider({
        baseUrl: args.baseUrl ?? 'http://localhost:8080/v1',
        label,
        maxTokens,
        model,
        provider: 'MLX',
        requestModel: args['request-model'],
        timeoutMs,
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
        // Só entra no body quando passado explicitamente (--reasoning-effort).
        // Ver o comentário em openai-compat.ts: ligar por default reescreveria
        // o protocolo dos modelos já medidos por esta rota.
        reasoningEffort: args['reasoning-effort'],
        // Mesmo motivo do mlx: `--model` é o id canônico gravado nos
        // resultados e `--request-model` é o nome que a rota conhece. Sem
        // isso, medir um modelo já avaliado por outra rota criaria linha
        // duplicada no leaderboard em vez de substituir a medição.
        requestModel: args['request-model'],
        trainingCutoff: cutoff,
      });
    }
    case 'jev': {
      // Jev roda no OpenRouter, mas NÃO em /chat/completions: modelos de
      // decisão são recusados lá com erro apontando para /api/alpha/decisions.
      const apiKey = args.apiKey ?? process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY ausente — defina no ambiente antes de rodar.');
      }
      return systemOneProvider({
        apiKey,
        baseUrl: args.baseUrl ?? 'https://openrouter.ai',
        label,
        model,
        path: '/api/alpha/decisions',
        provider: 'TypeSafe · OpenRouter',
        trainingCutoff: cutoff,
      });
    }
    case 'kev': {
      // Servidor local do repo jaredpalmer/kev, que implementa a mesma API.
      // Sem chave: é localhost.
      return systemOneProvider({
        baseUrl: args.baseUrl ?? 'http://localhost:8009',
        label,
        model,
        path: '/v1/systemone',
        provider: 'Kev · local',
        trainingCutoff: cutoff,
      });
    }
    case 'laya': {
      // Release oficial do Laya (Convai) atrás de um shim HTTP local que só
      // adapta transporte: o pacote é biblioteca Python e o harness fala
      // System One. Mesmo formato de pergunta tipada e de resposta, então o
      // provider é o mesmo. Router desabilitado no shim — o checkpoint
      // multilingual é carregado explicitamente (PRE-458).
      return systemOneProvider({
        baseUrl: args.baseUrl ?? 'http://localhost:8010',
        label,
        model,
        path: '/v1/systemone',
        provider: 'Convai · local',
        trainingCutoff: cutoff,
      });
    }
    default:
      throw new Error(`backend inválido: ${backend as string}`);
  }
}
