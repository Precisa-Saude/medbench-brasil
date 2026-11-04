import assert from 'node:assert/strict';

/** Decodifica o formato tabular observado no painel público, sem estimar valores. */
export function decodePublicRows(dsr) {
  assert.equal(dsr.DS.length, 1);
  const ds = dsr.DS[0];
  assert(!ds.ValueDicts, 'Dicionário de valores não suportado neste extrator.');
  assert.equal(ds.PH.length, 1);
  const rows = ds.PH[0].DM0;
  assert(Array.isArray(rows));
  let schema;
  let previous;
  return rows.map((row) => {
    schema = row.S ?? schema;
    assert(Array.isArray(schema));
    const cells = row.C ?? [];
    let cursor = 0;
    const result = {};
    for (const [i, column] of schema.entries()) {
      const bit = 2 ** i;
      let value;
      if ((row.R ?? 0) & bit) {
        assert(previous, 'Repetição sem linha anterior.');
        value = previous[column.N];
      } else if ((row['Ø'] ?? 0) & bit) {
        value = null;
      } else if (Object.hasOwn(row, column.N)) {
        value = row[column.N];
      } else {
        assert(cursor < cells.length, 'Coluna sem valor.');
        value = cells[cursor++];
      }
      if (column.T === 13 && typeof value === 'string' && /^\d+L$/.test(value)) {
        value = Number(value.slice(0, -1));
        assert(Number.isSafeInteger(value));
      }
      result[column.N] = value;
    }
    assert.equal(cursor, cells.length, 'Células excedentes.');
    previous = result;
    return result;
  });
}

export function queryPayload(query, modelId) {
  return {
    version: '1.0.0',
    queries: [{ Query: query, CacheKey: '', QueryId: '' }],
    cancelQueries: [],
    modelId,
  };
}

/** Altera apenas a seleção de edição de uma consulta já publicada no painel. */
export function selectEdition(query, edition) {
  const result = structuredClone(query);
  const where = result.Commands[0].SemanticQueryDataShapeCommand.Query.Where;
  const stage = where.find((w) => w.Condition.In?.Expressions[0]?.Column?.Property === 'Etapa');
  assert.equal(stage?.Condition.In.Values[0][0].Literal.Value, "'1° Etapa'");
  const filter = where.find((w) => w.Condition.In?.Expressions[0]?.Column?.Property === 'Edição');
  assert(filter);
  assert(/^20\d{2}\/[12]$/.test(edition));
  filter.Condition.In.Values = [[{ Literal: { Value: `'${edition}'` } }]];
  return result;
}
