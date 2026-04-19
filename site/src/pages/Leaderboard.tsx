import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import ComparisonChart from '../components/ComparisonChart';
import type { ContaminationScope } from '../components/ContaminationToggle';
import { Hero } from '../components/Hero';
import LeaderboardTable from '../components/LeaderboardTable';
import ModelSelector from '../components/ModelSelector';
import { PageContainer } from '../components/PageContainer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { SlidingToggle } from '../components/ui/sliding-toggle';
import { EDITIONS } from '../data/editions';
import { allEditionIds, MODELS } from '../data/results';

const SCOPE_ITEMS = [
  { label: 'Todas as edições', value: 'all' },
  { label: 'Apenas limpas', value: 'clean' },
  { label: 'Apenas contaminadas', value: 'contaminated' },
] as const satisfies readonly { label: string; value: ContaminationScope }[];

export default function Leaderboard() {
  const [scope, setScope] = useState<ContaminationScope>('all');
  const [selected, setSelected] = useState<string[]>(() => MODELS.map((m) => m.modelId));
  const editionIds = useMemo(() => {
    const ids = allEditionIds();
    return ids.length > 0 ? ids : Object.keys(EDITIONS);
  }, []);
  const [edition, setEdition] = useState<string>(() => editionIds[0] ?? 'revalida-2025-1');

  const selectedModels = MODELS.filter((m) => selected.includes(m.modelId));

  return (
    <>
      <Hero />
      <PageContainer>
        <div className="space-y-10">
          {MODELS.length === 0 ? (
            <div className="rounded-lg border p-12 text-center text-muted-foreground">
              Nenhuma avaliação publicada ainda. Em breve: Claude, GPT, Gemini, Sabiá, Qwen, Llama,
              DeepSeek.
            </div>
          ) : (
            <>
              <section className="space-y-4">
                <div className="flex flex-col items-center gap-3 text-center">
                  <h2 className="font-sans text-xl font-bold tracking-tight sm:text-2xl">
                    Ranking
                  </h2>
                  <SlidingToggle items={SCOPE_ITEMS} value={scope} onChange={(v) => setScope(v)} />
                </div>
                <LeaderboardTable models={MODELS} contaminationScope={scope} />
                <p className="pt-2 text-center font-sans text-xs text-muted-foreground">
                  Edições publicadas antes do corte de treino do modelo são marcadas como{' '}
                  <em>contaminadas</em>. A coluna <strong>Δ</strong> mostra a diferença entre a
                  precisão em contaminadas e limpas — Δ alto sugere memorização.{' '}
                  <Link to="/metodologia#contaminacao" className="underline text-ps-violet">
                    Entenda a metodologia
                  </Link>
                  .
                </p>
              </section>

              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-sans text-xl font-bold tracking-tight sm:text-2xl">
                      Comparar modelos
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Clique nas tags para ligar/desligar modelos no gráfico.
                    </p>
                  </div>
                  {editionIds.length > 1 && (
                    <Select value={edition} onValueChange={setEdition}>
                      <SelectTrigger className="h-9 w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {editionIds.map((id) => (
                          <SelectItem key={id} value={id}>
                            {EDITIONS[id]?.label ?? id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <ModelSelector models={MODELS} selected={selected} onChange={setSelected} />
                <ComparisonChart editionId={edition} models={selectedModels} />
              </section>
            </>
          )}
        </div>
      </PageContainer>
    </>
  );
}
