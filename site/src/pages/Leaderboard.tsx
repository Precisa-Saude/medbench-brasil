import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import ComparisonChart from '../components/ComparisonChart';
import type { ContaminationScope } from '../components/ContaminationToggle';
import { Hero } from '../components/Hero';
import LeaderboardTable from '../components/LeaderboardTable';
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
  // `editionIds` já vem ordenado alfabeticamente; o schema `revalida-YYYY-N`
  // é cronológico, então o último elemento é sempre a edição mais recente.
  const [edition, setEdition] = useState<string>(() => editionIds[editionIds.length - 1] ?? '');

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
                  <p className="max-w-2xl font-sans text-sm text-muted-foreground">
                    A visão recomendada é <strong>Apenas limpas</strong> — são os únicos escores em
                    edições que o modelo não pode ter visto no treino.
                  </p>
                  <SlidingToggle items={SCOPE_ITEMS} value={scope} onChange={(v) => setScope(v)} />
                </div>
                <LeaderboardTable models={MODELS} contaminationScope={scope} />
                <p className="pt-2 text-center font-sans text-sm text-muted-foreground">
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
                  <h2 className="font-sans text-xl font-bold tracking-tight sm:text-2xl">
                    Comparar modelos
                  </h2>
                  <div className="flex items-center gap-3">
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
                    {edition && (
                      <Link
                        to={`/editions/${edition}`}
                        className="font-sans text-sm text-ps-violet underline whitespace-nowrap"
                      >
                        Ver detalhes →
                      </Link>
                    )}
                  </div>
                </div>
                {/* Espelha o toggle do ranking — sem isso, o chart parece
                    "faltar modelos" em 2024/1 porque está em "Apenas limpas"
                    e só 2 modelos tinham cutoff anterior à edição. */}
                <div className="flex justify-center">
                  <SlidingToggle items={SCOPE_ITEMS} value={scope} onChange={(v) => setScope(v)} />
                </div>
                <ComparisonChart contaminationScope={scope} editionId={edition} models={MODELS} />
              </section>
            </>
          )}
        </div>
      </PageContainer>
    </>
  );
}
