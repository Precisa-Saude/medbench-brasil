import { describe, expect, it } from 'vitest';

import {
  isTransportError,
  smokeDiagnosis,
  smokeExitCode,
  smokeVerdict,
} from '../src/smoke-diagnosis.js';

describe('isTransportError', () => {
  // Mensagens reais colhidas na queda de rede durante o smoke dos seis
  // modelos OpenRouter na ENAMED 2026.
  it.each(['fetch failed', 'terminated', 'socket hang up', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'])(
    'reconhece %s como transporte',
    (msg) => {
      expect(isTransportError(msg)).toBe(true);
    },
  );

  // Erros reais desta edição: a requisição chegou ao fornecedor, mas nunca
  // chegou a uma inferência. Culpar o modelo por isso é o bug que o módulo
  // existe para evitar.
  // Erros reais desta edição: a requisição chegou ao fornecedor, mas nunca
  // chegou a uma inferência. Culpar o modelo por isso é o bug que o módulo
  // existe para evitar.
  it.each([
    'OpenRouter API erro 402: {"error":{"message":"in_flight_budget_exhausted"}}',
    'Anthropic API erro 400: credit balance is too low',
    'OpenRouter API erro 429: rate limit exceeded',
    'OpenAI API erro 503: Service Unavailable',
    'Google API erro 500: internal',
    'Convai · local API erro 401: unauthorized',
  ])('classifica %s como falha de ambiente', (msg) => {
    expect(isTransportError(msg)).toBe(true);
  });

  it('reconhece o timeout do próprio harness', () => {
    expect(
      isTransportError(
        'Requisição para https://api.anthropic.com/v1/messages excedeu timeout de 180000ms',
      ),
    ).toBe(true);
  });

  it('mantém fora o que é erro nosso de configuração', () => {
    // A fronteira não é "a rede funcionou?", e sim "dá para culpar o modelo?".
    // 404 de modelo aposentado e 400 de requisição malformada são condições
    // permanentes e nossas: INCONCLUSIVE ("tente de novo") seria conselho
    // errado, então seguem falhando alto.
    expect(isTransportError('Maritaca AI API erro 404: the model sabia-3 is deprecated')).toBe(
      false,
    );
    expect(
      isTransportError('Anthropic API erro 400: messages: text content blocks must be non-empty'),
    ).toBe(false);
  });
});

describe('smokeVerdict', () => {
  it('PASS quando bate o threshold, mesmo com ruído de rede', () => {
    // O modelo se provou nas tentativas que chegaram.
    expect(smokeVerdict({ ok: 7, threshold: 0.7, total: 8, transportErrors: 1 })).toBe('PASS');
  });

  it('FAIL quando não bate o threshold e não houve erro de rede', () => {
    expect(smokeVerdict({ ok: 3, threshold: 0.7, total: 8, transportErrors: 0 })).toBe('FAIL');
  });

  it('INCONCLUSIVE quando não bate o threshold mas houve erro de rede', () => {
    // O caso que motivou o módulo: 0/8 com a rede caindo não diz nada sobre
    // o modelo — antes isso era reportado como FAIL culpando o modelo.
    expect(smokeVerdict({ ok: 0, threshold: 0.7, total: 8, transportErrors: 8 })).toBe(
      'INCONCLUSIVE',
    );
  });

  it('INCONCLUSIVE com amostra vazia, sem dividir por zero', () => {
    expect(smokeVerdict({ ok: 0, threshold: 0.7, total: 0, transportErrors: 0 })).toBe(
      'INCONCLUSIVE',
    );
  });
});

describe('smokeExitCode', () => {
  it('separa problema de modelo (1) de problema de ambiente (2)', () => {
    expect(smokeExitCode('PASS')).toBe(0);
    expect(smokeExitCode('FAIL')).toBe(1);
    expect(smokeExitCode('INCONCLUSIVE')).toBe(2);
  });
});

describe('smokeDiagnosis', () => {
  it('não culpa o modelo quando a causa é rede', () => {
    const msg = smokeDiagnosis('INCONCLUSIVE', 8);
    expect(msg).toContain('INCONCLUSIVO');
    expect(msg).toContain('8 falha(s) de ambiente');
    expect(msg).not.toContain('ruim em pt-BR');
  });

  it('mantém o diagnóstico de formato/qualidade quando é FAIL de verdade', () => {
    expect(smokeDiagnosis('FAIL', 0)).toContain('parser não reconhece');
  });
});
