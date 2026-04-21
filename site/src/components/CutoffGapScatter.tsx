import { useMemo } from 'react';
import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';

import { type ModelTier, TIER_COLOR, TIER_LABEL } from '../data/models';
import type { ModelResult } from '../data/results';

// Fallbacks para tiers novos que ainda não tenham cor/label editorial:
// mantém o ponto visível em vez de sumir com `undefined` em fill/name.
const tierColor = (tier: ModelTier): string => TIER_COLOR[tier] ?? 'var(--muted-foreground)';
const tierLabel = (tier: ModelTier): string => TIER_LABEL[tier] ?? tier;

type Point = {
  cutoffMs: number;
  cutoffStr: string;
  delta: number;
  label: string;
  modelId: string;
  tier: ModelTier;
};

export default function CutoffGapScatter({ models }: { models: ModelResult[] }) {
  const { byTier, excluded } = useMemo(() => {
    const points: Point[] = [];
    let noCutoff = 0;
    let oneSideOnly = 0;
    for (const m of models) {
      if (!m.trainingCutoff) {
        noCutoff += 1;
        continue;
      }
      if (m.cleanAccuracy === null || m.contaminatedAccuracy === null) {
        oneSideOnly += 1;
        continue;
      }
      const ts = Date.parse(m.trainingCutoff);
      if (Number.isNaN(ts)) continue;
      points.push({
        cutoffMs: ts,
        cutoffStr: m.trainingCutoff,
        delta: (m.contaminatedAccuracy - m.cleanAccuracy) * 100,
        label: m.label,
        modelId: m.modelId,
        tier: m.tier,
      });
    }
    // Agrupa dinamicamente para não perder pontos caso um novo `ModelTier`
    // seja adicionado sem atualizar este componente.
    const grouped: Partial<Record<ModelTier, Point[]>> = {};
    for (const p of points) {
      (grouped[p.tier] ??= []).push(p);
    }
    return { byTier: grouped, excluded: { noCutoff, oneSideOnly } };
  }, [models]);

  const allPoints = Object.values(byTier).flatMap((pts) => pts ?? []);
  const totalModels = models.length;
  const plottedCount = allPoints.length;

  if (allPoints.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
        Nenhum modelo com corte de treino declarado e splits de contaminação disponíveis.
      </div>
    );
  }

  const tsMin = Math.min(...allPoints.map((p) => p.cutoffMs));
  const tsMax = Math.max(...allPoints.map((p) => p.cutoffMs));
  const deltaMax = Math.max(10, ...allPoints.map((p) => Math.abs(p.delta)));

  return (
    <div className="rounded-lg border bg-card p-4 font-sans">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold">Corte de treino × memorização</h3>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {(Object.keys(byTier) as ModelTier[]).map((tier) => (
            <div key={tier} className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block size-2.5 rounded-full"
                style={{ backgroundColor: tierColor(tier) }}
              />
              <span>{tierLabel(tier)}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="mb-4 text-base text-muted-foreground">
        Cada ponto é um modelo. Acima da linha zero, o modelo acerta mais em edições publicadas
        antes do seu corte de treino (sinal de memorização); abaixo, é o contrário, mais robusto
        contra contaminação. Modelos com cortes mais recentes tendem a ter menos benchmark público
        anterior no treino.
      </p>
      <ResponsiveContainer width="100%" height={340}>
        <ScatterChart margin={{ bottom: 40, left: 8, right: 24, top: 16 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="cutoffMs"
            domain={[tsMin - 30 * 86400000, tsMax + 30 * 86400000]}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            tickFormatter={(ms: number) => {
              const d = new Date(ms);
              return `${d.toLocaleString('pt-BR', { month: 'short' })}/${String(d.getFullYear()).slice(-2)}`;
            }}
            label={{
              fill: 'var(--muted-foreground)',
              offset: -5,
              position: 'insideBottom',
              value: 'Corte de treino',
            }}
          />
          <YAxis
            type="number"
            dataKey="delta"
            domain={[-deltaMax, deltaMax]}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            tickFormatter={(v: number) => `${v > 0 ? '+' : ''}${v.toFixed(0)}pp`}
            label={{
              angle: -90,
              fill: 'var(--muted-foreground)',
              position: 'insideLeft',
              style: { textAnchor: 'middle' },
              value: 'Δ contaminadas − limpas',
            }}
          />
          <ZAxis range={[80, 80]} />
          <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeWidth={1} />
          <RechartsTooltip
            cursor={{ stroke: 'var(--border)', strokeDasharray: '3 3' }}
            wrapperStyle={{ transition: 'none' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0]?.payload as Point | undefined;
              if (!p) return null;
              return (
                <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow">
                  <div className="font-semibold">{p.label}</div>
                  <div className="text-muted-foreground">Corte: {p.cutoffStr}</div>
                  <div>
                    Δ: {p.delta >= 0 ? '+' : ''}
                    {p.delta.toFixed(1)} pp
                  </div>
                </div>
              );
            }}
          />
          {(Object.keys(byTier) as ModelTier[]).map((tier) => {
            const data = byTier[tier];
            if (!data || data.length === 0) return null;
            return (
              <Scatter
                key={tier}
                data={data}
                fill={tierColor(tier)}
                isAnimationActive={false}
                name={tierLabel(tier)}
              />
            );
          })}
        </ScatterChart>
      </ResponsiveContainer>
      <p className="mt-4 text-sm text-muted-foreground">
        <strong>
          {plottedCount} de {totalModels} modelos elegíveis para análise de contaminação.
        </strong>{' '}
        Ficam de fora {excluded.noCutoff} sem corte de treino declarado pelo fornecedor
        (classificados como <em>unknown</em>) e {excluded.oneSideOnly} cujo corte está fora da
        janela das edições avaliadas, ou seja, com edições só de um lado (todas limpas ou todas
        contaminadas) e portanto sem comparação interna.
      </p>
    </div>
  );
}
