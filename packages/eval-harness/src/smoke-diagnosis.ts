/**
 * Classificação de falhas do `smoke`.
 *
 * Motivação: rodando os seis modelos OpenRouter na ENAMED 2026, a máquina
 * perdeu rede no meio. O smoke reportou `FAIL — 0/8` para todos e imprimiu
 * "o modelo provavelmente emite resposta em formato que o parser não
 * reconhece, OU é genuinamente ruim em pt-BR médico" — quando as falhas eram
 * `fetch failed`. Sondagens diretas minutos antes mostravam os seis
 * respondendo normalmente. Um diagnóstico que culpa o modelo por queda de
 * rede leva à conclusão oposta da verdade.
 */

export type SmokeVerdict = 'FAIL' | 'INCONCLUSIVE' | 'PASS';

/**
 * Erros de transporte: rede, DNS, socket, timeout. Nada aqui diz nada sobre a
 * qualidade do modelo — só que a requisição não chegou ou não voltou.
 *
 * `terminated` e `fetch failed` são as mensagens do undici (fetch do Node)
 * quando a conexão morre no meio; as demais são erros de socket do SO.
 */
const TRANSPORT_PATTERNS = [
  /\bfetch failed\b/i,
  /\bterminated\b/i,
  /\bsocket hang up\b/i,
  /\bnetwork\b/i,
  /\bECONNRESET\b/,
  /\bECONNREFUSED\b/,
  /\bETIMEDOUT\b/,
  /\bENOTFOUND\b/,
  /\bEAI_AGAIN\b/,
  /\bEPIPE\b/,
  /\bAbortError\b/i,
  /excedeu timeout de/i,
];

export function isTransportError(message: string): boolean {
  return TRANSPORT_PATTERNS.some((re) => re.test(message));
}

/**
 * Veredito do smoke levando transporte em conta.
 *
 * - `PASS` quando a taxa de acerto bate o threshold. Vale mesmo com algum
 *   erro de rede no meio: o modelo se provou nas tentativas que chegaram.
 * - `INCONCLUSIVE` quando não bateu o threshold E houve erro de transporte.
 *   A amostra está incompleta, então não se pode culpar o modelo — nem
 *   aprová-lo. Sai com código próprio para o chamador distinguir.
 * - `FAIL` só quando não bateu o threshold sem nenhum erro de transporte,
 *   isto é, quando o modelo (ou o parser) é de fato o problema.
 */
export function smokeVerdict(input: {
  ok: number;
  threshold: number;
  total: number;
  transportErrors: number;
}): SmokeVerdict {
  if (input.total === 0) return 'INCONCLUSIVE';
  if (input.ok / input.total >= input.threshold) return 'PASS';
  return input.transportErrors > 0 ? 'INCONCLUSIVE' : 'FAIL';
}

/** Código de saída por veredito: 0 ok, 1 problema do modelo, 2 do ambiente. */
export function smokeExitCode(verdict: SmokeVerdict): number {
  if (verdict === 'PASS') return 0;
  return verdict === 'FAIL' ? 1 : 2;
}

/** Texto do diagnóstico, conforme a causa provável. */
export function smokeDiagnosis(verdict: SmokeVerdict, transportErrors: number): string {
  if (verdict === 'INCONCLUSIVE') {
    return (
      `\nINCONCLUSIVO — ${transportErrors} falha(s) de transporte (rede/DNS/socket/timeout). ` +
      'Não dá para julgar o modelo com a amostra incompleta: verifique a conectividade e rode de novo. ' +
      'Falhas abaixo:'
    );
  }
  return (
    '\nModelo provavelmente emite resposta em formato que o parser não reconhece, OU o modelo é ' +
    'genuinamente ruim em pt-BR médico. Revise os exemplos falhos:'
  );
}
