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
        <details className="mx-auto mt-6 max-w-2xl rounded-md border border-border bg-muted/30 px-5 py-4">
          <summary className={`cursor-pointer ${TYPE.h3}`}>
            Por que um modelo mais novo às vezes aparece abaixo de um mais antigo?
          </summary>
          <div className={`mt-3 space-y-3 ${TYPE.meta}`}>
            <p>
              É comum supor que cada geração supera a anterior em tudo. Não é o que acontece — e
              este ranking mostra vários casos do contrário. Alguns motivos:
            </p>
            <p>
              <strong>Cada modelo é otimizado para alguma coisa.</strong> Boa parte dos lançamentos
              recentes é ajustada para código, uso de ferramentas e tarefas de agente que rodam por
              horas. Nada disso é o que uma prova de múltipla escolha em português mede. Ganhar
              nessas frentes pode custar desempenho em conhecimento clínico em pt-BR.
            </p>
            <p>
              <strong>A diferença pode não ser real.</strong> Cada escore vem com um intervalo de
              confiança de 95%. Quando os intervalos de dois modelos se sobrepõem, a ordem entre
              eles não é distinguível dos dados — a prova tem 85 questões pontuáveis, o que dá
              resolução de poucos pontos percentuais, não de décimos.
            </p>
            <p>
              <strong>Modelo antigo pode ter visto a prova.</strong> Escore em edição anterior ao
              corte de treino do modelo entra como <em>contaminado</em>: pode refletir memorização,
              não raciocínio. Por isso a visão recomendada é <strong>Apenas limpas</strong>.
            </p>
            <p>
              <strong>Configuração também pesa.</strong> Alguns fornecedores expõem controles de
              quanto o modelo "pensa" antes de responder, e o padrão varia de um modelo para outro
              dentro da mesma família. Fixamos esse nível e registramos em cada medição, justamente
              para que a comparação seja entre modelos e não entre configurações.
            </p>
            <p>
              Nada disso quer dizer que o ranking está errado. Quer dizer que ele mede uma coisa
              específica: acertar questões de prova médica brasileira, sem ferramentas e sem
              consulta. É uma fatia estreita do que esses modelos fazem.
            </p>
          </div>
        </details>
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
