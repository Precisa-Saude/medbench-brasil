import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';

import { EDITIONS } from '../data/editions';
import type { ModelResult } from '../data/results';
import { formatCostUSD } from '../lib/cost';
import { costComparison, type CostPoint } from '../lib/cost-comparison';
import { TYPE } from '../lib/typography';
import type { ContaminationScope } from './ContaminationToggle';

export default function CostAccuracyScatter({
  editionId,
  models,
  scope,
}: {
  editionId: string;
  models: ModelResult[];
  scope: ContaminationScope;
}) {
  const { excluded, points, zeroCost } = useMemo(
    () => costComparison(models, editionId, scope),
    [models, editionId, scope],
  );
  const frontier = points.filter((point) => point.pareto);
  const remaining = points.filter((point) => !point.pareto);
  const all = [...zeroCost, ...points];
  return (
    <figure className="rounded-lg border bg-card p-4 font-sans">
      <figcaption className="mb-4 space-y-2">
        <h3 className={TYPE.h3}>Custo × precisão</h3>
        <p className="text-sm text-muted-foreground">
          {EDITIONS[editionId]?.label ?? editionId},{' '}
          {scope === 'clean'
            ? 'apenas limpas'
            : scope === 'contaminated'
              ? 'apenas contaminadas'
              : 'todos os resultados da edição'}
          . US$ por questão inclui as três execuções, à tarifa de referência verificada. Não é
          faturamento histórico.
        </p>
      </figcaption>
      {points.length === 0 ? (
        <p
          className="rounded border border-dashed p-6 text-center text-sm text-muted-foreground"
          role="status"
        >
          {zeroCost.length > 0
            ? 'Custos zero não cabem no eixo logarítmico; consulte os dados abaixo.'
            : 'Ainda não há modelos com consumo completo e tarifa verificável neste escopo. Avaliações antigas sem usage permanecem sem estimativa.'}
        </p>
      ) : (
        <>
          <p className="mb-3 text-xs text-muted-foreground">
            ◆ Fronteira de Pareto observada · ● Demais modelos
          </p>
          <div
            aria-label="Dispersão de custo por questão e precisão na edição selecionada"
            role="img"
          >
            <ResponsiveContainer height={340} width="100%">
              <ScatterChart margin={{ bottom: 35, left: 12, right: 24, top: 16 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="cost"
                  type="number"
                  scale="log"
                  domain={[
                    Math.max(Number.MIN_VALUE, Math.min(...points.map((p) => p.cost)) / 2),
                    Math.max(...points.map((p) => p.cost)) * 2,
                  ]}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  tickFormatter={formatCostUSD}
                  label={{
                    fill: 'var(--muted-foreground)',
                    offset: -5,
                    position: 'insideBottom',
                    value: 'US$/questão (escala log)',
                  }}
                />
                <YAxis
                  dataKey="accuracy"
                  type="number"
                  domain={[0, 100]}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  tickFormatter={(v: number) => `${v}%`}
                  label={{
                    angle: -90,
                    fill: 'var(--muted-foreground)',
                    position: 'insideLeft',
                    value: 'Precisão (%)',
                  }}
                />
                <ZAxis range={[90, 90]} />
                <ChartTooltip
                  cursor={{ stroke: 'var(--border)', strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    const point = payload?.[0]?.payload as CostPoint | undefined;
                    if (!active || !point) return null;
                    return (
                      <div className="max-w-xs rounded-lg border bg-popover p-3 text-xs shadow">
                        <div className="font-semibold">{point.label}</div>
                        <div>
                          {point.accuracy.toFixed(1)}% · {formatCostUSD(point.cost)}/questão
                        </div>
                        <div>{point.estimate.pricing.priceProvider}</div>
                        <div>Tabela verificada em {point.estimate.pricing.priceAsOf}</div>
                        {point.pareto && (
                          <div>Fronteira observada, sem teste de significância.</div>
                        )}
                      </div>
                    );
                  }}
                />
                <Scatter
                  data={remaining}
                  fill="var(--muted-foreground)"
                  isAnimationActive={false}
                  name="Demais modelos"
                />
                <Scatter
                  data={frontier}
                  fill="var(--ps-violet)"
                  stroke="var(--foreground)"
                  strokeWidth={1}
                  isAnimationActive={false}
                  name="Pareto observada"
                  shape="diamond"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
      <p className="mt-4 text-sm text-muted-foreground">
        {all.length} de {models.length} modelos com custo estimável. {excluded.missingCost} sem
        custo neste escopo; {excluded.missingEdition} sem resultado válido na edição;{' '}
        {excluded.decisionProtocol} de protocolo de decisão fora desta comparação.
        {zeroCost.length > 0 && ` ${zeroCost.length} com custo zero fora do eixo log.`} Na
        fronteira, nenhum outro modelo observado custa menos ou igual e acerta mais ou igual, com
        melhora em pelo menos um eixo. Isso não demonstra superioridade estatística ou competência
        clínica.
      </p>
      {all.length > 0 && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer">Dados do gráfico e fontes de preço</summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left">
              <caption className="sr-only">
                Custo e precisão na mesma edição e escopo selecionados
              </caption>
              <thead>
                <tr>
                  <th scope="col">Modelo</th>
                  <th scope="col">Precisão</th>
                  <th scope="col">US$/questão</th>
                  <th scope="col">Tabela</th>
                </tr>
              </thead>
              <tbody>
                {all.map((point) => (
                  <tr key={point.modelId}>
                    <th className="py-2 font-normal" scope="row">
                      <Link className="underline" to={`/models/${point.modelId}`}>
                        {point.label}
                      </Link>
                      {point.pareto ? ' ◆' : ''}
                    </th>
                    <td>{point.accuracy.toFixed(1)}%</td>
                    <td>{formatCostUSD(point.cost)}</td>
                    <td>
                      <a
                        className="underline"
                        href={point.estimate.pricing.priceSource}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {point.estimate.pricing.priceAsOf} · {point.estimate.pricing.priceProvider}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </figure>
  );
}
