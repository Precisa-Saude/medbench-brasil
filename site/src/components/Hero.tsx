import { Link } from 'react-router-dom';

import { EDITIONS } from '../data/editions';
import { allEditionIds, MODELS } from '../data/results';

const gridStyle = {
  gridTemplateColumns: 'repeat(var(--grid-cols), 1fr)',
  maxWidth: 'var(--grid-max-w)',
  width: '100%',
} as const;

export function Hero() {
  const editionCount = allEditionIds().length || Object.keys(EDITIONS).length;
  const totalQuestions = MODELS.reduce((acc, m) => Math.max(acc, m.total / m.runsPerQuestion), 0);
  const runs = MODELS[0]?.runsPerQuestion ?? 3;

  const stats = [
    { label: 'Modelos avaliados', value: String(MODELS.length) },
    { hint: 'questões únicas', label: 'Questões', value: String(Math.round(totalQuestions)) },
    { label: 'Edições', value: String(editionCount) },
    { hint: 'por modelo', label: 'Execuções', value: String(runs) },
  ];

  return (
    <section className="relative flex min-h-screen items-center bg-ps-violet-dark text-primary-foreground">
      <div className="mx-auto grid w-full gap-4 px-4 py-16 md:px-0 lg:py-24" style={gridStyle}>
        <div className="col-span-full flex flex-col items-center space-y-8 text-center md:col-span-12 md:col-start-2 3xl:col-start-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-ps-mint" />
            <span className="font-sans text-sm font-medium text-primary-foreground/70">
              Benchmark vivo · Open source · Zero-shot, sem ferramentas
            </span>
          </div>

          <h1 className="font-sans text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            LLMs em provas médicas brasileiras
          </h1>

          <p className="max-w-3xl font-serif text-xl leading-snug text-primary-foreground/70 sm:text-2xl">
            Leaderboard reproduzível do desempenho de modelos de linguagem no{' '}
            <a
              href="https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/revalida"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ps-mint underline decoration-ps-mint/40 underline-offset-4 transition-colors hover:decoration-ps-mint"
            >
              Revalida
            </a>{' '}
            e no{' '}
            <a
              href="https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enamed"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ps-mint underline decoration-ps-mint/40 underline-offset-4 transition-colors hover:decoration-ps-mint"
            >
              ENAMED
            </a>
            , os dois exames da Matriz de Referência Comum para a Avaliação da Formação Médica. Três
            execuções por modelo, IC 95% Wilson, análise explícita de contaminação de treino.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/metodologia"
              className="inline-flex items-center justify-center rounded-full bg-ps-mint px-5 py-2.5 font-sans text-sm font-medium text-ps-violet-dark transition-colors hover:bg-ps-mint/90"
            >
              Metodologia
            </Link>
            <Link
              to="/reproducao"
              className="inline-flex items-center justify-center rounded-full border border-primary-foreground/25 px-5 py-2.5 font-sans text-sm font-medium text-primary-foreground transition-colors hover:border-ps-mint hover:text-ps-mint"
            >
              Reproduza os testes →
            </Link>
          </div>

          <dl className="grid w-full grid-cols-2 gap-3 pt-4 md:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-lg border border-primary-foreground/10 bg-white/5 p-4 font-sans backdrop-blur-sm"
              >
                <dt className="text-xs tracking-wide text-primary-foreground/50 uppercase">
                  {s.label}
                </dt>
                <dd className="mt-2 text-2xl font-semibold">{s.value}</dd>
                {s.hint && <div className="mt-1 text-xs text-primary-foreground/50">{s.hint}</div>}
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
