import { useState } from 'react';
import { Link } from 'react-router-dom';

import { TIER_LABEL } from '../data/models';
import type { ModelResult } from '../data/results';
import type { ContaminationScope } from './ContaminationToggle';

type SortKey = 'acc' | 'clean' | 'cont' | 'delta' | 'ci' | 'cutoff';

function pickAccuracy(m: ModelResult, scope: ContaminationScope): number | null {
  if (scope === 'clean') return m.cleanAccuracy;
  if (scope === 'contaminated') return m.contaminatedAccuracy;
  return m.accuracy;
}

function delta(m: ModelResult): number | null {
  if (m.cleanAccuracy === null || m.contaminatedAccuracy === null) return null;
  return m.contaminatedAccuracy - m.cleanAccuracy;
}

export default function LeaderboardTable({
  contaminationScope,
  models,
}: {
  contaminationScope: ContaminationScope;
  models: ModelResult[];
}) {
  const [sort, setSort] = useState<{ dir: 'asc' | 'desc'; key: SortKey }>({
    dir: 'desc',
    key: 'acc',
  });

  function toggleSort(key: SortKey) {
    setSort((cur) =>
      cur.key === key ? { dir: cur.dir === 'desc' ? 'asc' : 'desc', key } : { dir: 'desc', key },
    );
  }

  const rows = models
    .map((m) => ({ acc: pickAccuracy(m, contaminationScope), d: delta(m), model: m }))
    .filter((r): r is { acc: number; d: number | null; model: ModelResult } => r.acc !== null);

  rows.sort((a, b) => {
    const mul = sort.dir === 'desc' ? -1 : 1;
    const get = (row: (typeof rows)[number]): number => {
      switch (sort.key) {
        case 'acc':
          return row.acc;
        case 'clean':
          return row.model.cleanAccuracy ?? -Infinity;
        case 'cont':
          return row.model.contaminatedAccuracy ?? -Infinity;
        case 'delta':
          return row.d ?? -Infinity;
        case 'ci':
          return row.model.ci95[1] - row.model.ci95[0];
        case 'cutoff':
          return row.model.trainingCutoff ? Date.parse(row.model.trainingCutoff) : -Infinity;
      }
    };
    return (get(a) - get(b)) * mul;
  });

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-muted text-muted-foreground font-sans">
          <tr>
            <th className="text-left px-4 py-3">#</th>
            <th className="text-left px-4 py-3">Modelo</th>
            <th className="text-left px-4 py-3">Fornecedor</th>
            <th className="text-left px-4 py-3">Tier</th>
            <SortableTh label="Acurácia" k="acc" sort={sort} onClick={toggleSort} align="right" />
            <SortableTh label="IC 95%" k="ci" sort={sort} onClick={toggleSort} align="right" />
            <SortableTh label="Limpa" k="clean" sort={sort} onClick={toggleSort} align="right" />
            <SortableTh
              label="Contaminada"
              k="cont"
              sort={sort}
              onClick={toggleSort}
              align="right"
            />
            <SortableTh label="Δ" k="delta" sort={sort} onClick={toggleSort} align="right" />
            <SortableTh
              label="Corte treino"
              k="cutoff"
              sort={sort}
              onClick={toggleSort}
              align="right"
            />
          </tr>
        </thead>
        <tbody>
          {rows.map(({ acc, d, model }, idx) => (
            <tr key={model.modelId} className="border-t hover:bg-muted/40">
              <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
              <td className="px-4 py-3">
                <Link
                  to={`/models/${model.modelId}`}
                  className="font-medium text-ps-violet hover:underline"
                >
                  {model.label}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{model.provider}</td>
              <td className="px-4 py-3 text-muted-foreground">{TIER_LABEL[model.tier]}</td>
              <td className="px-4 py-3 text-right font-mono">{(acc * 100).toFixed(1)}%</td>
              <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                {(model.ci95[0] * 100).toFixed(1)}–{(model.ci95[1] * 100).toFixed(1)}
              </td>
              <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                {model.cleanAccuracy !== null ? `${(model.cleanAccuracy * 100).toFixed(1)}%` : '—'}
              </td>
              <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                {model.contaminatedAccuracy !== null
                  ? `${(model.contaminatedAccuracy * 100).toFixed(1)}%`
                  : '—'}
              </td>
              <td
                className={`px-4 py-3 text-right font-mono ${
                  d === null
                    ? 'text-muted-foreground'
                    : d > 0.02
                      ? 'text-ps-amber'
                      : 'text-muted-foreground'
                }`}
                title={
                  d === null
                    ? 'Sem runs em ambos os buckets'
                    : 'contaminada − limpa; positivo sugere memorização'
                }
              >
                {d === null ? '—' : `${d >= 0 ? '+' : ''}${(d * 100).toFixed(1)}pp`}
              </td>
              <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                {model.trainingCutoff ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SortableTh({
  align,
  k,
  label,
  onClick,
  sort,
}: {
  align: 'left' | 'right';
  k: SortKey;
  label: string;
  onClick: (k: SortKey) => void;
  sort: { dir: 'asc' | 'desc'; key: SortKey };
}) {
  const active = sort.key === k;
  return (
    <th className={`px-4 py-3 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <button
        type="button"
        onClick={() => onClick(k)}
        className={`inline-flex items-center gap-1 font-sans ${
          active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        {label}
        {active && <span aria-hidden>{sort.dir === 'desc' ? '↓' : '↑'}</span>}
      </button>
    </th>
  );
}
