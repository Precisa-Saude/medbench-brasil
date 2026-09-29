import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { EDITIONS } from '../data/editions';
import { allEditionIds, MODELS } from '../data/results';
import { TYPE } from '../lib/typography';
import { gridStyle } from './brand/GridSection';
import { SectionBackdrop } from './brand/SectionBackdrop';

const PILLS = ['Benchmark contínuo', 'Código aberto', 'Zero-shot', 'Sem ferramentas'];

// Três colunas cada: as quatro pílulas ocupam exatamente as 12 colunas úteis.
const PILL_COLUMNS = [
  'md:col-start-2 3xl:col-start-3',
  'md:col-start-5 3xl:col-start-6',
  'md:col-start-8 3xl:col-start-9',
  'md:col-start-11 3xl:col-start-12',
];

const PURPOSE = [
  {
    text: 'Comparar modelos entre si, de forma reprodutível e em português, para que pesquisadores, educadores e profissionais de saúde escolham com critério qual LLM usar em apoio ao estudo, revisão de literatura, material didático ou ferramentas de consulta a conhecimento.',
    title: 'Para que serve',
  },
  {
    text: 'Anamnese, exame físico, raciocínio clínico sob incerteza, relação médico-paciente, responsabilidade profissional. Precisão em questões objetivas não equivale a competência clínica e não indica aptidão para exercer medicina.',
    title: 'O que não mede',
  },
];

const linkClass =
  'font-medium text-primary underline decoration-ps-violet underline-offset-4 transition-colors hover:decoration-2';

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
    <>
      <section className="relative isolate overflow-hidden border-b bg-background text-primary">
        <SectionBackdrop />
        <div
          className="relative mx-auto grid items-center gap-x-4 gap-y-12 px-4 pt-16 pb-12 md:px-0 lg:min-h-[calc(100vh-4rem-5rem)] lg:pt-20"
          style={gridStyle}
        >
          <div className="col-span-full md:col-span-12 md:col-start-2 lg:col-span-6 lg:col-start-2 lg:pr-8 3xl:col-start-3">
            <p className={`mb-5 ${TYPE.kicker}`}>medbench-brasil</p>
            <h1 className={`max-w-[14ch] ${TYPE.h1}`}>
              Raio-X dos LLMs <em className="brand-highlight">em medicina brasileira</em>
            </h1>
            <p className="mt-6 mb-8 max-w-[44ch] font-sans text-lg leading-relaxed">
              Leaderboard reproduzível das provas{' '}
              <a
                className={linkClass}
                href="https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/revalida"
                rel="noopener noreferrer"
                target="_blank"
              >
                Revalida
              </a>{' '}
              e{' '}
              <a
                className={linkClass}
                href="https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enamed"
                rel="noopener noreferrer"
                target="_blank"
              >
                ENAMED
              </a>
              , com margem de incerteza estatística e análise explícita de contaminação de treino.
            </p>
            <Link
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 font-sans text-sm font-medium whitespace-nowrap text-primary-foreground transition-colors hover:bg-primary/90"
              to="/metodologia"
            >
              Metodologia
              <ArrowRight
                aria-hidden="true"
                className="size-[18px] transition-transform duration-200 group-hover:translate-x-1"
              />
            </Link>
            <Link
              className="mt-5 flex w-fit items-center gap-3 font-sans text-sm underline underline-offset-[5px] hover:decoration-2"
              to="/reproducao"
            >
              Reproduza os testes
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>

          {/* Painel lavanda opaco sobre o fundo geométrico, como a demonstração
              da /laudos: os números são o objeto que a abertura mostra. */}
          <dl className="col-span-full grid grid-cols-2 gap-3 bg-[#dedcf2] p-4 md:col-span-12 md:col-start-2 md:p-6 lg:col-span-6 lg:col-start-8 3xl:col-start-9">
            {stats.map((s) => (
              <div
                key={s.label}
                className="flex flex-col-reverse justify-end gap-2 rounded-md bg-white p-5 text-[#30264f] shadow-[0_0_0_1px_#463c6d24,0_6px_16px_#463c6d12] md:p-6"
              >
                <dt className="font-sans text-sm text-primary">{s.label}</dt>
                <dd className={TYPE.statValue}>{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto grid gap-4 px-4 pb-4 md:px-0" style={gridStyle}>
          {PILLS.map((label, idx) => (
            <span
              key={label}
              className={`col-span-7 border-t border-primary/20 pt-4 font-sans text-sm md:col-span-3 ${PILL_COLUMNS[idx]}`}
            >
              {label}
            </span>
          ))}
        </div>
      </section>

      <section className="border-b bg-background py-16 md:py-24">
        <div className="mx-auto grid gap-4 px-4 md:px-0" style={gridStyle}>
          {PURPOSE.map((item, idx) => (
            <div
              key={item.title}
              className={`col-span-full border-t py-6 md:col-span-6 ${idx === 0 ? 'md:col-start-2 3xl:col-start-3' : 'md:col-start-8 3xl:col-start-9'}`}
            >
              <span aria-hidden="true" className="mb-2.5 block font-sans text-sm text-primary">
                0{idx + 1}
              </span>
              <h2 className={TYPE.cardTitle}>{item.title}</h2>
              <p className="mt-4 max-w-[60ch] leading-relaxed text-foreground/75">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
