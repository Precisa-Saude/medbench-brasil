/**
 * Comparação multi-modelo por edição.
 *
 * Hoje (v1) só temos uma edição (`revalida-2025-1`), então renderizamos um
 * bar chart com uma barra por modelo e linhas de referência para a nota de
 * corte e média humana estimada dessa edição. Quando mais edições entrarem
 * no dataset, troca-se para um `LineChart` com uma série por modelo — a
 * forma do dado já suporta.
 */

import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

import { getEditionMetadata } from '../data/editions';
import type { ModelResult } from '../data/results';
import { jenksBreaks, jenksClass } from '../lib/jenks';
import FilterBar from './ComparisonChart.FilterBar';
import FloatingLabel from './ComparisonChart.FloatingLabel';
import {
  contaminationForEdition,
  JENKS_COLORS,
  JENKS_K,
  layoutLabelEntries,
  LEFT_MARGIN,
  modelFamily,
  RIGHT_MARGIN,
  Y_AXIS_WIDTH,
} from './ComparisonChart.helpers';
import ComparisonChartLegend from './ComparisonChart.Legend';
import type { ContaminationScope } from './ContaminationToggle';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export interface ComparisonChartProps {
  contaminationScope?: ContaminationScope;
  editionId: string;
  editionOptions?: { id: string; label: string }[];
  models: ModelResult[];
  onEditionChange?: (id: string) => void;
}

export default function ComparisonChart({
  contaminationScope,
  editionId,
  editionOptions,
  models,
  onEditionChange,
}: ComparisonChartProps) {
  const navigate = useNavigate();
  const edition = getEditionMetadata(editionId);

  // Famílias disponíveis vêm dos modelos que têm dados nessa edição — ordenadas
  // para estabilidade visual entre re-renders.
  const allFamilies = useMemo(() => {
    const set = new Set<string>();
    for (const m of models) {
      if (m.accuracyByEdition[editionId] !== undefined) set.add(modelFamily(m.label));
    }
    return [...set].sort();
  }, [models, editionId]);

  // Conjunto opt-in: chips começam inativos e o chart mostra todos os modelos.
  // Conjunto vazio = sem filtro (mostra tudo).
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const hasFilter = selected.size > 0;
  const toggleFamily = (family: string) => {
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(family)) next.delete(family);
      else next.add(family);
      return next;
    });
  };

  const data = models
    .filter((m) => m.accuracyByEdition[editionId] !== undefined)
    .filter((m) => !hasFilter || selected.has(modelFamily(m.label)))
    .filter((m) => {
      if (!contaminationScope || contaminationScope === 'all') return true;
      const c = contaminationForEdition(m, editionId);
      return contaminationScope === 'clean' ? c === 'clean' : c === 'contaminated';
    })
    .map((m) => ({
      accuracy: m.accuracyByEdition[editionId]!.accuracy * 100,
      ciHigh: m.ci95[1] * 100,
      ciLow: m.ci95[0] * 100,
      label: m.label,
      modelId: m.modelId,
      tier: m.tier,
    }))
    .sort((a, b) => b.accuracy - a.accuracy);

  const labelToId = new Map(data.map((d) => [d.label, d.modelId]));

  // Agrupa os modelos em 4 classes via Jenks natural breaks. Classes mais
  // altas ficam mais escuras (invertemos a indexação).
  const breaks =
    data.length > 0
      ? jenksBreaks(
          data.map((d) => d.accuracy),
          JENKS_K,
        )
      : [];
  const colorFor = (accuracy: number) =>
    breaks.length === 0
      ? JENKS_COLORS[0]
      : JENKS_COLORS[JENKS_K - 1 - jenksClass(accuracy, breaks)];

  const cutoffPct = edition.cutoffScore * 100;
  const humanPct = edition.estimatedHumanMean * 100;

  // Monta os pills de referência. Quando há `extraReferences` (ex.: ENAMED
  // com taxas por rede), "Candidatos" fica oculto pra evitar redundância.
  const rawLabels = [
    {
      label: 'Corte',
      leftPercent: cutoffPct,
      priority: 1,
      tooltip: 'Nota de corte oficial da INEP para aprovação nesta edição.',
    },
    ...(!edition.extraReferences?.length
      ? [
          {
            label: 'Candidatos',
            leftPercent: humanPct,
            priority: 1,
            tooltip: `Precisão média estimada dos candidatos, retrocalculada da nota de corte + taxa oficial de aprovação (${(edition.passRate * 100).toFixed(0)}%).`,
          },
        ]
      : []),
    ...(edition.extraReferences ?? []).map((ref) => ({
      label: ref.label,
      leftPercent: ref.score * 100,
      priority: 0,
      tooltip: ref.tooltip,
    })),
  ];
  const { entries: labelEntries, rows: labelRows } = layoutLabelEntries(rawLabels);
  const TOP_MARGIN = labelRows * 28 + 10;

  return (
    <div className="space-y-3 font-sans">
      <FilterBar
        allFamilies={allFamilies}
        editionId={editionId}
        editionOptions={editionOptions}
        selectedFamilies={selected}
        onEditionChange={onEditionChange}
        onToggleFamily={toggleFamily}
      />
      <div className="rounded-lg border bg-card p-4">
        {data.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nenhum modelo corresponde aos filtros atuais. Desmarque chips de família acima ou troque
            o toggle de contaminação.
          </div>
        ) : (
          <>
            <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-sans font-semibold">
                <Link
                  className="text-ps-violet underline decoration-ps-violet/30 underline-offset-4 transition-colors hover:decoration-ps-violet"
                  to={`/editions/${editionId}`}
                >
                  {edition.label}
                </Link>{' '}
                — precisão por modelo
              </h3>
              <ComparisonChartLegend />
            </header>
            <p className="mb-4 text-base text-muted-foreground">
              As quatro tonalidades agrupam os modelos em classes naturais via{' '}
              <a
                className="text-ps-violet underline"
                href="https://en.wikipedia.org/wiki/Jenks_natural_breaks_optimization"
                rel="noopener noreferrer"
                target="_blank"
              >
                Jenks natural breaks
              </a>
              : os cortes são escolhidos por programação dinâmica para minimizar a variância
              intra-classe das precisões observadas, destacando os agrupamentos reais da
              distribuição em vez de faixas fixas arbitrárias.
            </p>
            <div className="relative">
              <div
                className="absolute top-0 z-10 text-xs"
                style={{
                  height: labelRows * 28 + 10,
                  left: Y_AXIS_WIDTH + LEFT_MARGIN,
                  right: RIGHT_MARGIN,
                }}
              >
                {labelEntries.map((entry) => (
                  <FloatingLabel key={entry.label} leftPercent={entry.leftPercent} row={entry.row}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex cursor-pointer items-center rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 font-medium text-primary">
                          {entry.label}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs font-sans text-sm">
                        {entry.tooltip}
                      </TooltipContent>
                    </Tooltip>
                  </FloatingLabel>
                ))}
              </div>
              <ResponsiveContainer height={Math.max(260, data.length * 42 + 100)} width="100%">
                <BarChart
                  data={data}
                  layout="vertical"
                  margin={{ bottom: 8, left: LEFT_MARGIN, right: RIGHT_MARGIN, top: TOP_MARGIN }}
                >
                  <XAxis
                    domain={[0, 100]}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    ticks={Array.from(
                      new Set([
                        0,
                        25,
                        50,
                        75,
                        100,
                        Math.round(cutoffPct),
                        ...(edition.extraReferences?.length ? [] : [Math.round(humanPct)]),
                        ...(edition.extraReferences ?? []).map((r) => Math.round(r.score * 100)),
                      ]),
                    ).sort((a, b) => a - b)}
                    type="number"
                    unit="%"
                  />
                  <YAxis
                    dataKey="label"
                    padding={{ bottom: 16, top: 0 }}
                    tick={(props) => {
                      const { payload, x, y } = props as {
                        payload: { value: string };
                        x: number;
                        y: number;
                      };
                      const modelId = labelToId.get(payload.value);
                      return (
                        <g transform={`translate(${x},${y})`}>
                          <text
                            dy={4}
                            fill="var(--ps-violet)"
                            fontSize={12}
                            style={{ cursor: 'pointer' }}
                            textAnchor="end"
                            x={-4}
                            y={0}
                            onClick={() => modelId && navigate(`/models/${modelId}`)}
                          >
                            <title>Ver detalhes de {payload.value}</title>
                            {payload.value}
                          </text>
                        </g>
                      );
                    }}
                    type="category"
                    width={140}
                  />
                  <Bar
                    barSize={28}
                    dataKey="accuracy"
                    isAnimationActive={false}
                    name="Precisão"
                    radius={[0, 4, 4, 0]}
                  >
                    {data.map((d) => (
                      <Cell key={d.modelId} fill={colorFor(d.accuracy)} />
                    ))}
                    <LabelList
                      dataKey="accuracy"
                      fill="#ffffff"
                      fontSize={12}
                      fontWeight={700}
                      formatter={(v: number) => `${v.toFixed(1)}%`}
                      offset={10}
                      position="insideRight"
                    />
                  </Bar>
                  <ReferenceLine
                    ifOverflow="extendDomain"
                    stroke="#ffffff"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    x={cutoffPct}
                  />
                  {!edition.extraReferences?.length && (
                    <ReferenceLine
                      ifOverflow="extendDomain"
                      stroke="#ffffff"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      x={humanPct}
                    />
                  )}
                  {(edition.extraReferences ?? []).map((ref) => (
                    <ReferenceLine
                      key={ref.label}
                      ifOverflow="extendDomain"
                      stroke="#ffffff"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      x={ref.score * 100}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            {edition.sources && edition.sources.length > 0 && (
              <div className="mt-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Fontes
                </div>
                <ul className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
                  {edition.sources.map((s) => (
                    <li key={s.url}>
                      {s.author}. <span className="font-semibold">{s.title}</span>
                      {s.location ? `. ${s.location}` : ''}
                      {s.publishedAt ? `, ${s.publishedAt}` : ''}. Disponível em:{' '}
                      <a
                        className="text-ps-violet break-all underline"
                        href={s.url}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {s.url}
                      </a>
                      .
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
