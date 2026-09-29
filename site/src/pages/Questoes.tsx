import { PageContainer } from '../components/PageContainer';
import QuestionsTable from '../components/QuestionsTable';
import { MODELS } from '../data/results';
import { TYPE } from '../lib/typography';

export default function Questoes() {
  return (
    <PageContainer>
      <div className="space-y-10">
        <header>
          <h1 className={TYPE.pageTitle}>Questões</h1>
          <p className={`mt-6 max-w-3xl ${TYPE.lead}`}>
            Cada linha é uma questão do Revalida ou do ENAMED com o gabarito oficial e a resposta
            majoritária de cada modelo nas três execuções. Clique em uma linha para ver o enunciado,
            as alternativas e as respostas individuais de cada run.
          </p>
        </header>
        <QuestionsTable models={MODELS} />
      </div>
    </PageContainer>
  );
}
