/**
 * Infraestrutura compartilhada entre os quatro providers.
 *
 * Qualquer provider que faz chamada HTTP deve usar `fetchWithTimeout` para
 * garantir que timeouts abortam a request e liberam o timer. Não adicione
 * retries, middleware ou interceptors — cada execução do harness é single-shot
 * (ADR 0002).
 */

export interface ProviderBaseOptions {
  apiKey?: string;
  label?: string;
  maxTokens?: number;
  model: string;
  temperature?: number;
  /** Timeout por requisição em ms. Default é por provider. */
  timeoutMs?: number;
  trainingCutoff?: string;
}

/**
 * `fetch` com AbortController + timeout. `clearTimeout` no finally garante que
 * o timer não vaza caso a request complete antes do prazo.
 */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}
