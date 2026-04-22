import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import type { ModelResult } from '../data/results';
import { ExclusionClause } from './ExclusionClause';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

type Row = {
  cleanPct: number;
  contaminatedPct: number;
  delta: number;
  label: string;
  modelId: string;
};

// Dot tem 12px (`size-3`); sem compensação, os extremos (0% e 100%)
// transbordam a faixa porque `-translate-x-1/2` só corrige metade do dot.
// Esta função remapeia: 0% → +6px, 100% → -6px, 50% → 0 — mantendo o
// centro do dot dentro do contêiner em toda a escala.
const DOT_HALF_PX = 6;
function pctToLeft(pct: number): string {
  const shift = DOT_HALF_PX - (DOT_HALF_PX * 2 * pct) / 100;
  return `calc(${pct}% + ${shift}px)`;
}

export default function ContaminationDumbbell({ models }: { models: ModelResult[] }) {
  const navigate = useNavigate();

  const { excluded, rows } = useMemo(() => {
    let noCutoff = 0;
    let insufficientSplit = 0;
    const eligible: Row[] = [];
    for (const m of models) {
      if (!m.trainingCutoff) {
        noCutoff += 1;
        continue;
      }
      if (m.cleanAccuracy === null || m.contaminatedAccuracy === null) {
        insufficientSplit += 1;
        continue;
      }
      eligible.push({
        cleanPct: m.cleanAccuracy * 100,
        contaminatedPct: m.contaminatedAccuracy * 100,
        delta: (m.contaminatedAccuracy - m.cleanAccuracy) * 100,
        label: m.label,
        modelId: m.modelId,
      });
    }
    eligible.sort((a, b) => b.delta - a.delta);
    return { excluded: { insufficientSplit, noCutoff }, rows: eligible };
  }, [models]);

  const totalModels = models.length;
  const plottedCount = rows.length;

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
        Nenhum modelo tem dados em edições limpas e contaminadas simultaneamente.
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4 font-sans">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold">Limpas vs contaminadas</h3>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="inline-block size-2.5 rounded-full"
              style={{ backgroundColor: 'var(--ps-green)' }}
            />
            <span>Limpas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="inline-block size-2.5 rounded-full"
              style={{ backgroundColor: 'var(--destructive)' }}
            />
            <span>Contaminadas</span>
          </div>
        </div>
      </div>
      <p className="mb-4 text-base text-muted-foreground">
        Modelos ordenados por Δ decrescente. Δ alto indica que o modelo acerta mais em edições
        anteriores ao seu corte de treino do que nas posteriores, sinal clássico de memorização por
        exposição aos gabaritos durante o pré-treino.
      </p>
      <div className="space-y-1 text-xs">
        {rows.map((row) => {
          const left = Math.min(row.cleanPct, row.contaminatedPct);
          const right = Math.max(row.cleanPct, row.contaminatedPct);
          return (
            <div
              key={row.modelId}
              className="grid items-center gap-3"
              style={{ gridTemplateColumns: '160px 1fr 60px' }}
            >
              <button
                className="cursor-pointer truncate text-left font-medium text-ps-violet underline decoration-transparent hover:decoration-current"
                title={`Ver detalhes de ${row.label}`}
                type="button"
                onClick={() => navigate(`/models/${row.modelId}`)}
              >
                {row.label}
              </button>
              <div className="relative h-7">
                {/* Eixo 0–100% */}
                <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
                {/* Segmento ligando os dois pontos, colorido pelo sinal do Δ.
                    Width é calculado diretamente pela diferença de pct + shift,
                    sem subtração de calc() aninhada. */}
                <div
                  className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded"
                  style={{
                    backgroundColor: row.delta > 0 ? 'var(--destructive)' : 'var(--ps-green)',
                    left: pctToLeft(left),
                    opacity: 0.35,
                    width: `calc(${right - left}% + ${-(DOT_HALF_PX * 2 * (right - left)) / 100}px)`,
                  }}
                />
                <Dot
                  color="var(--ps-green)"
                  leftPercent={row.cleanPct}
                  tooltip={`Limpas: ${row.cleanPct.toFixed(1)}%`}
                />
                <Dot
                  color="var(--destructive)"
                  leftPercent={row.contaminatedPct}
                  tooltip={`Contaminadas: ${row.contaminatedPct.toFixed(1)}%`}
                />
              </div>
              <div
                className="text-right font-mono"
                style={{
                  color: row.delta > 5 ? 'var(--destructive)' : 'var(--muted-foreground)',
                }}
              >
                Δ {row.delta >= 0 ? '+' : ''}
                {row.delta.toFixed(1)}
              </div>
            </div>
          );
        })}
      </div>
      {/* Ticks do eixo */}
      <div
        className="mt-2 grid font-mono text-[10px] text-muted-foreground"
        style={{ gridTemplateColumns: '160px 1fr 60px' }}
      >
        <div />
        <div className="relative h-4">
          {[0, 25, 50, 75, 100].map((t) => (
            <span key={t} className="absolute -translate-x-1/2" style={{ left: `${t}%` }}>
              {t}%
            </span>
          ))}
        </div>
        <div />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        <strong>
          {plottedCount} de {totalModels} modelos elegíveis para análise de contaminação.
        </strong>
        <ExclusionClause excluded={excluded} />
      </p>
    </div>
  );
}

function Dot({
  color,
  leftPercent,
  tooltip,
}: {
  color: string;
  leftPercent: number;
  tooltip: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          aria-label={tooltip}
          className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 cursor-default rounded-full border-2 border-card"
          style={{ backgroundColor: color, left: pctToLeft(leftPercent) }}
        />
      </TooltipTrigger>
      <TooltipContent className="font-sans">{tooltip}</TooltipContent>
    </Tooltip>
  );
}
