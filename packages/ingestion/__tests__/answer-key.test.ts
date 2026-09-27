import { describe, expect, it } from 'vitest';

import { gabaritoFilename, parseAnswerKeyStatus, resolveAnswerKey } from '../src/answer-key.js';

describe('gabaritoFilename', () => {
  it('carrega a situação no nome do arquivo', () => {
    expect(gabaritoFilename('preliminar')).toBe('gabarito-preliminar.pdf');
    expect(gabaritoFilename('definitivo')).toBe('gabarito-definitivo.pdf');
  });
});

describe('parseAnswerKeyStatus', () => {
  it('assume definitivo quando a flag é omitida', () => {
    expect(parseAnswerKeyStatus(undefined)).toBe('definitivo');
  });

  it('aceita as duas situações válidas', () => {
    expect(parseAnswerKeyStatus('preliminar')).toBe('preliminar');
    expect(parseAnswerKeyStatus('definitivo')).toBe('definitivo');
  });

  it('rejeita valor desconhecido em vez de cair no default', () => {
    expect(() => parseAnswerKeyStatus('provisorio')).toThrow(/inválido/);
    // 'true' é o que parseArgs produz para uma flag sem valor — não pode
    // passar silenciosamente como definitivo.
    expect(() => parseAnswerKeyStatus('true')).toThrow(/inválido/);
  });
});

describe('resolveAnswerKey', () => {
  it('prefere o definitivo quando os dois existem', () => {
    expect(resolveAnswerKey(() => true)).toEqual({
      filename: 'gabarito-definitivo.pdf',
      status: 'definitivo',
    });
  });

  it('cai para o preliminar quando só ele existe', () => {
    const exists = (f: string) => f === 'gabarito-preliminar.pdf';
    expect(resolveAnswerKey(exists)).toEqual({
      filename: 'gabarito-preliminar.pdf',
      status: 'preliminar',
    });
  });

  it('usa o definitivo quando só ele existe', () => {
    const exists = (f: string) => f === 'gabarito-definitivo.pdf';
    expect(resolveAnswerKey(exists).status).toBe('definitivo');
  });

  it('falha explicitamente quando não há gabarito', () => {
    expect(() => resolveAnswerKey(() => false)).toThrow(/nenhum gabarito/);
  });
});
