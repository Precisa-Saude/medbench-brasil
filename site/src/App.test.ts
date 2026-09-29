import { describe, expect, it } from 'vitest';

import { decodificaHash } from './App';

describe('decodificaHash', () => {
  it('decodifica hash normal', () => {
    expect(decodificaHash('#modelos-de-decisao')).toBe('modelos-de-decisao');
    expect(decodificaHash('#se%C3%A7%C3%A3o')).toBe('seção');
  });

  it('devolve null para hash vazio', () => {
    expect(decodificaHash('')).toBeNull();
    expect(decodificaHash('#')).toBeNull();
  });

  it('não lança em sequência percent malformada', () => {
    // Regressão: `decodeURIComponent('%')` lança URIError, e sem o try a
    // exceção subia do efeito e derrubava a árvore inteira — `/metodologia#%`
    // renderizava tela vazia.
    for (const ruim of ['#%', '#%E0%A4%A', '#%%%', '#100%']) {
      expect(() => decodificaHash(ruim)).not.toThrow();
      expect(decodificaHash(ruim)).toBe(ruim.slice(1));
    }
  });
});
