import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { TIER_LABEL } from '../data/models';
import type { ModelResult } from '../data/results';
import type { ContaminationScope } from './ContaminationToggle';
import { Pagination } from './ui/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  function toggleSort(key: SortKey) {
    setSort((cur) =>
      cur.key === key ? { dir: cur.dir === 'desc' ? 'asc' : 'desc', key } : { dir: 'desc', key },
    );
  }

  const sortedRows = useMemo(() => {
    const rows = models
      .map((m) => ({ acc: pickAccuracy(m, contaminationScope), d: delta(m), model: m }))
      .filter((r): r is { acc: number; d: number | null; model: ModelResult } => r.acc !== null);

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
    return [...rows].sort((a, b) => (get(a) - get(b)) * mul);
  }, [models, contaminationScope, sort]);

  const totalRows = sortedRows.length;
  const start = (page - 1) * pageSize;
  const pageRows = sortedRows.slice(start, start + pageSize);

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Modelo</TableHead>
            <TableHead>Fornecedor</TableHead>
            <TableHead>Tier</TableHead>
            <SortableHead label="Precisão" k="acc" sort={sort} onClick={toggleSort} align="right" />
            <SortableHead
              label="IC 95%"
              k="ci"
              sort={sort}
              onClick={toggleSort}
              align="right"
              tooltip="Faixa plausível da precisão real (Wilson 95%). Faixas sobrepostas = empate estatístico."
            />
            <SortableHead
              label="Limpa"
              k="clean"
              sort={sort}
              onClick={toggleSort}
              align="right"
              tooltip="Precisão em edições posteriores ao corte de treino — provas que o modelo não viu."
            />
            <SortableHead
              label="Contaminada"
              k="cont"
              sort={sort}
              onClick={toggleSort}
              align="right"
              tooltip="Precisão em edições anteriores ao corte — podem ter aparecido no treino."
            />
            <SortableHead
              label="Δ"
              k="delta"
              sort={sort}
              onClick={toggleSort}
              align="right"
              tooltip="Contaminada − limpa (pp). Positivo sugere memorização."
            />
            <SortableHead
              label="Corte treino"
              k="cutoff"
              sort={sort}
              onClick={toggleSort}
              align="right"
              tooltip="Data até a qual o fornecedor coletou dados de treino. Define o que é limpo vs contaminado."
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map(({ acc, d, model }, idx) => (
            <TableRow key={model.modelId}>
              <TableCell className="text-muted-foreground">{start + idx + 1}</TableCell>
              <TableCell>
                <Link
                  to={`/models/${model.modelId}`}
                  className="font-medium text-ps-violet hover:underline"
                >
                  {model.label}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{model.provider}</TableCell>
              <TableCell className="text-muted-foreground">{TIER_LABEL[model.tier]}</TableCell>
              <TableCell className="text-right font-mono">{(acc * 100).toFixed(1)}%</TableCell>
              <TableCell className="text-right font-mono text-muted-foreground">
                {(model.ci95[0] * 100).toFixed(1)}–{(model.ci95[1] * 100).toFixed(1)}
              </TableCell>
              <TableCell className="text-right font-mono text-muted-foreground">
                {model.cleanAccuracy !== null ? `${(model.cleanAccuracy * 100).toFixed(1)}%` : '—'}
              </TableCell>
              <TableCell className="text-right font-mono text-muted-foreground">
                {model.contaminatedAccuracy !== null
                  ? `${(model.contaminatedAccuracy * 100).toFixed(1)}%`
                  : '—'}
              </TableCell>
              <TableCell
                className={`text-right font-mono ${
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
              </TableCell>
              <TableCell className="text-right font-mono text-muted-foreground">
                {model.trainingCutoff ?? '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Pagination
        page={page}
        pageSize={pageSize}
        totalRows={totalRows}
        onPageChange={setPage}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(1);
        }}
        itemsLabel="modelos"
      />
    </div>
  );
}

function SortableHead({
  align,
  k,
  label,
  onClick,
  sort,
  tooltip,
}: {
  align: 'left' | 'right';
  k: SortKey;
  label: string;
  onClick: (k: SortKey) => void;
  sort: { dir: 'asc' | 'desc'; key: SortKey };
  tooltip?: React.ReactNode;
}) {
  const active = sort.key === k;
  const button = (
    <button
      type="button"
      onClick={() => onClick(k)}
      className={`inline-flex items-center gap-1 ${
        active ? 'text-foreground' : 'hover:text-foreground'
      } ${tooltip ? 'cursor-pointer underline decoration-dotted decoration-muted-foreground/40 underline-offset-4' : ''}`}
    >
      {label}
      {active && <span aria-hidden>{sort.dir === 'desc' ? '↓' : '↑'}</span>}
    </button>
  );
  return (
    <TableHead className={align === 'right' ? 'text-right' : 'text-left'}>
      {tooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent className="max-w-xs font-sans text-sm">{tooltip}</TooltipContent>
        </Tooltip>
      ) : (
        button
      )}
    </TableHead>
  );
}
