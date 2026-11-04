// Captura somente agregados públicos vinculados pelo portal oficial do INEP.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { decodePublicRows, queryPayload, selectEdition } from './powerbi-public.mjs';

const out = process.argv[2];
assert(out, 'Informe um diretório novo para o snapshot.');
assert(!existsSync(out), 'Não sobrescrever snapshots existentes.');
const source =
  'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/inep-data/painel-revalida';
const page = await fetch(source);
assert(page.ok);
const html = await page.text();
const reportUrl = /href="(https:\/\/app\.powerbi\.com\/view\?r=[^"]+)"/
  .exec(html)?.[1]
  ?.replaceAll('&amp;', '&');
assert(reportUrl, 'Link público do painel ausente na página oficial.');
const encoded = new URL(reportUrl).searchParams.get('r');
const { k: resourceKey } = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
const landing = await (await fetch(reportUrl)).text();
const cluster = /var resolvedClusterUri = '([^']+)'/.exec(landing)?.[1];
assert(cluster);
const host = new URL(cluster);
host.hostname = host.hostname
  .replace('-redirect', '')
  .replace('global-', '')
  .replace('.analysis.', '-api.analysis.');
const endpoint = `${host.origin}/public/reports/querydata`;
const headers = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'X-PowerBI-ResourceKey': resourceKey,
};
const modelResponse = await fetch(
  `${host.origin}/public/reports/${resourceKey}/modelsAndExploration?preferReadOnlySession=true`,
  { headers },
);
assert(modelResponse.ok);
const model = await modelResponse.json();
assert.equal(model.models.length, 1);
const modelId = model.models[0].id;
const section = model.exploration.sections.find((s) => s.displayName === 'Histórico');
assert(section);
const visuals = section.visualContainers.map((v) => ({
  name: JSON.parse(v.config).name,
  config: JSON.parse(v.config),
  query: v.query ? JSON.parse(v.query) : undefined,
}));
const find = (name) => {
  const visual = visuals.find((v) => v.name === name);
  assert(visual?.query, `Visual não encontrado: ${name}`);
  return visual;
};
const history = find('38ec4425580f4de9c77c');
const present = find('463bc9ce080a5101cd55');
const approval = find('1d2bac09486afad33426');
mkdirSync(out, { recursive: true });
const files = {};
const save = (name, text) => {
  writeFileSync(join(out, name), text, { flag: 'wx' });
  files[name] = createHash('sha256').update(text).digest('hex');
};
save(
  'visuals.json',
  JSON.stringify(
    {
      section: section.displayName,
      modelId,
      modelLastRefreshTime: model.models[0].LastRefreshTime,
      visuals: [history, present, approval],
    },
    null,
    2,
  ),
);
save('source-page.html', html);
const execute = async (name, payload) => {
  save(`${name}.query.json`, JSON.stringify(payload, null, 2));
  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  assert(response.ok, `Consulta pública falhou: HTTP ${response.status}`);
  const text = await response.text();
  save(`${name}.response.json`, text);
  const body = JSON.parse(text);
  assert(!body.error);
  assert(body.results.every((r) => !r.result.error));
  return body;
};
const historical = await execute('history', queryPayload(history.query, modelId));
const data = historical.results[0].result.data;
const historicalRows = decodePublicRows(data.dsr);
const editions = {};
for (const edition of ['2024/1', '2024/2', '2025/1']) {
  const payload = {
    ...queryPayload(selectEdition(present.query, edition), modelId),
    queries: [
      queryPayload(selectEdition(present.query, edition), modelId).queries[0],
      queryPayload(selectEdition(approval.query, edition), modelId).queries[0],
    ],
  };
  const cards = await execute(edition.replace('/', '-'), payload);
  assert.equal(cards.results.length, 2);
  const participants = decodePublicRows(cards.results[0].result.data.dsr)[0].M0;
  const { M0: approved, M1: rejected } = decodePublicRows(cards.results[1].result.data.dsr)[0];
  const row = historicalRows.find((r) => r.G0 === edition);
  assert(row);
  assert.equal(row.M3, participants);
  assert.equal(row.M2, approved);
  assert.equal(participants, approved + rejected);
  for (const n of [participants, approved, rejected, row.M1])
    assert(Number.isSafeInteger(n) && n >= 0);
  assert(participants > 0 && row.M1 >= participants);
  editions[`revalida-${edition.replace('/', '-')}`] = {
    registered: row.M1,
    participants,
    approved,
    rejected,
    passRate: approved / participants,
  };
}
const snapshot = {
  source,
  reportUrl,
  endpoint,
  modelId,
  snapshotAt: data.timestamp,
  dataUpdatedAt: new Date(historicalRows[0].M0).toISOString(),
  modelLastRefreshTime: model.models[0].LastRefreshTime,
  stage: '1° Etapa',
  denominator: 'participants',
  editions,
  files,
};
writeFileSync(join(out, 'snapshot.json'), JSON.stringify(snapshot, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(snapshot, null, 2));
