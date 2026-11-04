import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { decodePublicRows, selectEdition } from '../../../scripts/data/powerbi-public.mjs';
import { loadEdition } from '../src/loader.js';

const root = new URL('../data/provenance/revalida-pass-rates/2026-11-04/', import.meta.url);
const read = (name: string) => readFileSync(new URL(name, root));
const json = (name: string) => JSON.parse(read(name).toString('utf8'));
const snapshot = json('snapshot.json');
const history = json('history.response.json').results[0].result.data;
const rows = decodePublicRows(history.dsr);
const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const cases = [
  [
    'revalida-2024-1',
    '2024/1',
    10049,
    9532,
    2550,
    '095480539303f4d105cebde7339b86bbfb4933f50b3a9e694c2bd91c056af988',
  ],
  [
    'revalida-2024-2',
    '2024/2',
    10821,
    10335,
    2509,
    '27df36e60170d213be5ab97f0790365bad716df68d5a37c5d9d1b605b5cbacf4',
  ],
  [
    'revalida-2025-1',
    '2025/1',
    17118,
    15949,
    4499,
    'a9af18b9ad75b579bccac05507c35529294233b8398c9f90fbd7c125802f0c48',
  ],
] as const;

describe('snapshot oficial do Painel Revalida', () => {
  it('preserva cada resposta/consulta e a origem pública com hashes verificáveis', () => {
    for (const [name, expected] of Object.entries(snapshot.files))
      expect(hash(read(name)), name).toBe(expected);
    expect(read('source-page.html').toString()).toContain(snapshot.reportUrl);
    expect(snapshot.source).toBe(
      'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/inep-data/painel-revalida',
    );
    expect(snapshot.snapshotAt).toBe(history.timestamp);
    expect(snapshot.stage).toBe('1° Etapa');
    expect(snapshot.denominator).toBe('participants');
    expect(snapshot.dataUpdatedAt).toBe(new Date(rows[0].M0).toISOString());
    const query =
      json('history.query.json').queries[0].Query.Commands[0].SemanticQueryDataShapeCommand.Query;
    expect(query.Select[3].Measure.Property).toBe('Aprovados no Revalida');
    expect(query.Where).toContainEqual({
      Condition: {
        In: {
          Expressions: [
            { Column: { Expression: { SourceRef: { Source: 'd' } }, Property: 'Etapa' } },
          ],
          Values: [[{ Literal: { Value: "'1° Etapa'" } }]],
        },
      },
    });
  });

  it.each(cases)(
    'usa presentes, não inscritos, em %s',
    (id, edition, registered, participants, approved, questionsHash) => {
      const data = loadEdition(id);
      expect(data.totalInscritos).toBe(registered);
      expect(data.passRate).toBe(approved / participants);
      expect(data.passRate).not.toBeCloseTo(approved / registered, 4);
      expect(data.passRateSource).toBe(snapshot.source);
      expect(data.passRateSnapshot).toMatchObject({
        approved,
        participants,
        snapshotAt: snapshot.snapshotAt,
        denominator: 'participants',
        stage: 'first',
        evidence: 'data/provenance/revalida-pass-rates/2026-11-04/snapshot.json',
      });
      expect(snapshot.editions[id]).toMatchObject({ approved, participants, registered });
      const row = rows.find((row: { G0: string }) => row.G0 === edition);
      expect(row).toMatchObject({ M1: registered, M2: approved, M3: participants });
      const cards = json(`${edition.replace('/', '-')}.response.json`).results;
      expect(decodePublicRows(cards[0].result.data.dsr)[0].M0).toBe(participants);
      const approval = decodePublicRows(cards[1].result.data.dsr)[0];
      expect(approval.M0).toBe(approved);
      expect(approval.M0 + approval.M1).toBe(participants);
      expect(hash(JSON.stringify(data.questions))).toBe(questionsHash);
    },
  );
});

describe('decodificação limitada do formato público observado', () => {
  it('trata repetição e null sem deslocar colunas', () => {
    const last = rows.at(-1);
    expect(last).toMatchObject({ G0: '2026/2', M2: null, M3: null });
    expect(rows[1].M0).toBe(rows[0].M0);
  });

  it('recusa dados incompletos, células excedentes e dicionários não suportados', () => {
    for (const row of [
      { S: [{ N: 'x', T: 4 }], C: [] },
      { S: [{ N: 'x', T: 4 }], C: [1, 2] },
      { S: [{ N: 'x', T: 4 }], R: 1 },
    ]) {
      expect(() => decodePublicRows({ DS: [{ PH: [{ DM0: [row] }] }] })).toThrow();
    }
    expect(() => decodePublicRows({ DS: [{ ValueDicts: {}, PH: [{ DM0: [] }] }] })).toThrow();
  });

  it('seleciona somente a edição e preserva o filtro da primeira etapa', () => {
    const original = json('visuals.json').visuals.find(
      (visual: { name: string }) => visual.name === '463bc9ce080a5101cd55',
    ).query;
    const copy = structuredClone(original);
    const selected = selectEdition(original, '2025/1');
    expect(original).toEqual(copy);
    expect(selected).toEqual(json('2025-1.query.json').queries[0].Query);
    expect(() => selectEdition(original, '2025')).toThrow();
    const wrong = structuredClone(original);
    wrong.Commands[0].SemanticQueryDataShapeCommand.Query.Where[1].Condition.In.Values[0][0].Literal.Value =
      "'2° Etapa'";
    expect(() => selectEdition(wrong, '2025/1')).toThrow();
  });
});
