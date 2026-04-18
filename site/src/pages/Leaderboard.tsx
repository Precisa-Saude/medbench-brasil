import { useState } from 'react';
import { Link } from 'react-router-dom';

import ContaminationToggle, { type ContaminationScope } from '../components/ContaminationToggle';
import LeaderboardTable from '../components/LeaderboardTable';
import { MODELS } from '../data/results';

export default function Leaderboard() {
  const [scope, setScope] = useState<ContaminationScope>('all');

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-sans font-bold text-primary">
          LLMs em provas médicas brasileiras
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-muted-foreground">
          Leaderboard vivo e reproduzível de desempenho de modelos de linguagem no Revalida.
          Zero-shot, sem ferramentas, três execuções por modelo, com análise explícita de
          contaminação de treino. Veja a{' '}
          <Link to="/metodologia" className="underline text-ps-violet">
            metodologia completa
          </Link>
          .
        </p>
      </section>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-sans font-semibold">Ranking</h2>
        <ContaminationToggle value={scope} onChange={setScope} />
      </div>

      {MODELS.length === 0 ? (
        <div className="border rounded-lg p-12 text-center text-muted-foreground">
          Nenhuma avaliação publicada ainda. Em breve: Claude, GPT, Gemini, Sabiá, Qwen, Llama,
          DeepSeek.
        </div>
      ) : (
        <LeaderboardTable models={MODELS} contaminationScope={scope} />
      )}
    </div>
  );
}
