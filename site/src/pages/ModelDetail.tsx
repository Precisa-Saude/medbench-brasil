import { Link, useParams } from 'react-router-dom';

import { PageContainer } from '../components/PageContainer';
import SpecialtyDifficultyBar from '../components/SpecialtyDifficultyBar';
import SpecialtyRadar from '../components/SpecialtyRadar';
import TrendChart from '../components/TrendChart';
import { CodeBlock } from '../components/ui/code-block';
import { EDITIONS } from '../data/editions';
import { findModel, MODELS } from '../data/results';
import { specialtyLabel } from '../data/specialties';

export default function ModelDetail() {
  const params = useParams<{ '*': string }>();
  // modelIds podem conter barra (ex.: `meta-llama/llama-4-scout`), então usamos
  // rota wildcard `/models/*` e lemos o segmento completo.
  const id = params['*'];
  const model = id ? findModel(id) : undefined;

  if (!model) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <p className="text-muted-foreground">Modelo não encontrado.</p>
          <Link to="/" className="underline text-ps-violet">
            Voltar ao leaderboard
          </Link>
        </div>
      </PageContainer>
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

  const trendData = Object.entries(model.accuracyByEdition)
    .map(([eid, b]) => {
      const ed = EDITIONS[eid];
      return {
        edition: ed?.label ?? eid,
        estimatedHumanMean: ed ? ed.estimatedHumanMean * 100 : undefined,
        modelScore: b.accuracy * 100,
        passingScore: ed ? ed.cutoffScore * 100 : undefined,
        publishedAt: ed?.publishedAt ?? eid,
      };
    })
    .sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));

  return (
    <PageContainer>
      <div className="space-y-10">
        <header>
          <Link to="/" className="font-sans text-sm text-ps-violet underline">
            ← leaderboard
          </Link>
          <h1 className="mt-2 font-sans text-3xl font-bold tracking-tight sm:text-4xl">
            {model.label}
          </h1>
          <p className="mt-2 font-sans text-sm text-muted-foreground">
            {model.provider} · corte de treino: {model.trainingCutoff ?? 'desconhecido'} ·
            lançamento: {model.releaseDate || 'n/d'}
            {model.homepage && (
              <>
                {' · '}
                <a
                  className="text-ps-violet underline"
                  href={model.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  página oficial ↗
                </a>
              </>
            )}
          </p>
          {model.description && (
            <p className="mt-4 max-w-3xl font-serif text-lg leading-relaxed text-muted-foreground">
              {model.description}
            </p>
          )}
        </header>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card label="Precisão geral" value={`${(model.accuracy * 100).toFixed(1)}%`} />
          <Card
            label="IC 95%"
            value={`${(model.ci95[0] * 100).toFixed(1)}–${(model.ci95[1] * 100).toFixed(1)}`}
          />
          <Card
            label="Edições limpas"
            value={
              model.cleanAccuracy !== null ? `${(model.cleanAccuracy * 100).toFixed(1)}%` : '—'
            }
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
          <h2 className="font-sans text-xl font-bold tracking-tight sm:text-2xl mb-4">
            Perfil por especialidade
          </h2>
          <SpecialtyRadar data={radarData} />
        </section>

        <section>
          <h2 className="font-sans text-xl font-bold tracking-tight sm:text-2xl mb-2">
            Dificuldade por área
          </h2>
          <p className="mb-4 font-sans text-sm text-muted-foreground">
            Compara a precisão deste modelo com a média dos demais modelos no pool por área médica.
          </p>
          <SpecialtyDifficultyBar allModels={MODELS} model={model} />
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

        <section>
          <h2 className="font-sans text-xl font-bold tracking-tight sm:text-2xl mb-2">
            Precisão por edição
          </h2>
          {trendData.length >= 2 && (
            <div className="mb-4 rounded-lg border bg-card p-4">
              <TrendChart data={trendData} />
              <p className="mt-2 font-sans text-base text-muted-foreground">
                Linha violeta: precisão deste modelo. Tracejados: nota de corte (âmbar) e média
                humana estimada (verde) — referências oficiais da INEP.
              </p>
            </div>
          )}
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

        <section className="space-y-3">
          <h2 className="font-sans text-xl font-bold tracking-tight sm:text-2xl">Artefato bruto</h2>
          <p className="text-sm text-muted-foreground">
            Abaixo, o JSON agregado consumido pelo site — união das execuções deste modelo em todas
            as edições. Um arquivo por edição fica em{' '}
            <a
              className="text-ps-violet underline"
              href={`https://github.com/Precisa-Saude/medbench-brasil/tree/main/results`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <code>results/&lt;edição&gt;/{model.modelId}.json</code>
            </a>
            .
          </p>
          <CodeBlock language="json" maxHeight="32rem">
            {JSON.stringify(toRawArtifact(model), null, 2)}
          </CodeBlock>
        </section>
      </div>
    </PageContainer>
  );
}

/**
 * Remove os campos editoriais (injetados pelo site via `MODELS_METADATA`)
 * e deixa só o que vem dos artefatos agregados em `results/`.
 */
function toRawArtifact(model: ReturnType<typeof findModel>): unknown {
  if (!model) return null;
  const {
    cleanAccuracy: _cleanAccuracy,
    contaminatedAccuracy: _contaminatedAccuracy,
    description: _description,
    homepage: _homepage,
    label: _label,
    provider: _provider,
    releaseDate: _releaseDate,
    tier: _tier,
    trainingCutoff: _trainingCutoff,
    ...rest
  } = model;
  return rest;
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
