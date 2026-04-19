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

  it('caso real Mistral Large: "é:" seguido de **X) e justificativa com outras letras no final', () => {
    // Resposta de exemplo do mistral-large-2512: a letra correta é C, mas a
    // justificativa lista A, B, D como incorretas no fim. Parser precisa
    // pegar a primeira letra MAIÚSCULA após a frase de compromisso.
    const real = [
      'A resposta correta é:',
      '',
      '**C) assegurar o direito às informações clínicas...**',
      '',
      '### Explicação:',
      'As outras alternativas estão incorretas porque:',
      '- **A)** Não considera o desejo da paciente.',
      '- **B)** Desencorajar o aborto não é papel do médico.',
      '- **D)** O médico não tem obrigação ética.',
    ].join('\n');
    expect(parseLetter(real)).toBe('C');
  });

  it('artigo "a" em minúsculas após "é" não é capturado como letra-resposta', () => {
    // "é a alternativa C" — o "a" é artigo, a resposta é C.
    expect(parseLetter('A resposta correta é a alternativa C.')).toBe('C');
  });

  it('letra no início seguida de newline, com justificativa em pt-BR depois', () => {
    // Caso real GPT-5.4: começa com "B\n\n<justificativa>" sem marcador explícito.
    // Regra 5 (última letra isolada) pegaria o artigo "a" por engano.
    const real =
      'B\n\nTerapia comportamental associada à reposição de nicotina é a conduta mais adequada.';
    expect(parseLetter(real)).toBe('B');

    // Justificativa com o artigo "A" em posição que confundiria o parser antigo.
    expect(parseLetter('D\n\nEm mulher em idade reprodutiva, a conduta é acompanhamento.')).toBe(
      'D',
    );

    // Letra seguida só de espaços/newline (sem texto adicional).
    expect(parseLetter('C\n\n')).toBe('C');
    expect(parseLetter('A\n')).toBe('A');
  });

  it('não regride: frase de compromisso ganha da letra inicial', () => {
    // Mesmo começando com "A" (artigo), a frase de compromisso aponta para C.
    expect(parseLetter('A resposta correta é C) paracetamol')).toBe('C');
  });

  it('retorna null quando nenhuma letra aparece', () => {
    expect(parseLetter('Não sei responder')).toBe(null);
    expect(parseLetter('')).toBe(null);
  });

  it('case-insensitive', () => {
    expect(parseLetter('resposta: d')).toBe('D');
  });
});
