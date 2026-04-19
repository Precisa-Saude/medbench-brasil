import { useNavigate } from 'react-router-dom';
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

import { EDITIONS, getEditionMetadata } from '../data/editions';
import { TIER_COLOR } from '../data/models';
import type { ModelResult } from '../data/results';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

/**
 * Comparação multi-modelo por edição.
 *
 * Hoje (v1) só temos uma edição (`revalida-2025-1`), então renderizamos um
 * bar chart com uma barra por modelo e linhas de referência para a nota de
 * corte e média humana estimada dessa edição. Quando mais edições entrarem
 * no dataset, troca-se para um `LineChart` com uma série por modelo — a
 * forma do dado já suporta.
 */
export default function ComparisonChart({
  editionId,
  models,
}: {
  editionId: string;
  models: ModelResult[];
}) {
  const navigate = useNavigate();
  const edition = getEditionMetadata(editionId);
  const data = models
    .filter((m) => m.accuracyByEdition[editionId] !== undefined)
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

  if (data.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground text-sm">
        Selecione pelo menos um modelo.
      </div>
    );
  }

  // Margens fixas passadas ao BarChart — precisamos delas para alinhar os
  // pills flutuantes à área de plotagem real (entre o Y axis e a margem direita).
  const Y_AXIS_WIDTH = 140;
  const LEFT_MARGIN = 8;
  const RIGHT_MARGIN = 24;
  const TOP_MARGIN = 56;

  const cutoffPct = edition.cutoffScore * 100;
  const humanPct = edition.estimatedHumanMean * 100;

  return (
    <div className="rounded-lg border bg-card p-4 font-sans">
      <div className="mb-3">
        <h3 className="font-sans font-semibold">{edition.label} — precisão por modelo</h3>
      </div>
      <div className="relative">
        <div
          className="absolute top-0 z-10 text-xs"
          style={{
            height: TOP_MARGIN,
            left: Y_AXIS_WIDTH + LEFT_MARGIN,
            right: RIGHT_MARGIN,
          }}
        >
          <FloatingLabel leftPercent={humanPct} topOffset={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 font-medium text-primary">
                  <DashIcon />
                  Humano
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs font-sans text-sm">
                Média humana estimada da taxa de aprovação ({(edition.passRate * 100).toFixed(0)}%).
              </TooltipContent>
            </Tooltip>
          </FloatingLabel>
          <FloatingLabel
            leftPercent={cutoffPct}
            topOffset={Math.abs(cutoffPct - humanPct) < 15 ? 22 : 0}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 font-medium text-primary">
                  <DashIcon />
                  Corte
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs font-sans text-sm">
                Nota de corte oficial da INEP para aprovação nesta edição.
              </TooltipContent>
            </Tooltip>
          </FloatingLabel>
        </div>
        <ResponsiveContainer width="100%" height={Math.max(260, data.length * 42 + 100)}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ bottom: 8, left: LEFT_MARGIN, right: RIGHT_MARGIN, top: TOP_MARGIN }}
          >
            <XAxis
              type="number"
              domain={[0, 100]}
              ticks={Array.from(
                new Set([0, 25, 50, 75, 100, Math.round(cutoffPct), Math.round(humanPct)]),
              ).sort((a, b) => a - b)}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              unit="%"
            />
            <YAxis
              type="category"
              dataKey="label"
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
                      x={-4}
                      y={0}
                      dy={4}
                      textAnchor="end"
                      fill="var(--ps-violet)"
                      fontSize={12}
                      style={{ cursor: 'pointer' }}
                      onClick={() => modelId && navigate(`/models/${modelId}`)}
                    >
                      <title>Ver detalhes de {payload.value}</title>
                      {payload.value}
                    </text>
                  </g>
                );
              }}
              width={140}
            />
            <Bar dataKey="accuracy" name="Precisão" radius={[0, 4, 4, 0]} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.modelId} fill={TIER_COLOR[d.tier]} />
              ))}
              <LabelList
                dataKey="accuracy"
                position="insideRight"
                offset={10}
                fill="#ffffff"
                fontSize={12}
                fontWeight={700}
                formatter={(v: number) => `${v.toFixed(1)}%`}
              />
            </Bar>
            <ReferenceLine
              x={edition.cutoffScore * 100}
              stroke="#ffffff"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              ifOverflow="extendDomain"
            />
            <ReferenceLine
              x={edition.estimatedHumanMean * 100}
              stroke="#ffffff"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              ifOverflow="extendDomain"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/**
 * Posiciona o filho como coluna absoluta dentro da área de plotagem.
 * `leftPercent` é o valor (0–100) no domínio do eixo X; o pill sai
 * centralizado sobre essa coordenada. `pointer-events-none` no wrapper
 * deixa cliques do chart atravessarem; o próprio pill reativa com
 * `pointer-events-auto` para manter o trigger do Tooltip.
 */
function FloatingLabel({
  children,
  leftPercent,
  topOffset = 0,
}: {
  children: React.ReactNode;
  leftPercent: number;
  topOffset?: number;
}) {
  return (
    <div
      className="absolute flex -translate-x-1/2 items-start"
      style={{ left: `${leftPercent}%`, top: `${topOffset}px` }}
    >
      {children}
    </div>
  );
}

/**
 * Mini SVG replicando exatamente a linha pontilhada das ReferenceLines
 * (1.5px de espessura, dash 4 × 4) em `currentColor`, para que o ícone
 * dentro do pill leia visualmente igual ao traço real no chart.
 */
function DashIcon() {
  return (
    <svg aria-hidden width="14" height="2" viewBox="0 0 14 2" className="shrink-0">
      <line
        x1="0"
        y1="1"
        x2="14"
        y2="1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 4"
      />
    </svg>
  );
}

export function listComparableEditions(models: ModelResult[]): string[] {
  const ids = new Set<string>(Object.keys(EDITIONS));
  for (const m of models) for (const eid of Object.keys(m.accuracyByEdition)) ids.add(eid);
  return [...ids].sort();
}
