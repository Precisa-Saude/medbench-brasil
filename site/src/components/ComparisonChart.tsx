import { useMemo, useState } from 'react';
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
import type { ModelResult } from '../data/results';
import { jenksBreaks, jenksClass } from '../lib/jenks';
import type { ContaminationScope } from './ContaminationToggle';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

// Contaminação por edição: a ModelResult agregada mistura editions, então
// olhamos no perQuestion para achar a classificação naquela edição específica.
function contaminationForEdition(
  m: ModelResult,
  editionId: string,
): 'clean' | 'contaminated' | 'unknown' {
  const q = (m.perQuestion ?? []).find((pq) => pq.editionId === editionId);
  if (!q) return 'unknown';
  if (q.contamination === 'likely-clean') return 'clean';
  if (q.contamination === 'likely-contaminated') return 'contaminated';
  return 'unknown';
}

/**
 * Família do modelo derivada do prefixo alfabético do label:
 * "Claude Opus 4.7" → "Claude", "GPT-5.2" → "GPT", "DeepSeek R1" → "DeepSeek".
 * Agrupa rótulos que não têm espaço antes da versão (caso do GPT-5.x).
 */
function modelFamily(label: string): string {
  const match = label.match(/^([A-Za-zÀ-ú]+)/);
  return match ? match[1] : label;
}

// Paleta de 4 tons do violeta mais escuro (tier 0 = melhores) ao mais claro
// (tier 3 = piores). Os valores vêm dos tokens OKLch do tema — mantém
// consistência visual com os pills flutuantes e com o resto da UI.
const JENKS_COLORS = [
  'var(--primary)', // ps-violet-dark
  'var(--ps-violet)',
  'oklch(0.72 0.08 290)',
  'oklch(0.85 0.05 290)',
];
const JENKS_K = 4;

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
  contaminationScope,
  editionId,
  models,
}: {
  contaminationScope?: ContaminationScope;
  editionId: string;
  models: ModelResult[];
}) {
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
  // Assim que o usuário clica em um chip, filtramos para as famílias nele.
  // Conjunto vazio = sem filtro (mostra tudo).
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const hasFilter = selected.size > 0;
  const isActive = (family: string) => selected.has(family);
  const isVisible = (family: string) => !hasFilter || selected.has(family);
  const toggle = (family: string) => {
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(family)) next.delete(family);
      else next.add(family);
      return next;
    });
  };

  const data = models
    .filter((m) => m.accuracyByEdition[editionId] !== undefined)
    .filter((m) => isVisible(modelFamily(m.label)))
    .filter((m) => {
      // Respeita o toggle de contaminação: 'clean' esconde contaminados,
      // 'contaminated' esconde limpos, 'all'/undefined mostra todos.
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

  // Agrupa os modelos em 4 classes via Jenks natural breaks sobre as
  // precisões observadas. Cada barra ganha a cor da sua classe — classes
  // mais altas ficam mais escuras.
  const breaks =
    data.length > 0
      ? jenksBreaks(
          data.map((d) => d.accuracy),
          JENKS_K,
        )
      : [];
  const colorFor = (accuracy: number) => {
    if (breaks.length === 0) return JENKS_COLORS[0];
    const cls = jenksClass(accuracy, breaks);
    // `cls` é 0 = menor classe; invertemos para que as melhores fiquem mais escuras.
    return JENKS_COLORS[JENKS_K - 1 - cls];
  };

  // Margens fixas passadas ao BarChart — precisamos delas para alinhar os
  // pills flutuantes à área de plotagem real (entre o Y axis e a margem direita).
  const Y_AXIS_WIDTH = 140;
  const LEFT_MARGIN = 8;
  const RIGHT_MARGIN = 24;
  const TOP_MARGIN = 32;

  const cutoffPct = edition.cutoffScore * 100;
  const humanPct = edition.estimatedHumanMean * 100;

  return (
    <div className="space-y-3 font-sans">
      {allFamilies.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Famílias:</span>
          {allFamilies.map((family) => {
            const active = isActive(family);
            return (
              <button
                key={family}
                type="button"
                onClick={() => toggle(family)}
                aria-pressed={active}
                className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {family}
              </button>
            );
          })}
        </div>
      )}
      <div className="rounded-lg border bg-card p-4">
        {data.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nenhum modelo corresponde aos filtros atuais. Desmarque chips de família acima ou troque
            o toggle de contaminação.
          </div>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-sans font-semibold">{edition.label} — precisão por modelo</h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground underline decoration-dotted decoration-muted-foreground/40 underline-offset-4">
                    <span>menor</span>
                    <span className="inline-flex gap-0.5">
                      {JENKS_COLORS.map((_c, i) => (
                        <span
                          key={i}
                          aria-hidden
                          className="inline-block h-2.5 w-4"
                          style={{ backgroundColor: JENKS_COLORS[JENKS_COLORS.length - 1 - i] }}
                        />
                      ))}
                    </span>
                    <span>maior</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs font-sans text-sm">
                  Cores agrupam os modelos em 4 classes naturais pelo algoritmo Jenks sobre as
                  precisões observadas — classes mais escuras concentram as maiores precisões.
                </TooltipContent>
              </Tooltip>
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
                <FloatingLabel leftPercent={humanPct}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex cursor-pointer items-center rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 font-medium text-primary">
                        Humano
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs font-sans text-sm">
                      Média humana estimada da taxa de aprovação (
                      {(edition.passRate * 100).toFixed(0)}
                      %).
                    </TooltipContent>
                  </Tooltip>
                </FloatingLabel>
                <FloatingLabel leftPercent={cutoffPct}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex cursor-pointer items-center rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 font-medium text-primary">
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
                  <Bar
                    dataKey="accuracy"
                    name="Precisão"
                    radius={[0, 4, 4, 0]}
                    isAnimationActive={false}
                    barSize={28}
                  >
                    {data.map((d) => (
                      <Cell key={d.modelId} fill={colorFor(d.accuracy)} />
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
            <p className="mt-3 text-xs text-muted-foreground">
              As quatro tonalidades agrupam os modelos em classes naturais via{' '}
              <a
                className="text-ps-violet underline"
                href="https://en.wikipedia.org/wiki/Jenks_natural_breaks_optimization"
                target="_blank"
                rel="noopener noreferrer"
              >
                Jenks natural breaks
              </a>
              : os cortes são escolhidos por programação dinâmica para minimizar a variância
              intra-classe das precisões observadas, destacando os agrupamentos reais da
              distribuição em vez de faixas fixas arbitrárias.
            </p>
          </>
        )}
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
}: {
  children: React.ReactNode;
  leftPercent: number;
}) {
  return (
    <div
      className="absolute top-0 flex -translate-x-1/2 items-start"
      style={{ left: `${leftPercent}%` }}
    >
      {children}
    </div>
  );
}

export function listComparableEditions(models: ModelResult[]): string[] {
  const ids = new Set<string>(Object.keys(EDITIONS));
  for (const m of models) for (const eid of Object.keys(m.accuracyByEdition)) ids.add(eid);
  return [...ids].sort();
}
