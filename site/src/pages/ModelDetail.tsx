import { Link, useParams } from 'react-router-dom';

import SpecialtyRadar from '../components/SpecialtyRadar';
import { findModel } from '../data/results';
import { specialtyLabel } from '../data/specialties';

export default function ModelDetail() {
  const { id } = useParams<{ id: string }>();
  const model = id ? findModel(id) : undefined;

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

  const radarData = Object.entries(model.perSpecialty).map(([specialty, b]) => ({
    accuracy: b.accuracy,
    specialty: specialtyLabel(specialty),
  }));

  const perQuestion = model.perQuestion ?? [];
  const consistent = perQuestion.filter((p) => {
    const letters = new Set(p.runs.map((r) => r.parsed));
    return letters.size === 1;
  }).length;
  const consistency = perQuestion.length > 0 ? consistent / perQuestion.length : null;

  const letterStats: Record<'A' | 'B' | 'C' | 'D', { chosen: number; wrong: number }> = {
    A: { chosen: 0, wrong: 0 },
    B: { chosen: 0, wrong: 0 },
    C: { chosen: 0, wrong: 0 },
    D: { chosen: 0, wrong: 0 },
  };
  for (const p of perQuestion) {
    if (p.majority) letterStats[p.majority].chosen += 1;
    if (p.majority && !p.majorityCorrect) letterStats[p.majority].wrong += 1;
  }

  return (
    <div className="space-y-10">
      <header>
        <Link to="/" className="font-sans text-sm text-ps-violet underline">
          ← leaderboard
        </Link>
        <h1 className="mt-2 font-sans text-4xl font-bold tracking-tight sm:text-5xl">
          {model.label}
        </h1>
        <p className="mt-4 font-serif text-lg leading-relaxed text-muted-foreground">
          {model.provider} · corte de treino: {model.trainingCutoff ?? 'desconhecido'} · lançamento:{' '}
          {model.releaseDate || 'n/d'}
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card label="Precisão geral" value={`${(model.accuracy * 100).toFixed(1)}%`} />
        <Card
          label="IC 95%"
          value={`${(model.ci95[0] * 100).toFixed(1)}–${(model.ci95[1] * 100).toFixed(1)}`}
        />
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

      <section>
        <h2 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl mb-4">
          Perfil por especialidade
        </h2>
        <SpecialtyRadar data={radarData} />
      </section>

      {consistency !== null && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card
            label="Consistência entre runs"
            value={`${(consistency * 100).toFixed(1)}%`}
            hint="% de questões onde as 3 execuções escolheram a mesma letra"
          />
          <Card
            label="Questões avaliadas"
            value={String(perQuestion.length)}
            hint={`${model.runsPerQuestion} runs cada`}
          />
          <Card
            label="Maioria correta"
            value={`${perQuestion.filter((p) => p.majorityCorrect).length} / ${perQuestion.length}`}
          />
        </section>
      )}

      {perQuestion.length > 0 && (
        <section>
          <h2 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl mb-4">
            Distribuição por letra escolhida
          </h2>
          <div className="grid grid-cols-4 gap-3 font-sans">
            {(['A', 'B', 'C', 'D'] as const).map((l) => {
              const stat = letterStats[l];
              const errorRate = stat.chosen === 0 ? 0 : stat.wrong / stat.chosen;
              return (
                <div key={l} className="rounded-lg border bg-card p-4">
                  <div className="text-xs tracking-wide text-muted-foreground uppercase">
                    Letra {l}
                  </div>
                  <div className="mt-2 font-mono text-2xl font-semibold">{stat.chosen}</div>
                  <div className="text-xs text-muted-foreground">
                    escolhas · {stat.wrong} erradas ({(errorRate * 100).toFixed(0)}%)
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl mb-2">
          Precisão por edição
        </h2>
        <ul className="divide-y rounded-lg border font-sans text-sm">
          {Object.entries(model.accuracyByEdition).length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted-foreground">
              Dados por edição ainda não disponíveis para este modelo.
            </li>
          ) : (
            Object.entries(model.accuracyByEdition).map(([eid, b]) => (
              <li key={eid} className="px-4 py-3 flex items-center justify-between">
                <Link to={`/editions/${eid}`} className="text-ps-violet underline">
                  {eid}
                </Link>
                <span className="font-mono text-sm">
                  {(b.accuracy * 100).toFixed(1)}%{' '}
                  <span className="text-muted-foreground">(n={b.n})</span>
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section>
        <h2 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl mb-2">
          Artefato bruto
        </h2>
        <p className="text-sm text-muted-foreground mb-2">
          O JSON completo (parâmetros de API, system prompt, todas as execuções) fica em
          <code className="ml-1">results/{model.modelId}.json</code> no repositório.
        </p>
        <a
          className="text-ps-violet underline text-sm"
          href={`https://github.com/Precisa-Saude/medbench-brasil/blob/main/results/${model.modelId}.json`}
        >
          ver no GitHub
        </a>
      </section>
    </div>
  );
}

function Card({ hint, label, value }: { hint?: string; label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 font-sans">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
