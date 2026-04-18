import { Link, useParams } from 'react-router-dom';

import SpecialtyRadar from '../components/SpecialtyRadar';
import TrendChart from '../components/TrendChart';
import { MODELS } from '../data/results';

export default function ModelDetail() {
  const { id } = useParams<{ id: string }>();
  const model = MODELS.find((m) => m.modelId === id);

  if (!model) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Modelo não encontrado.</p>
        <Link to="/" className="underline text-ps-violet">
          Voltar ao leaderboard
        </Link>
      </div>
    );
  }

  const radarData = Object.entries(model.accuracyBySpecialty).map(([specialty, accuracy]) => ({
    accuracy,
    specialty,
  }));
  const trendData = Object.entries(model.accuracyByEdition).map(([edition, acc]) => ({
    edition,
    modelScore: acc * 100,
  }));

  return (
    <div className="space-y-10">
      <header>
        <Link to="/" className="text-sm text-ps-violet underline">
          ← leaderboard
        </Link>
        <h1 className="mt-2 text-3xl font-sans font-bold">{model.label}</h1>
        <p className="text-muted-foreground mt-1">
          {model.provider} · corte de treino: {model.trainingCutoff ?? 'desconhecido'}
        </p>
      </header>

      <section>
        <h2 className="text-xl font-sans font-semibold mb-4">Perfil por especialidade</h2>
        <SpecialtyRadar data={radarData} />
      </section>

      <section>
        <h2 className="text-xl font-sans font-semibold mb-4">Desempenho por edição</h2>
        <TrendChart data={trendData} />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card label="Acurácia geral" value={`${(model.accuracy * 100).toFixed(1)}%`} />
        <Card
          label="Edições limpas"
          value={model.cleanAccuracy !== null ? `${(model.cleanAccuracy * 100).toFixed(1)}%` : '—'}
        />
        <Card
          label="Edições contaminadas"
          value={
            model.contaminatedAccuracy !== null
              ? `${(model.contaminatedAccuracy * 100).toFixed(1)}%`
              : '—'
          }
        />
      </section>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-sans font-semibold">{value}</div>
    </div>
  );
}
