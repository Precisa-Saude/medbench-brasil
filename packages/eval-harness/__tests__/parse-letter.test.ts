import { describe, expect, it } from 'vitest';

import { parseLetter } from '../src/runner.js';

describe('parseLetter', () => {
  it('resposta direta com marcadores de bold', () => {
    expect(parseLetter('A resposta correta é **D) 4**.')).toBe('D');
    expect(parseLetter('**B**')).toBe('B');
  });

  it('pega a última letra em parênteses, não a primeira em "A resposta"', () => {
    // Caso clássico do Qwen: começa com "A" (artigo) e termina com letra real
    expect(parseLetter('A resposta correta é C) paracetamol 500 mg')).toBe('C');
  });

  it('frase de compromisso em pt-BR', () => {
    expect(parseLetter('Após análise, a resposta é B')).toBe('B');
    expect(parseLetter('Portanto, a alternativa D é a correta.')).toBe('D');
    expect(parseLetter('Resposta: A')).toBe('A');
    expect(parseLetter('A letra correta é A')).toBe('A');
  });

  it('letra isolada quando não há marcador', () => {
    expect(parseLetter('D')).toBe('D');
    expect(parseLetter('  C  ')).toBe('C');
  });

  it('toma a última letra isolada quando há várias (Qwen emite "Analisando A, B, C, D... C")', () => {
    expect(parseLetter('Analisando A, B, C, D... a correta é C')).toBe('C');
  });

  it('retorna null quando nenhuma letra aparece', () => {
    expect(parseLetter('Não sei responder')).toBe(null);
    expect(parseLetter('')).toBe(null);
  });

  it('case-insensitive', () => {
    expect(parseLetter('resposta: d')).toBe('D');
  });
});
