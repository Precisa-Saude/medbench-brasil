import { PageContainer } from '../components/PageContainer';
import QuestionsTable from '../components/QuestionsTable';
import { MODELS } from '../data/results';

export default function Questoes() {
  return (
    <PageContainer>
      <div className="space-y-10">
        <header>
          <h1 className="font-sans text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Questões
          </h1>
          <p className="mt-6 max-w-3xl font-serif text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Cada linha é uma questão do Revalida com o gabarito oficial e a resposta majoritária de
            cada modelo nas três execuções. Clique em uma linha para ver o enunciado, as
            alternativas e as respostas individuais de cada run.
          </p>
        </header>
        <QuestionsTable models={MODELS} />
      </div>
    </PageContainer>
  );
}
