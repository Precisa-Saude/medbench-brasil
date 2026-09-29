import { ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { GridSection } from '../components/brand/GridSection';
import ComparisonChart from '../components/ComparisonChart';
import type { ContaminationScope } from '../components/ContaminationToggle';
import { Hero } from '../components/Hero';
import LeaderboardTable from '../components/LeaderboardTable';
import SpecialtyHeatmap from '../components/SpecialtyHeatmap';
import { SlidingToggle } from '../components/ui/sliding-toggle';
import { editionsWithPreliminaryKey } from '../data/dataset';
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
  const preliminares = useMemo(() => editionsWithPreliminaryKey(), []);
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
        {preliminares.length > 0 && (
          <p className="max-w-3xl text-sm leading-relaxed text-foreground/60" role="note">
            <strong className="font-semibold">Escores provisórios.</strong>{' '}
            {preliminares.map((id) => EDITIONS[id]?.label ?? id).join(', ')}{' '}
            {preliminares.length === 1 ? 'foi corrigida' : 'foram corrigidas'} com o gabarito{' '}
            <em>preliminar</em> da INEP, anterior à análise de recursos. O ranking agrega todas as
            edições, então esses números entram aqui e serão reprocessados quando o gabarito
            definitivo for publicado.
          </p>
        )}
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
        {/* Mesmo desenho do FAQ da /laudos no platform: cartão com borda que
            reage ao hover, gatilho de 24px de padding e chevron que gira ao
            abrir. Usa <details> em vez do Accordion do Radix para não somar
            dependência só por isto. O comportamento nativo já é acessível;
            o que se perde é a animação de altura. */}
        <details className="group mx-auto mt-6 max-w-2xl overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/50">
          <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-4 transition-colors [&::-webkit-details-marker]:hidden group-[:not([open])]:hover:bg-muted/50">
            <span className={`pr-4 text-left text-foreground ${TYPE.cardTitle}`}>
              Por que um modelo mais novo às vezes aparece abaixo de um mais antigo?
            </span>
            <ChevronDown
              aria-hidden="true"
              className="h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-180"
            />
          </summary>
          <div className={`space-y-3 px-6 pb-4 text-foreground/70 ${TYPE.cardBody}`}>
            <p>
              É comum supor que cada geração supera a anterior em tudo. Este ranking mostra vários
              casos do contrário. Alguns motivos:
            </p>
            <p>
              <strong>Cada modelo é otimizado para alguma coisa.</strong> Boa parte dos lançamentos
              recentes é ajustada para código, uso de ferramentas e tarefas de agente que rodam por
              horas. Uma prova de múltipla escolha em português não mede nada disso. Ganhar nessas
              frentes pode custar desempenho em conhecimento clínico em pt-BR.
            </p>
            <p>
              <strong>A diferença pode não ser real.</strong> Cada escore vem com um intervalo de
              confiança de 95%. Quando os intervalos de dois modelos se sobrepõem, a ordem entre
              eles não é distinguível dos dados. A prova tem 85 questões pontuáveis, o que dá
              resolução de poucos pontos percentuais.
            </p>
            <p>
              <strong>Modelo antigo pode ter visto a prova.</strong> Escore em edição anterior ao
              corte de treino do modelo entra como <em>contaminado</em>, porque pode estar
              refletindo memorização. Por isso a visão recomendada é <strong>Apenas limpas</strong>.
            </p>
            <p>
              <strong>Configuração também pesa.</strong> Alguns fornecedores expõem controles de
              quanto o modelo "pensa" antes de responder, e o padrão varia de um modelo para outro
              dentro da mesma família. Fixamos esse nível em <code>high</code> e gravamos o valor em
              cada medição, para que a comparação não misture configurações.
            </p>
            <p>
              O ranking mede acertar questões de prova médica brasileira, sem ferramentas e sem
              consulta. Um modelo pode render melhor em outras tarefas e mesmo assim aparecer abaixo
              nesta tabela.
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
