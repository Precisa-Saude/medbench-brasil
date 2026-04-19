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

  return (
    <div className="rounded-lg border bg-card p-4 font-sans">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-sans font-semibold">{edition.label} — precisão por modelo</h3>
        <div className="flex items-center gap-2 text-xs">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 font-medium text-primary">
                <span
                  className="inline-block h-px w-3"
                  style={{
                    backgroundImage: 'linear-gradient(to right, currentColor 50%, transparent 50%)',
                    backgroundSize: '4px 1px',
                  }}
                />
                Corte {(edition.cutoffScore * 100).toFixed(0)}%
              </span>
            </TooltipTrigger>
            <TooltipContent>
              Nota de corte oficial da INEP — percentual mínimo de acertos exigido para aprovação
              nesta edição.
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 font-medium text-primary">
                <span
                  className="inline-block h-px w-3"
                  style={{
                    backgroundImage: 'linear-gradient(to right, currentColor 50%, transparent 50%)',
                    backgroundSize: '4px 1px',
                  }}
                />
                Humano {(edition.estimatedHumanMean * 100).toFixed(0)}%
              </span>
            </TooltipTrigger>
            <TooltipContent>
              Média humana estimada, retrocalculada da taxa de aprovação de{' '}
              {(edition.passRate * 100).toFixed(0)}% assumindo distribuição normal. Ver{' '}
              <em>metodologia</em>.
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(240, data.length * 42 + 80)}>
        <BarChart data={data} layout="vertical" margin={{ bottom: 8, left: 8, right: 24, top: 8 }}>
          <XAxis
            type="number"
            domain={[0, 100]}
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
  );
}

export function listComparableEditions(models: ModelResult[]): string[] {
  const ids = new Set<string>(Object.keys(EDITIONS));
  for (const m of models) for (const eid of Object.keys(m.accuracyByEdition)) ids.add(eid);
  return [...ids].sort();
}
