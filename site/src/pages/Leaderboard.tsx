import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { GridSection } from '../components/brand/GridSection';
import ComparisonChart from '../components/ComparisonChart';
import type { ContaminationScope } from '../components/ContaminationToggle';
import { Hero } from '../components/Hero';
import LeaderboardTable from '../components/LeaderboardTable';
import SpecialtyHeatmap from '../components/SpecialtyHeatmap';
import { SlidingToggle } from '../components/ui/sliding-toggle';
import { EDITIONS } from '../data/editions';
import { allEditionIds, MODELS } from '../data/results';
import { TYPE } from '../lib/typography';

// "Apenas limpas" vem primeiro e é o default porque é a visão mais honesta:
// exclui edições que o modelo pode ter visto no treino. A visão "Todas as
// edições" existe como complemento (comparar com literatura pré-existente).
// "Apenas contaminadas" foi removida — isoladamente é uma métrica de
// memorização, não de capacidade, então não serve como ranking.
const SCOPE_ITEMS = [
  { label: 'Apenas limpas', value: 'clean' },
  { label: 'Todas as edições', value: 'all' },
] as const satisfies readonly { label: string; value: ContaminationScope }[];

export default function Leaderboard() {
  const [scope, setScope] = useState<ContaminationScope>('clean');
  const editionIds = useMemo(() => {
    const ids = allEditionIds();
    return ids.length > 0 ? ids : Object.keys(EDITIONS);
  }, []);
  const editionOptions = useMemo(
    () => editionIds.map((id) => ({ id, label: EDITIONS[id]?.label ?? id })),
    [editionIds],
  );
  // `editionIds` já vem ordenado alfabeticamente; o schema `revalida-YYYY-N`
  // é cronológico, então o último elemento é sempre a edição mais recente.
  const [edition, setEdition] = useState<string>(() => editionIds[editionIds.length - 1] ?? '');

  if (MODELS.length === 0) {
    return (
      <>
        <Hero />
        <GridSection tone="muted">
          <div className="border-t py-12 text-muted-foreground">
            Nenhuma avaliação publicada ainda. Em breve: Claude, GPT, Gemini, Sabiá, Qwen, Llama,
            DeepSeek.
          </div>
        </GridSection>
      </>
    );
  }

  return (
    <>
      <Hero />

      <GridSection className="space-y-8" id="ranking" tone="muted">
        <div className="flex flex-col items-start gap-4">
          <h2 className={TYPE.sectionTitle}>Ranking</h2>
          <p className="max-w-2xl text-lg leading-relaxed text-foreground/75">
            A visão recomendada é <strong>Apenas limpas</strong> — são os únicos escores em edições
            que o modelo não pode ter visto no treino.
          </p>
          <SlidingToggle items={SCOPE_ITEMS} value={scope} onChange={(v) => setScope(v)} />
        </div>
        <LeaderboardTable contaminationScope={scope} models={MODELS} />
        <p className="max-w-3xl text-sm leading-relaxed text-foreground/70">
          Edições publicadas antes do corte de treino do modelo são marcadas como{' '}
          <em>contaminadas</em>. A coluna <strong>Δ</strong> mostra a diferença entre a precisão em
          contaminadas e limpas — Δ alto sugere memorização.{' '}
          <Link
            className="font-medium text-primary underline underline-offset-4 hover:decoration-2"
            to="/metodologia#contaminacao"
          >
            Entenda a metodologia
          </Link>
          .
        </p>
      </GridSection>

      <GridSection className="space-y-8" id="comparar">
        <h2 className={TYPE.sectionTitle}>Comparar modelos</h2>
        {/* Espelha o toggle do ranking — sem isso, o chart parece
            "faltar modelos" em 2024/1 porque está em "Apenas limpas"
            e só 2 modelos tinham cutoff anterior à edição. */}
        <SlidingToggle items={SCOPE_ITEMS} value={scope} onChange={(v) => setScope(v)} />
        <ComparisonChart
          contaminationScope={scope}
          editionId={edition}
          editionOptions={editionOptions}
          models={MODELS}
          onEditionChange={setEdition}
        />
      </GridSection>

      <GridSection className="space-y-8" id="especialidades" tone="muted">
        <div className="flex flex-col items-start gap-4">
          <h2 className={TYPE.sectionTitle}>Onde cada modelo acerta</h2>
          <p className="max-w-2xl text-lg leading-relaxed text-foreground/75">
            Precisão por área médica em todas as edições.
          </p>
          <SlidingToggle items={SCOPE_ITEMS} value={scope} onChange={(v) => setScope(v)} />
        </div>
        <SpecialtyHeatmap contaminationScope={scope} models={MODELS} />
      </GridSection>
    </>
  );
}
