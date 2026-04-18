import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { EDITIONS, getEditionMetadata } from '../data/editions';
import { TIER_COLOR } from '../data/models';
import type { ModelResult } from '../data/results';

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
  const edition = getEditionMetadata(editionId);
  const data = models
    .map((m) => ({
      accuracy: (m.accuracyByEdition[editionId]?.accuracy ?? m.accuracy) * 100,
      ciHigh: m.ci95[1] * 100,
      ciLow: m.ci95[0] * 100,
      label: m.label,
      modelId: m.modelId,
      tier: m.tier,
    }))
    .sort((a, b) => b.accuracy - a.accuracy);

  if (data.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground text-sm">
        Selecione pelo menos um modelo.
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4 font-sans">
      <div className="mb-3">
        <h3 className="font-sans font-semibold">{edition.label} — precisão por modelo</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Linhas pontilhadas: nota de corte ({(edition.cutoffScore * 100).toFixed(0)}%) e média
          humana estimada ({(edition.estimatedHumanMean * 100).toFixed(0)}%, retrocalculada da taxa
          de aprovação de {(edition.passRate * 100).toFixed(0)}%).
        </p>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(220, data.length * 42 + 60)}>
        <BarChart data={data} layout="vertical" margin={{ bottom: 8, left: 8, right: 24, top: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            unit="%"
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            width={140}
          />
          <Tooltip
            formatter={(val: number) => `${val.toFixed(1)}%`}
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              fontSize: 12,
            }}
          />
          <Legend />
          <ReferenceLine
            x={edition.cutoffScore * 100}
            stroke="var(--ps-amber)"
            strokeDasharray="4 4"
            label={{ fill: 'var(--ps-amber)', fontSize: 10, position: 'top', value: 'Corte' }}
          />
          <ReferenceLine
            x={edition.estimatedHumanMean * 100}
            stroke="var(--ps-green)"
            strokeDasharray="2 4"
            label={{
              fill: 'var(--ps-green)',
              fontSize: 10,
              position: 'top',
              value: 'Humano',
            }}
          />
          <Bar dataKey="accuracy" name="Precisão" radius={[0, 4, 4, 0]}>
            {data.map((d) => (
              <Cell key={d.modelId} fill={TIER_COLOR[d.tier]} />
            ))}
          </Bar>
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
