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
 * Remove a query string antes de imprimir a URL em logs de erro. Todos os
 * providers atuais passam credenciais via header, mas defensivamente sanitizamos
 * — se um provider novo passar `?key=...` por engano, o erro não vaza segredo.
 */
function sanitizeUrl(url: string): string {
  const qIndex = url.indexOf('?');
  return qIndex === -1 ? url : url.slice(0, qIndex);
}

/**
 * `fetch` com AbortController + timeout. `clearTimeout` no finally garante que
 * o timer não vaza caso a request complete antes do prazo. Quando o timeout
 * dispara, traduz o `AbortError` genérico do runtime em mensagem com URL
 * sanitizada e duração, para diagnóstico mais rápido em runs longas.
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
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Requisição para ${sanitizeUrl(url)} excedeu timeout de ${timeoutMs}ms`, {
        cause: err,
      });
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
