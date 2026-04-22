import { Link } from 'react-router-dom';

import { EDITIONS } from '../data/editions';
import { allEditionIds, MODELS } from '../data/results';

const gridStyle = {
  gridTemplateColumns: 'repeat(var(--grid-cols), 1fr)',
  maxWidth: 'var(--grid-max-w)',
  width: '100%',
} as const;

const PILLS = ['Benchmark contínuo', 'Código aberto', 'Zero-shot', 'Sem ferramentas'];

export function Hero() {
  const editionCount = allEditionIds().length || Object.keys(EDITIONS).length;
  const totalQuestions = MODELS.reduce((acc, m) => Math.max(acc, m.total / m.runsPerQuestion), 0);
  const runs = MODELS[0]?.runsPerQuestion ?? 3;

  const stats = [
    { label: 'Modelos avaliados', value: String(MODELS.length) },
    { label: 'Questões únicas', value: String(Math.round(totalQuestions)) },
    { label: 'Edições', value: String(editionCount) },
    { label: 'Execuções por modelo', value: String(runs) },
  ];

  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] items-center bg-ps-violet-dark text-primary-foreground">
      <div className="mx-auto grid w-full gap-4 px-4 py-16 md:px-0 lg:py-24" style={gridStyle}>
        <div className="col-span-full flex flex-col items-center space-y-10 text-center md:col-span-12 md:col-start-2 3xl:col-start-3">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {PILLS.map((label) => (
              <span
                key={label}
                className="inline-flex items-center rounded-full border border-primary-foreground/15 bg-white/10 px-4 py-1.5 font-sans text-sm font-medium text-primary-foreground/70 backdrop-blur-sm"
              >
                {label}
              </span>
            ))}
          </div>

          <h1 className="font-sans text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Raio-X dos LLMs em medicina brasileira
          </h1>

          <p className="max-w-4xl font-serif text-xl leading-snug text-primary-foreground/70 sm:text-2xl">
            Leaderboard reproduzível das provas{' '}
            <a
              className="text-ps-mint underline decoration-ps-mint/40 underline-offset-4 transition-colors hover:decoration-ps-mint"
              href="https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/revalida"
              rel="noopener noreferrer"
              target="_blank"
            >
              Revalida
            </a>{' '}
            e{' '}
            <a
              className="text-ps-mint underline decoration-ps-mint/40 underline-offset-4 transition-colors hover:decoration-ps-mint"
              href="https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enamed"
              rel="noopener noreferrer"
              target="_blank"
            >
              ENAMED
            </a>
            , com margem de incerteza estatística e análise explícita de contaminação de treino.
          </p>

          {/* CTAs empilhados e com larguras iguais: o `grid-cols-1` iguala os
              dois botões à coluna única, o `w-[calc(...)]` dá a largura-alvo
              (3 colunas do grid da página), e o `min-w-fit` expande a coluna
              para acomodar o botão mais largo ("Reproduza os testes →") em
              viewports estreitos, evitando clipping e wrap. */}
          <div className="grid w-[calc(3*var(--col-w)+2rem)] min-w-fit grid-cols-1 gap-3">
            <Link
              className="flex items-center justify-center whitespace-nowrap rounded-full bg-ps-mint px-5 py-2.5 font-sans text-sm font-medium text-ps-violet-dark transition-colors hover:bg-ps-mint/90"
              to="/metodologia"
            >
              Metodologia →
            </Link>
            <Link
              className="flex items-center justify-center whitespace-nowrap rounded-full border border-primary-foreground/25 px-5 py-2.5 font-sans text-sm font-medium text-primary-foreground transition-colors hover:border-ps-mint hover:text-ps-mint"
              to="/reproducao"
            >
              Reproduza os testes →
            </Link>
          </div>

          <dl className="grid w-full grid-cols-2 gap-8 pt-12 font-sans md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <dd className="text-6xl font-bold leading-none sm:text-7xl">{s.value}</dd>
                <dt className="mt-3 text-xs tracking-wide text-primary-foreground/50 uppercase">
                  {s.label}
                </dt>
              </div>
            ))}
          </dl>

          <div className="grid w-full max-w-4xl gap-8 pt-16 text-left font-sans text-sm leading-relaxed text-primary-foreground/75 md:grid-cols-2 md:pt-24 md:text-base">
            <div>
              <p className="mb-2 font-semibold text-primary-foreground">Para que serve</p>
              <p>
                Comparar modelos entre si, de forma reprodutível e em português, para que
                pesquisadores, educadores e profissionais de saúde escolham com critério qual LLM
                usar em apoio ao estudo, revisão de literatura, material didático ou ferramentas de
                consulta a conhecimento.
              </p>
            </div>
            <div>
              <p className="mb-2 font-semibold text-primary-foreground">O que não mede</p>
              <p>
                Anamnese, exame físico, raciocínio clínico sob incerteza, relação médico-paciente,
                responsabilidade profissional. Precisão em questões objetivas não equivale a
                competência clínica e não indica aptidão para exercer medicina.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
