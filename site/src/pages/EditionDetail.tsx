import { Link, useParams } from 'react-router-dom';

import ComparisonChart from '../components/ComparisonChart';
import { PageContainer } from '../components/PageContainer';
import { getEdition } from '../data/dataset';
import { getEditionMetadata } from '../data/editions';
import { MODELS } from '../data/results';

/**
 * Mapeamento 1–5 do Conceito Enade (Portaria INEP nº 478/2025, replicado por
 * Correia et al., PROPOR 2026). Duplicado em `packages/eval-harness/src/enade.ts`
 * porque o entry-point principal do harness puxa `loadEdition` com `fs`,
 * incompatível com bundler do site. Se atualizar os limiares, atualize
 * também a versão do harness.
 */
function rateToEnadeLevel(rate: number): 1 | 2 | 3 | 4 | 5 {
  if (rate < 0.4) return 1;
  if (rate < 0.6) return 2;
  if (rate < 0.75) return 3;
  if (rate < 0.9) return 4;
  return 5;
}

export default function EditionDetail() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  const meta = getEditionMetadata(id);
  const data = getEdition(id);
  const modelsWithResult = MODELS.filter((m) => m.accuracyByEdition[id]);
  const approved = modelsWithResult.filter((m) => m.accuracyByEdition[id]?.passesCutoff).length;
  const enadeLevel =
    modelsWithResult.length > 0 ? rateToEnadeLevel(approved / modelsWithResult.length) : null;

  return (
    <PageContainer>
      <div className="space-y-10">
        <header>
          <Link to="/" className="font-sans text-sm text-ps-violet underline">
            ← leaderboard
          </Link>
          <h1 className="mt-2 font-sans text-3xl font-bold tracking-tight sm:text-4xl">
            {meta.label}
          </h1>
          <p className="mt-4 font-serif text-lg leading-relaxed text-muted-foreground">
            Nota de corte: {(meta.cutoffScore * 100).toFixed(0)}% · Taxa de aprovação:{' '}
            {(meta.passRate * 100).toFixed(0)}% · Média humana estimada:{' '}
            {(meta.estimatedHumanMean * 100).toFixed(0)}%
          </p>
        </header>

        {data && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card label="Questões totais" value={String(data.questions.length)} />
            <Card
              label="Com imagem"
              value={String(data.questions.filter((q) => q.hasImage).length)}
            />
            <Card
              label="Com tabela"
              value={String(data.questions.filter((q) => q.hasTable).length)}
            />
            <Card
              label="Anuladas"
              value={String(data.questions.filter((q) => q.annulled).length)}
            />
          </section>
        )}

        {enadeLevel !== null && (
          <section className="rounded-lg border bg-card p-6 font-sans">
            <div className="flex items-baseline justify-between gap-4 flex-wrap">
              <div>
                <div className="text-sm uppercase tracking-wide text-muted-foreground">
                  Classe de LLMs — Conceito Enade
                </div>
                <div className="mt-1 flex items-baseline gap-3">
                  <div className="text-4xl font-bold">Nível {enadeLevel}</div>
                  <div className="text-muted-foreground text-sm">
                    {approved}/{modelsWithResult.length} modelos aprovados (
                    {((approved / modelsWithResult.length) * 100).toFixed(0)}%)
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground max-w-md">
                Aplicação do Conceito Enade 1–5 do MEC aos modelos avaliados, tratando-os como uma
                turma de egressos. Ver{' '}
                <Link to="/metodologia" className="underline text-ps-violet">
                  metodologia
                </Link>{' '}
                e Correia et al., PROPOR 2026.
              </div>
            </div>
          </section>
        )}

        <section>
          <h2 className="font-sans text-xl font-bold tracking-tight sm:text-2xl mb-4">
            Ranking nesta edição
          </h2>
          <ComparisonChart editionId={id} models={modelsWithResult} />
        </section>

        <section>
          <h2 className="font-sans text-xl font-bold tracking-tight sm:text-2xl mb-2">Fonte</h2>
          <p className="text-sm text-muted-foreground">
            Provas e gabaritos pós-recurso obtidos diretamente do portal INEP. Consulte{' '}
            <Link to="/metodologia" className="underline text-ps-violet">
              metodologia
            </Link>{' '}
            para detalhes sobre extração e classificação.
          </p>
        </section>
      </div>
    </PageContainer>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 font-sans">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}
