import { Link } from 'react-router-dom';

import type { ModelResult } from '../data/results';
import ContaminationToggle, { type ContaminationScope } from './ContaminationToggle';

interface Biggest {
  delta: number;
  label: string;
  modelId: string;
}

function biggestDelta(models: ModelResult[]): Biggest | null {
  // Δ = precisão em edições contaminadas - precisão em edições limpas.
  // Positivo = modelo vai melhor em provas que pode ter visto no treino,
  // indício de memorização. Só destacamos modelos com ambos os buckets.
  let best: Biggest | null = null;
  for (const m of models) {
    const clean = m.cleanAccuracy;
    const cont = m.contaminatedAccuracy;
    if (clean === null || cont === null) continue;
    const delta = cont - clean;
    if (best === null || Math.abs(delta) > Math.abs(best.delta)) {
      best = { delta, label: m.label, modelId: m.modelId };
    }
  }
  return best;
}

export default function ContaminationPanel({
  models,
  onScopeChange,
  scope,
}: {
  models: ModelResult[];
  scope: ContaminationScope;
  onScopeChange: (v: ContaminationScope) => void;
}) {
  const bothBuckets = models.filter(
    (m) => m.cleanAccuracy !== null && m.contaminatedAccuracy !== null,
  ).length;
  const highlight = biggestDelta(models);

  return (
    <section className="space-y-3 rounded-lg border bg-card p-5 font-sans">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <h3 className="font-sans font-semibold">Contaminação de treino</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Um modelo pode ter visto a prova durante o treino (edição publicada antes do corte de
            treino do modelo) ou não. A coluna <strong>Δ</strong> na tabela abaixo mostra a
            diferença entre a precisão em edições contaminadas e limpas — um Δ alto sugere que o
            modelo se beneficia da memorização.{' '}
            <Link className="underline text-ps-violet" to="/metodologia#contaminacao">
              Entenda a metodologia
            </Link>
            .
          </p>
          {highlight && bothBuckets > 0 && (
            <p className="mt-2 text-sm">
              Maior Δ até agora:{' '}
              <Link
                className="font-medium text-ps-violet hover:underline"
                to={`/models/${highlight.modelId}`}
              >
                {highlight.label}
              </Link>{' '}
              <span
                className={`font-mono ${highlight.delta > 0 ? 'text-amber-700' : 'text-emerald-700'}`}
              >
                {highlight.delta > 0 ? '+' : ''}
                {(highlight.delta * 100).toFixed(1)} pp
              </span>{' '}
              <span className="text-muted-foreground">
                ({bothBuckets} {bothBuckets === 1 ? 'modelo com' : 'modelos com'} dados nos dois
                buckets)
              </span>
            </p>
          )}
          {bothBuckets === 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              Ainda não há modelos com resultados em edições limpas e contaminadas simultaneamente.
              Adicione mais edições para liberar a análise de delta.
            </p>
          )}
        </div>
        <ContaminationToggle value={scope} onChange={onScopeChange} />
      </div>
    </section>
  );
}
