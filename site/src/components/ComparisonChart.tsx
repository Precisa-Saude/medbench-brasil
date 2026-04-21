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

import { EDITIONS, getEditionMetadata } from '../data/editions';
import type { ModelResult } from '../data/results';
import { jenksBreaks, jenksClass } from '../lib/jenks';
import type { ContaminationScope } from './ContaminationToggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
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
  editionOptions,
  models,
  onEditionChange,
}: {
  contaminationScope?: ContaminationScope;
  editionId: string;
  editionOptions?: { id: string; label: string }[];
  models: ModelResult[];
  onEditionChange?: (id: string) => void;
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

  const cutoffPct = edition.cutoffScore * 100;
  const humanPct = edition.estimatedHumanMean * 100;

  // Monta a lista de pills de referência. Quando a edição traz
  // `extraReferences` (ex.: ENAMED com taxas por rede pública/privada),
  // omitimos "Candidatos" porque as extras carregam a mesma informação de
  // forma mais fiel e redundariam o pill.
  //
  // `priority` controla quem ganha o row 0 em caso de colisão: extras são
  // priority 0 (preferidas no topo), Corte/Candidatos são priority 1. Isso
  // mantém as linhas de dados empíricos (Privada/Pública) alinhadas no topo.
  const rawLabels: Array<{
    label: string;
    leftPercent: number;
    priority: number;
    tooltip: string;
  }> = [
    {
      label: 'Corte',
      leftPercent: cutoffPct,
      priority: 1,
      tooltip: 'Nota de corte oficial da INEP para aprovação nesta edição.',
    },
  ];
  if (!edition.extraReferences?.length) {
    rawLabels.push({
      label: 'Candidatos',
      leftPercent: humanPct,
      priority: 1,
      tooltip: `Precisão média estimada dos candidatos, retrocalculada da nota de corte + taxa oficial de aprovação (${(edition.passRate * 100).toFixed(0)}%).`,
    });
  }
  for (const ref of edition.extraReferences ?? []) {
    rawLabels.push({
      label: ref.label,
      leftPercent: ref.score * 100,
      priority: 0,
      tooltip: ref.tooltip,
    });
  }

  // Stagger vertical quando pills ficam próximos demais no eixo X — evita
  // sobreposição visual das legendas. Heurística: 8pp no eixo X corresponde
  // a ~80px na área plotada típica, o que cobre a largura de um pill.
  const COLLISION_PP = 8;
  // Ordena por (prioridade, posição) para que extras sejam alocadas antes
  // de Corte — greedy em row 0 escolhe primeiro, empurrando Corte para row 1
  // quando há colisão.
  const sorted = [...rawLabels].sort(
    (a, b) => a.priority - b.priority || a.leftPercent - b.leftPercent,
  );
  const rowsTaken: number[][] = [];
  const labelEntries = sorted.map((entry) => {
    let row = 0;
    while ((rowsTaken[row] ?? []).some((x) => Math.abs(x - entry.leftPercent) < COLLISION_PP)) {
      row += 1;
    }
    rowsTaken[row] = [...(rowsTaken[row] ?? []), entry.leftPercent];
    return { ...entry, row };
  });
  const labelRows = Math.max(1, rowsTaken.length);
  const TOP_MARGIN = labelRows * 28 + 10;

  const showEditionSelect =
    editionOptions && editionOptions.length > 1 && onEditionChange !== undefined;
  const showFamilies = allFamilies.length > 1;

  return (
    <div className="space-y-3 font-sans">
      {(showEditionSelect || showFamilies) && (
        <div className="flex flex-wrap items-center gap-2">
          {showEditionSelect && (
            <Select value={editionId} onValueChange={onEditionChange}>
              <SelectTrigger className="h-8 w-44 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {editionOptions!.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {showFamilies && (
            <>
              <span className="ml-2 text-xs text-muted-foreground">Famílias:</span>
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
            </>
          )}
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
              <h3 className="font-sans font-semibold">
                <Link
                  to={`/editions/${editionId}`}
                  className="text-ps-violet underline decoration-ps-violet/30 underline-offset-4 transition-colors hover:decoration-ps-violet"
                >
                  {edition.label}
                </Link>{' '}
                — precisão por modelo
              </h3>
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
            <p className="mb-4 text-base text-muted-foreground">
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
                      new Set([
                        0,
                        25,
                        50,
                        75,
                        100,
                        Math.round(cutoffPct),
                        // Humano/Candidatos só aparece quando não há
                        // extraReferences — não adicionar tick órfão no
                        // eixo quando o pill/linha também estão ocultos.
                        ...(edition.extraReferences?.length ? [] : [Math.round(humanPct)]),
                        ...(edition.extraReferences ?? []).map((r) => Math.round(r.score * 100)),
                      ]),
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
                  {!edition.extraReferences?.length && (
                    <ReferenceLine
                      x={edition.estimatedHumanMean * 100}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      ifOverflow="extendDomain"
                    />
                  )}
                  {(edition.extraReferences ?? []).map((ref) => (
                    <ReferenceLine
                      key={ref.label}
                      x={ref.score * 100}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      ifOverflow="extendDomain"
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
                        target="_blank"
                        rel="noopener noreferrer"
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
  row = 0,
}: {
  children: React.ReactNode;
  leftPercent: number;
  /** Linha vertical (0 = topo, 1 = segunda linha) para evitar colisão entre
   * pills próximos no eixo X. Cada linha desce ~28px (altura do pill + gap). */
  row?: number;
}) {
  return (
    <div
      className="absolute flex -translate-x-1/2 items-start"
      style={{ left: `${leftPercent}%`, top: `${row * 28}px` }}
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
