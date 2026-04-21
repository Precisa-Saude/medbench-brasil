import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import ComparisonChart from '../components/ComparisonChart';
import type { ContaminationScope } from '../components/ContaminationToggle';
import { Hero } from '../components/Hero';
import LeaderboardTable from '../components/LeaderboardTable';
import SpecialtyHeatmap from '../components/SpecialtyHeatmap';
import { SlidingToggle } from '../components/ui/sliding-toggle';
import { EDITIONS } from '../data/editions';
import { allEditionIds, MODELS } from '../data/results';

// "Apenas limpas" vem primeiro e é o default porque é a visão mais honesta:
// exclui edições que o modelo pode ter visto no treino. A visão "Todas as
// edições" existe como complemento (comparar com literatura pré-existente).
// "Apenas contaminadas" foi removida — isoladamente é uma métrica de
// memorização, não de capacidade, então não serve como ranking.
const SCOPE_ITEMS = [
  { label: 'Apenas limpas', value: 'clean' },
  { label: 'Todas as edições', value: 'all' },
] as const satisfies readonly { label: string; value: ContaminationScope }[];

const gridStyle = {
  gridTemplateColumns: 'repeat(var(--grid-cols), 1fr)',
  maxWidth: 'var(--grid-max-w)',
  width: '100%',
} as const;

function SectionShell({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="mx-auto grid gap-4 px-4 py-10 md:px-0 lg:py-16" style={gridStyle}>
        <div className="col-span-full space-y-4 md:col-span-12 md:col-start-2 3xl:col-start-3">
          {children}
        </div>
      </div>
    </section>
  );
}

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
        <SectionShell className="bg-white/30">
          <div className="rounded-lg border p-12 text-center text-muted-foreground">
            Nenhuma avaliação publicada ainda. Em breve: Claude, GPT, Gemini, Sabiá, Qwen, Llama,
            DeepSeek.
          </div>
        </SectionShell>
      </>
    );
  }

  return (
    <>
      <Hero />

      <SectionShell className="bg-white/30">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="font-sans text-xl font-bold tracking-tight sm:text-2xl">Ranking</h2>
          <p className="max-w-2xl font-sans text-sm text-muted-foreground">
            A visão recomendada é <strong>Apenas limpas</strong> — são os únicos escores em edições
            que o modelo não pode ter visto no treino.
          </p>
          <SlidingToggle items={SCOPE_ITEMS} value={scope} onChange={(v) => setScope(v)} />
        </div>
        <LeaderboardTable models={MODELS} contaminationScope={scope} />
        <p className="pt-2 text-center font-sans text-sm text-muted-foreground">
          Edições publicadas antes do corte de treino do modelo são marcadas como{' '}
          <em>contaminadas</em>. A coluna <strong>Δ</strong> mostra a diferença entre a precisão em
          contaminadas e limpas — Δ alto sugere memorização.{' '}
          <Link to="/metodologia#contaminacao" className="underline text-ps-violet">
            Entenda a metodologia
          </Link>
          .
        </p>
      </SectionShell>

      <SectionShell>
        <h2 className="font-sans text-xl font-bold tracking-tight sm:text-2xl">Comparar modelos</h2>
        {/* Espelha o toggle do ranking — sem isso, o chart parece
            "faltar modelos" em 2024/1 porque está em "Apenas limpas"
            e só 2 modelos tinham cutoff anterior à edição. */}
        <div className="flex justify-center">
          <SlidingToggle items={SCOPE_ITEMS} value={scope} onChange={(v) => setScope(v)} />
        </div>
        <ComparisonChart
          contaminationScope={scope}
          editionId={edition}
          editionOptions={editionOptions}
          models={MODELS}
          onEditionChange={setEdition}
        />
      </SectionShell>

      <SectionShell className="bg-white/30">
        <div className="text-center">
          <h2 className="font-sans text-xl font-bold tracking-tight sm:text-2xl">
            Onde cada modelo acerta
          </h2>
          <p className="mx-auto mt-2 max-w-2xl font-sans text-sm text-muted-foreground">
            Precisão por área médica em todas as edições.
          </p>
        </div>
        <div className="flex justify-center">
          <SlidingToggle items={SCOPE_ITEMS} value={scope} onChange={(v) => setScope(v)} />
        </div>
        <SpecialtyHeatmap contaminationScope={scope} models={MODELS} />
      </SectionShell>
    </>
  );
}
