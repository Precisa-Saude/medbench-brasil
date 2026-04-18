import { Link } from 'react-router-dom';

export default function Replicacao() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-sans text-4xl font-bold tracking-tight text-primary sm:text-5xl">
          Replicação
        </h1>
        <p className="mt-6 max-w-3xl font-serif text-lg leading-relaxed text-muted-foreground sm:text-xl">
          Todo o harness é código aberto. Você pode rodar exatamente a mesma avaliação contra
          qualquer modelo — proprietário via API ou open-weight local — usando suas próprias chaves.
          Abaixo, o caminho completo em seis passos.
        </p>
      </header>

      <section>
        <h2 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl">
          1. Clone e instale
        </h2>
        <pre className="bg-card border rounded p-4 text-sm overflow-x-auto">
          <code>{`git clone https://github.com/Precisa-Saude/medbench-brasil.git
cd medbench-brasil
pnpm install`}</code>
        </pre>
      </section>

      <section>
        <h2 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl">
          2. Exporte a chave do fornecedor
        </h2>
        <p>Apenas um dos abaixo é necessário, conforme o backend escolhido:</p>
        <pre className="bg-card border rounded p-4 text-sm overflow-x-auto">
          <code>{`export ANTHROPIC_API_KEY=sk-ant-...
export OPENAI_API_KEY=sk-...
export GOOGLE_API_KEY=AIza...      # ou GEMINI_API_KEY
# Para modelos locais (Ollama), nada além de ter o servidor em localhost:11434`}</code>
        </pre>
      </section>

      <section>
        <h2 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl">
          3. Rode a avaliação
        </h2>
        <p className="text-sm text-muted-foreground">
          O protocolo é idêntico para todos os backends: zero-shot, sem ferramentas, três execuções
          por questão. Veja a{' '}
          <Link to="/metodologia" className="underline text-ps-violet">
            metodologia
          </Link>{' '}
          para o contrato completo.
        </p>

        <h3 className="font-sans text-lg font-semibold tracking-tight mt-4">Anthropic</h3>
        <pre className="bg-card border rounded p-4 text-sm overflow-x-auto">
          <code>{`pnpm --filter @precisa-saude/medbench-harness exec medbench \\
  --backend anthropic --model claude-opus-4-7 \\
  --edition revalida-2025-1 --runs 3 \\
  --cutoff 2025-03-01 --label "Claude Opus 4.7"`}</code>
        </pre>

        <h3 className="font-sans text-lg font-semibold tracking-tight mt-4">OpenAI</h3>
        <pre className="bg-card border rounded p-4 text-sm overflow-x-auto">
          <code>{`pnpm --filter @precisa-saude/medbench-harness exec medbench \\
  --backend openai --model gpt-5.4 \\
  --edition revalida-2025-1 --runs 3 \\
  --cutoff 2025-06-01 --label "GPT-5.4"`}</code>
        </pre>

        <h3 className="font-sans text-lg font-semibold tracking-tight mt-4">Google (Gemini)</h3>
        <pre className="bg-card border rounded p-4 text-sm overflow-x-auto">
          <code>{`pnpm --filter @precisa-saude/medbench-harness exec medbench \\
  --backend google --model gemini-2.5-pro \\
  --edition revalida-2025-1 --runs 3 \\
  --cutoff 2025-01-01 --label "Gemini 2.5 Pro"`}</code>
        </pre>

        <h3 className="font-sans text-lg font-semibold tracking-tight mt-4">Local via Ollama</h3>
        <pre className="bg-card border rounded p-4 text-sm overflow-x-auto">
          <code>{`# Em outro terminal:
ollama pull qwen3:latest
ollama serve

# Na raiz do repo:
pnpm --filter @precisa-saude/medbench-harness exec medbench \\
  --backend ollama --model qwen3:latest \\
  --baseUrl http://localhost:11434/v1 \\
  --edition revalida-2025-1 --runs 3 \\
  --cutoff 2025-02-01 --label "Qwen 3"`}</code>
        </pre>
      </section>

      <section>
        <h2 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl">4. Resultados</h2>
        <p>
          O harness grava <code>results/&lt;modelId&gt;.json</code> com precisão, IC95 Wilson, split
          por contaminação, breakdown por especialidade e edição, e uma linha por questão com a
          letra escolhida em cada execução.
        </p>
      </section>

      <section>
        <h2 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl">
          5. Visualize localmente
        </h2>
        <pre className="bg-card border rounded p-4 text-sm overflow-x-auto">
          <code>{`pnpm --filter @medbench-brasil/site dev
# Abra http://localhost:4321`}</code>
        </pre>
        <p className="text-sm text-muted-foreground">
          O site lê <code>results/*.json</code> no build e monta o leaderboard automaticamente.
        </p>
      </section>

      <section>
        <h2 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl">
          6. Publique no leaderboard oficial
        </h2>
        <p>
          Abra um PR com (a) o <code>results/&lt;modelId&gt;.json</code> gerado e (b) uma entrada em{' '}
          <code>site/src/data/models.ts</code> com rótulo, fornecedor, tier, data de lançamento e
          corte de treino (com link para a fonte oficial).
        </p>
      </section>

      <section>
        <h2 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl">Integridade</h2>
        <p>
          O harness nunca passa ferramentas, conectores ou histórico. O system prompt é literal e
          público. Três execuções por modelo. Todos os parâmetros de API são registrados. Qualquer
          desvio exige uma ADR — veja{' '}
          <a
            className="underline text-ps-violet"
            href="https://github.com/Precisa-Saude/medbench-brasil/blob/main/docs/development/adr/0002-benchmark-integrity.md"
          >
            ADR 0002
          </a>
          .
        </p>
      </section>
    </div>
  );
}
