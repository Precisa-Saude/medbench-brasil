export default function Dataset() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-sans text-4xl font-bold tracking-tight text-primary sm:text-5xl">
          Dataset
        </h1>
        <p className="mt-6 max-w-3xl font-serif text-lg leading-relaxed text-muted-foreground sm:text-xl">
          O dataset completo está disponível no repositório como pacote npm publicado.
        </p>
      </header>

      <section>
        <h2 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl">Instalação</h2>
        <pre className="mt-3 bg-card border rounded p-4 text-sm overflow-x-auto">
          <code>npm install @precisa-saude/medbench-dataset</code>
        </pre>
      </section>

      <section>
        <h2 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl">Schema</h2>
        <p>
          Cada edição é um objeto JSON seguindo o tipo <code>Edition</code> exportado pelo pacote.
          Consulte a documentação do schema no{' '}
          <a
            className="underline text-ps-violet"
            href="https://github.com/Precisa-Saude/medbench-brasil/blob/main/docs/dataset-schema.md"
          >
            repositório
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl">
          Licença dos dados
        </h2>
        <p>
          Os conteúdos das provas são de autoria do INEP e estão disponíveis publicamente. Este
          repositório contribui com a estrutura, classificação por especialidade e anotações de
          contaminação — licenciados sob Apache-2.0.
        </p>
      </section>
    </div>
  );
}
