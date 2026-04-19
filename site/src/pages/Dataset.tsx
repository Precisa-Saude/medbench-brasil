import { PageContainer } from '../components/PageContainer';
import { CodeBlock } from '../components/ui/code-block';

export default function Dataset() {
  return (
    <PageContainer>
      <div className="space-y-10">
        <header>
          <h1 className="font-sans text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Dataset
          </h1>
          <p className="mt-6 max-w-3xl font-serif text-lg leading-relaxed text-muted-foreground sm:text-xl">
            O dataset completo está disponível no repositório como pacote npm publicado.
          </p>
        </header>

        <section>
          <h2 className="font-sans text-xl font-bold tracking-tight sm:text-2xl">Instalação</h2>
          <div className="mt-3">
            <CodeBlock language="bash">npm install @precisa-saude/medbench-dataset</CodeBlock>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-sans text-xl font-bold tracking-tight sm:text-2xl">Schema</h2>
          <p>
            Cada edição é um objeto JSON seguindo o tipo <code>Edition</code> exportado pelo pacote.
            Consulte a documentação completa no{' '}
            <a
              className="underline text-ps-violet"
              href="https://github.com/Precisa-Saude/medbench-brasil/blob/main/docs/dataset-schema.md"
            >
              repositório
            </a>
            .
          </p>
          <CodeBlock language="json">{`{
  "id": "revalida-2025-1",
  "year": 2025,
  "publishedAt": "2025-04-14",
  "cutoffScore": 0.6,
  "passRate": 0.18,
  "totalInscritos": 30120,
  "source": "https://www.gov.br/inep/.../revalida-2025-1",
  "questions": [
    {
      "id": "revalida-2025-1-q01",
      "editionId": "revalida-2025-1",
      "number": 1,
      "specialty": ["clinica-medica"],
      "stem": "Paciente de 62 anos com dispneia [...]",
      "options": {
        "A": "Solicitar ecocardiograma transtorácico.",
        "B": "Encaminhar para cateterismo cardíaco.",
        "C": "Iniciar anticoagulação oral.",
        "D": "Solicitar cintilografia de perfusão miocárdica."
      },
      "correct": "A",
      "hasImage": false,
      "hasTable": false,
      "annulled": false
    }
  ]
}`}</CodeBlock>
          <h3 className="mt-6 font-sans text-lg font-semibold tracking-tight">Campos-chave</h3>
          <dl className="space-y-3 text-sm">
            <FieldRow term="correct">
              Letra do gabarito oficial. Uma de <FieldTag>&quot;A&quot;</FieldTag>{' '}
              <FieldTag>&quot;B&quot;</FieldTag> <FieldTag>&quot;C&quot;</FieldTag>{' '}
              <FieldTag>&quot;D&quot;</FieldTag>.
            </FieldRow>
            <FieldRow term="specialty">
              Array de especialidades médicas. Uma questão pode cobrir mais de uma área.
            </FieldRow>
            <FieldRow term="hasImage / hasTable">
              Marcam questões que dependem de imagem ou tabela — o scorer pode filtrá-las via{' '}
              <FieldTag>--excludeImages</FieldTag> / <FieldTag>--excludeTables</FieldTag>.
            </FieldRow>
            <FieldRow term="annulled">
              Questões anuladas após recurso. Sempre excluídas da avaliação.
            </FieldRow>
            <FieldRow term="cutoffScore / passRate">
              Nota de corte oficial e taxa de aprovação, usadas para estimar a média humana.
            </FieldRow>
          </dl>
        </section>

        <section>
          <h2 className="font-sans text-xl font-bold tracking-tight sm:text-2xl">
            Licença dos dados
          </h2>
          <p>
            Os conteúdos das provas são de autoria do INEP e estão disponíveis publicamente. Este
            repositório contribui com a estrutura, classificação por especialidade e anotações de
            contaminação — licenciados sob Apache-2.0.
          </p>
        </section>
      </div>
    </PageContainer>
  );
}

function FieldRow({ children, term }: { children: React.ReactNode; term: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="shrink-0">
        <FieldTag>{term}</FieldTag>
      </dt>
      <dd className="text-muted-foreground">{children}</dd>
    </div>
  );
}

function FieldTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full bg-ps-violet/15 px-2 py-0.5 font-mono text-xs font-medium text-ps-violet-dark">
      {children}
    </span>
  );
}
