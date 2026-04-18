import { Link, useParams } from 'react-router-dom';

import ComparisonChart from '../components/ComparisonChart';
import { getEdition } from '../data/dataset';
import { getEditionMetadata } from '../data/editions';
import { MODELS } from '../data/results';

export default function EditionDetail() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  const meta = getEditionMetadata(id);
  const data = getEdition(id);
  const modelsForEdition = MODELS.filter(
    (m) => m.accuracyByEdition[id] !== undefined || MODELS.length > 0,
  );

  return (
    <div className="space-y-10">
      <header>
        <Link to="/" className="font-sans text-sm text-ps-violet underline">
          ← leaderboard
        </Link>
        <h1 className="mt-2 font-sans text-4xl font-bold tracking-tight sm:text-5xl">
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
          <Card label="Anuladas" value={String(data.questions.filter((q) => q.annulled).length)} />
        </section>
      )}

      <section>
        <h2 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl mb-4">
          Ranking nesta edição
        </h2>
        <ComparisonChart editionId={id} models={modelsForEdition} />
      </section>

      <section>
        <h2 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl mb-2">Fonte</h2>
        <p className="text-sm text-muted-foreground">
          Provas e gabaritos pós-recurso obtidos diretamente do portal INEP. Consulte{' '}
          <Link to="/metodologia" className="underline text-ps-violet">
            metodologia
          </Link>{' '}
          para detalhes sobre extração e classificação.
        </p>
      </section>
    </div>
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
