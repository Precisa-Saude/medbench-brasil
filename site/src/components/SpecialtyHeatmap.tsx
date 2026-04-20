import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import type { ModelResult } from '../data/results';
import { specialtyLabel } from '../data/specialties';
import { perSpecialtyForScope } from '../lib/metrics';
import type { ContaminationScope } from './ContaminationToggle';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

/**
 * Interpolação linear em OKLch entre um violeta médio (baixa precisão) e o
 * tom --primary do tema (alta precisão). Mantém a hue constante para que a
 * leitura seja "mais escuro = melhor", sem saltos de matiz. O piso de
 * luminância é escolhido para manter contraste legível com texto branco em
 * toda a escala.
 */
function colorFor(accuracy: number): string {
  const p = Math.max(0, Math.min(1, accuracy));
  const L = 0.75 - 0.35 * p;
  const C = 0.04 + 0.05 * p;
  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} 292)`;
}

export default function SpecialtyHeatmap({
  contaminationScope,
  models,
}: {
  contaminationScope: ContaminationScope;
  models: ModelResult[];
}) {
  const navigate = useNavigate();

  const { cells, orderedModels, orderedSpecialties } = useMemo(() => {
    const perModel = new Map<string, Record<string, { accuracy: number; n: number }>>();
    const specialtyN: Record<string, number> = {};

    for (const m of models) {
      const bucket = perSpecialtyForScope(m, contaminationScope);
      perModel.set(m.modelId, bucket);
      for (const [sp, b] of Object.entries(bucket)) {
        specialtyN[sp] = (specialtyN[sp] ?? 0) + b.n;
      }
    }

    const orderedSpecialties = Object.entries(specialtyN)
      .sort((a, b) => b[1] - a[1])
      .map(([sp]) => sp);

    const orderedModels = [...models]
      .filter((m) => {
        const bucket = perModel.get(m.modelId);
        return bucket && Object.keys(bucket).length > 0;
      })
      .sort((a, b) => b.accuracy - a.accuracy);

    return { cells: perModel, orderedModels, orderedSpecialties };
  }, [models, contaminationScope]);

  if (orderedModels.length === 0 || orderedSpecialties.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
        Nenhum dado por especialidade disponível no escopo atual.
      </div>
    );
  }

  const gridTemplate = `160px repeat(${orderedSpecialties.length}, minmax(72px, 1fr))`;

  return (
    <div className="rounded-lg border bg-card p-4 font-sans">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold">Precisão por área médica</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>0%</span>
          <span
            aria-hidden
            className="inline-block h-2.5 w-24 rounded"
            style={{
              background: 'linear-gradient(to right, oklch(0.75 0.04 292), oklch(0.4 0.09 292))',
            }}
          />
          <span>100%</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-max text-xs">
          {/* Cabeçalho com nomes das specialties */}
          <div className="grid items-end gap-px" style={{ gridTemplateColumns: gridTemplate }}>
            <div />
            {orderedSpecialties.map((sp) => (
              <div key={sp} className="px-1 pb-2 text-center font-medium text-muted-foreground">
                {specialtyLabel(sp)}
              </div>
            ))}
          </div>
          {/* Linhas — uma por modelo */}
          {orderedModels.map((m) => {
            const bucket = cells.get(m.modelId) ?? {};
            return (
              <div
                key={m.modelId}
                className="grid gap-px border-t border-border/60"
                style={{ gridTemplateColumns: gridTemplate }}
              >
                <button
                  type="button"
                  onClick={() => navigate(`/models/${m.modelId}`)}
                  className="cursor-pointer truncate px-2 py-2 text-left font-medium text-ps-violet underline decoration-transparent hover:decoration-current"
                  title={`Ver detalhes de ${m.label}`}
                >
                  {m.label}
                </button>
                {orderedSpecialties.map((sp) => {
                  const cell = bucket[sp];
                  if (!cell) {
                    return (
                      <div
                        key={sp}
                        className="flex items-center justify-center py-2 text-muted-foreground/50"
                      >
                        —
                      </div>
                    );
                  }
                  const bg = colorFor(cell.accuracy);
                  return (
                    <Tooltip key={sp}>
                      <TooltipTrigger asChild>
                        <div
                          className="flex cursor-default items-center justify-center py-2 font-sans font-semibold"
                          style={{ backgroundColor: bg, color: '#ffffff' }}
                        >
                          {(cell.accuracy * 100).toFixed(0)}%
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="font-sans">
                        <div className="font-semibold">{m.label}</div>
                        <div>
                          {specialtyLabel(sp)}: {(cell.accuracy * 100).toFixed(1)}% (n={cell.n})
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-3 text-base text-muted-foreground">
        Cada célula é a precisão do modelo em questões daquela área médica. Colunas ordenadas da
        área mais representada (mais questões) para a menos; linhas pela precisão geral do modelo.
      </p>
    </div>
  );
}
