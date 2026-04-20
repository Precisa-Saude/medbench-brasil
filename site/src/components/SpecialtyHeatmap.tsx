import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import type { ModelResult } from '../data/results';
import { specialtyLabel } from '../data/specialties';
import { perSpecialtyForScope } from '../lib/metrics';
import type { ContaminationScope } from './ContaminationToggle';

/**
 * Retorna a precisão agregada do modelo no escopo ativo, para que a ordem
 * das linhas do heatmap bata com as células exibidas (em `clean`, por ex.,
 * ordenar por `accuracy` geral deixaria a sequência inconsistente).
 */
function scopeAccuracy(m: ModelResult, scope: ContaminationScope): number {
  if (scope === 'clean') return m.cleanAccuracy ?? -1;
  if (scope === 'contaminated') return m.contaminatedAccuracy ?? -1;
  return m.accuracy;
}

/**
 * Interpolação em OKLch entre um violeta claro (baixa precisão) e o tom
 * --primary do tema (alta precisão). Mantém hue constante — "mais escuro =
 * melhor" sem saltos de matiz. O piso de luminância preserva contraste com
 * texto branco. `p` é a posição normalizada [0, 1] na escala visual; o
 * caller normaliza sobre o min/max observado para usar o gradiente inteiro
 * mesmo quando os dados ocupam só uma faixa (ex.: 67–100%).
 */
function colorFor(p: number): string {
  const t = Math.max(0, Math.min(1, p));
  const L = 0.88 - 0.58 * t;
  const C = 0.03 + 0.1 * t;
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

  const { cells, dataMax, dataMin, orderedModels, orderedSpecialties } = useMemo(() => {
    const perModel = new Map<string, Record<string, { accuracy: number; n: number }>>();
    const specialtyN: Record<string, number> = {};
    let dataMin = 1;
    let dataMax = 0;

    for (const m of models) {
      const bucket = perSpecialtyForScope(m, contaminationScope);
      perModel.set(m.modelId, bucket);
      for (const [sp, b] of Object.entries(bucket)) {
        specialtyN[sp] = (specialtyN[sp] ?? 0) + b.n;
        if (b.accuracy < dataMin) dataMin = b.accuracy;
        if (b.accuracy > dataMax) dataMax = b.accuracy;
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
      .sort((a, b) => scopeAccuracy(b, contaminationScope) - scopeAccuracy(a, contaminationScope));

    return { cells: perModel, dataMax, dataMin, orderedModels, orderedSpecialties };
  }, [models, contaminationScope]);

  // Normaliza sobre a faixa observada para que o gradiente inteiro cubra a
  // distribuição real (ex.: 67–100%) em vez de espremer tudo no topo da
  // escala 0–100. Caso degenerado (todas as células com a mesma precisão):
  // devolve 0.5 para pintar tudo no tom médio e evita divisão por ~0.
  const range = dataMax - dataMin;
  const normalize = (accuracy: number) => (range < 1e-6 ? 0.5 : (accuracy - dataMin) / range);

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
          <span>{Math.round(dataMin * 100)}%</span>
          <span
            aria-hidden
            className="inline-block h-2.5 w-24 rounded"
            style={{
              background: 'linear-gradient(to right, oklch(0.88 0.03 292), oklch(0.3 0.13 292))',
            }}
          />
          <span>{Math.round(dataMax * 100)}%</span>
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
                  const norm = normalize(cell.accuracy);
                  const bg = colorFor(norm);
                  const textColor = norm < 0.35 ? '#3d2a63' : '#ffffff';
                  // Tooltip nativo (atributo `title`) em vez de Radix por célula:
                  // para N modelos × M specialties o Radix cria um portal por
                  // célula (facilmente 400+ instâncias), inviável em grids grandes.
                  const tip = `${m.label}\n${specialtyLabel(sp)}: ${(cell.accuracy * 100).toFixed(1)}% (n=${cell.n})`;
                  return (
                    <div
                      key={sp}
                      title={tip}
                      className="flex cursor-default items-center justify-center py-2 font-sans font-semibold"
                      style={{ backgroundColor: bg, color: textColor }}
                    >
                      {(cell.accuracy * 100).toFixed(0)}%
                    </div>
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
