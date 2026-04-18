import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import ComparisonChart from '../components/ComparisonChart';
import ContaminationPanel from '../components/ContaminationPanel';
import type { ContaminationScope } from '../components/ContaminationToggle';
import LeaderboardTable from '../components/LeaderboardTable';
import ModelSelector from '../components/ModelSelector';
import StatsHero from '../components/StatsHero';
import { EDITIONS } from '../data/editions';
import { allEditionIds, MODELS } from '../data/results';

export default function Leaderboard() {
  const [scope, setScope] = useState<ContaminationScope>('all');
  const [selected, setSelected] = useState<string[]>(() => MODELS.map((m) => m.modelId));
  const editionIds = useMemo(() => {
    const ids = allEditionIds();
    return ids.length > 0 ? ids : Object.keys(EDITIONS);
  }, []);
  const [edition, setEdition] = useState<string>(() => editionIds[0] ?? 'revalida-2025-1');

  const selectedModels = MODELS.filter((m) => selected.includes(m.modelId));

  const totalQuestions = MODELS.reduce((acc, m) => Math.max(acc, m.total / m.runsPerQuestion), 0);

  return (
    <div className="space-y-10">
      <section>
        <h1 className="font-sans text-4xl font-bold tracking-tight text-primary sm:text-5xl">
          LLMs em provas médicas brasileiras
        </h1>
        <p className="mt-6 max-w-3xl font-serif text-lg leading-relaxed text-muted-foreground sm:text-xl">
          Leaderboard vivo e reproduzível do desempenho de modelos de linguagem no Revalida.
          Zero-shot, sem ferramentas, três execuções por modelo, com análise explícita de
          contaminação de treino. Veja a{' '}
          <Link to="/metodologia" className="underline text-ps-violet">
            metodologia completa
          </Link>{' '}
          ou{' '}
          <Link to="/replicacao" className="underline text-ps-violet">
            replique os testes
          </Link>
          .
        </p>
      </section>

      {MODELS.length === 0 ? (
        <div className="border rounded-lg p-12 text-center text-muted-foreground">
          Nenhuma avaliação publicada ainda. Em breve: Claude, GPT, Gemini, Sabiá, Qwen, Llama,
          DeepSeek.
        </div>
      ) : (
        <>
          <StatsHero
            stats={[
              { label: 'Modelos avaliados', value: String(MODELS.length) },
              {
                hint: 'questões únicas no dataset',
                label: 'Questões',
                value: String(Math.round(totalQuestions)),
              },
              { label: 'Edições', value: String(editionIds.length) },
              {
                hint: 'por modelo',
                label: 'Execuções',
                value: String(MODELS[0]?.runsPerQuestion ?? 3),
              },
            ]}
          />

          <ContaminationPanel models={MODELS} scope={scope} onScopeChange={setScope} />

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl">Ranking</h2>
            </div>
            <LeaderboardTable models={MODELS} contaminationScope={scope} />
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl">
                  Comparar modelos
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Clique nas tags para ligar/desligar modelos no gráfico.
                </p>
              </div>
              {editionIds.length > 1 && (
                <select
                  value={edition}
                  onChange={(e) => setEdition(e.target.value)}
                  className="border rounded-md bg-card px-3 py-1.5 text-sm font-sans"
                >
                  {editionIds.map((id) => (
                    <option key={id} value={id}>
                      {EDITIONS[id]?.label ?? id}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <ModelSelector models={MODELS} selected={selected} onChange={setSelected} />
            <ComparisonChart editionId={edition} models={selectedModels} />
          </section>
        </>
      )}
    </div>
  );
}
