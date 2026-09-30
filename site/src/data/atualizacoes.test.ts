import { describe, expect, it } from 'vitest';

import { ATUALIZACOES, formataData, TIPO_LABEL, ultimaAtualizacao } from './atualizacoes';

describe('formataData', () => {
  it('formata data ISO em pt-BR', () => {
    expect(formataData('2026-09-29')).toBe('29 set 2026');
    expect(formataData('2026-01-05')).toBe('5 jan 2026');
    expect(formataData('2026-12-31')).toBe('31 dez 2026');
  });

  it('não valida validade de calendário, e isso é deliberado', () => {
    // A função troca o número do mês pelo nome e reordena os campos. Não
    // constrói `Date` nem confere quantos dias o mês tem, então 29 de
    // fevereiro passa igual em ano bissexto e em ano comum, e 31 de fevereiro
    // também passa. Registrado como teste porque é limitação conhecida, não
    // descuido: a entrada é uma lista curada de onze datas escritas à mão,
    // conferidas contra o histórico do git, e validar calendário aqui
    // resolveria um erro que a curadoria já resolve.
    expect(formataData('2020-02-29')).toBe('29 fev 2020');
    expect(formataData('2021-02-29')).toBe('29 fev 2021');
    expect(formataData('2026-02-31')).toBe('31 fev 2026');
  });

  it('devolve a entrada crua quando não consegue formatar', () => {
    // Nenhum destes deve lançar: a função entra no caminho de exibição, e
    // derrubar a abertura por causa de uma data mal digitada seria pior do
    // que mostrar a string como está.
    for (const ruim of ['', 'abc', '2026', '2026-09', '2026-13-01', '2026-00-01', '--']) {
      expect(() => formataData(ruim)).not.toThrow();
      expect(formataData(ruim)).toBe(ruim);
    }
  });
});

describe('ATUALIZACOES', () => {
  it('está ordenada da mais recente para a mais antiga', () => {
    // A abertura mostra `ATUALIZACOES[0]` como "atualizado em". Se alguém
    // inserir uma entrada fora de ordem, a data exibida fica errada sem que
    // nada quebre, que é o tipo de erro que só aparece quando um leitor
    // estranha.
    const datas = ATUALIZACOES.map((a) => a.data);
    expect([...datas].sort().reverse()).toEqual(datas);
  });

  it('só usa datas em ISO YYYY-MM-DD', () => {
    for (const item of ATUALIZACOES) {
      expect(item.data).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(formataData(item.data)).not.toBe(item.data);
    }
  });

  it('só usa tipos com rótulo definido', () => {
    for (const item of ATUALIZACOES) {
      expect(TIPO_LABEL[item.tipo]).toBeTruthy();
    }
  });

  it('usa número de PR positivo quando declara um', () => {
    for (const item of ATUALIZACOES) {
      if (item.pr === undefined) continue;
      expect(Number.isInteger(item.pr)).toBe(true);
      expect(item.pr).toBeGreaterThan(0);
    }
  });
});

describe('ultimaAtualizacao', () => {
  it('devolve a data da entrada mais recente', () => {
    expect(ultimaAtualizacao()).toBe(ATUALIZACOES[0]?.data);
  });
});
