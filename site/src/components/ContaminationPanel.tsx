import { Link } from 'react-router-dom';

import type { ModelResult } from '../data/results';
import ContaminationToggle, { type ContaminationScope } from './ContaminationToggle';

export default function ContaminationPanel({
  models,
  scope,
  onScopeChange,
}: {
  models: ModelResult[];
  scope: ContaminationScope;
  onScopeChange: (v: ContaminationScope) => void;
}) {
  const cleanN = models.reduce(
    (acc, m) => acc + (m.contaminationSplit.clean?.n ?? 0),
    0,
  );
  const contN = models.reduce(
    (acc, m) => acc + (m.contaminationSplit.contaminated?.n ?? 0),
    0,
  );

  return (
    <section className="border rounded-lg bg-card p-5 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <h3 className="font-sans font-semibold">Contaminação de treino</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Edições anteriores ao corte de treino de um modelo são marcadas como{' '}
            <em>provavelmente contaminadas</em>. Compare os dois buckets — o delta mede o quanto
            a memorização infla o escore.{' '}
            <Link to="/metodologia#contaminacao" className="underline text-ps-violet">
              Entenda a metodologia
            </Link>
            .
          </p>
        </div>
        <ContaminationToggle value={scope} onChange={onScopeChange} />
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="border rounded-md p-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Runs limpas</div>
          <div className="mt-1 font-mono text-lg">{cleanN}</div>
          <div className="text-xs text-muted-foreground">
            edições depois do corte de treino do modelo
          </div>
        </div>
        <div className="border rounded-md p-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Runs contaminadas
          </div>
          <div className="mt-1 font-mono text-lg">{contN}</div>
          <div className="text-xs text-muted-foreground">
            edições que o modelo pode ter visto no treino
          </div>
        </div>
      </div>
    </section>
  );
}
