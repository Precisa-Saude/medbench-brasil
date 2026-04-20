import { Link } from 'react-router-dom';

import { PageContainer } from '../components/PageContainer';
import { CodeBlock } from '../components/ui/code-block';

export default function Reproducao() {
  return (
    <PageContainer>
      <div className="space-y-10">
        <header>
          <h1 className="font-sans text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Reprodução
          </h1>
          <p className="mt-6 max-w-3xl font-serif text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Todo o harness é código aberto. Você pode rodar exatamente a mesma avaliação contra
            qualquer modelo — proprietário via API ou open-weight local — usando suas próprias
            chaves. Abaixo, o caminho completo em seis passos.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="font-sans text-xl font-bold tracking-tight sm:text-2xl">Pacotes</h2>
          <p>
            O projeto publica dois pacotes npm independentes — use o que se encaixa no seu fluxo:
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="group relative rounded-lg border bg-card p-5 transition-colors hover:border-ps-violet/40 hover:bg-muted/50">
              <a
                href="https://www.npmjs.com/package/@precisa-saude/medbench-harness"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 rounded-lg focus-visible:ring-2 focus-visible:ring-ps-violet focus-visible:outline-none"
                aria-label="Abrir @precisa-saude/medbench-harness no npm"
              />
              <code className="font-mono text-sm font-semibold text-ps-violet-dark underline decoration-transparent group-hover:decoration-current">
                @precisa-saude/medbench-harness
              </code>
              <p className="mt-2 text-sm text-muted-foreground">
                CLI <code>medbench</code> que executa o protocolo de avaliação contra qualquer
                backend (Anthropic, OpenAI, Google, OpenRouter, Ollama) e grava os artefatos em{' '}
                <code>results/</code>.
              </p>
            </div>
            <div className="group relative rounded-lg border bg-card p-5 transition-colors hover:border-ps-violet/40 hover:bg-muted/50">
              <a
                href="https://www.npmjs.com/package/@precisa-saude/medbench-dataset"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 rounded-lg focus-visible:ring-2 focus-visible:ring-ps-violet focus-visible:outline-none"
                aria-label="Abrir @precisa-saude/medbench-dataset no npm"
              />
              <code className="font-mono text-sm font-semibold text-ps-violet-dark underline decoration-transparent group-hover:decoration-current">
                @precisa-saude/medbench-dataset
              </code>
              <p className="mt-2 text-sm text-muted-foreground">
                As provas anotadas — Revalida e ENAMED — com especialidade por questão, flags de
                imagem/tabela/anulação e metadados oficiais da INEP. Documentação completa na{' '}
                <Link to="/dataset" className="relative z-10 underline text-ps-violet">
                  página Dataset
                </Link>
                .
              </p>
            </div>
          </div>
          <p className="text-muted-foreground">
            O caminho recomendado abaixo clona o monorepo (harness + dataset juntos). Para apenas
            consumir os dados ou instalar o CLI global, veja os pacotes no npm.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-sans text-xl font-bold tracking-tight sm:text-2xl">
            1. Clone e instale
          </h2>
          <CodeBlock language="bash">{`git clone https://github.com/Precisa-Saude/medbench-brasil.git
cd medbench-brasil
pnpm install`}</CodeBlock>
        </section>

        <section className="space-y-3">
          <h2 className="font-sans text-xl font-bold tracking-tight sm:text-2xl">
            2. Configure a chave do fornecedor
          </h2>
          <p>
            Crie um arquivo <code>.env.local</code> na raiz do repositório com as chaves dos
            backends que pretende usar. O harness carrega esse arquivo automaticamente no startup.
            Inclua apenas as linhas relevantes:
          </p>
          <CodeBlock language="bash">{`# .env.local
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=AIza...          # ou GEMINI_API_KEY
OPENROUTER_API_KEY=sk-or-...    # acesso unificado a modelos open-weight
# Para modelos locais (Ollama) nada é necessário além do servidor em localhost:11434`}</CodeBlock>
          <p className="text-muted-foreground">
            <code>.env.local</code> já está no <code>.gitignore</code> — a chave nunca vai para o
            repositório.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-sans text-xl font-bold tracking-tight sm:text-2xl">
            3. Rode a avaliação
          </h2>
          <p className="text-muted-foreground">
            O protocolo é idêntico para todos os backends: zero-shot, sem ferramentas, três
            execuções por questão. Veja a{' '}
            <Link to="/metodologia" className="underline text-ps-violet">
              metodologia
            </Link>{' '}
            para o contrato completo.
          </p>

          <div className="space-y-2">
            <h3 className="font-sans text-lg font-semibold tracking-tight">Anthropic</h3>
            <CodeBlock language="bash">{`pnpm --filter @precisa-saude/medbench-harness exec medbench \\
  --backend anthropic --model claude-opus-4-7 \\
  --edition revalida-2025-1 --runs 3 \\
  --cutoff 2025-03-01 --label "Claude Opus 4.7"`}</CodeBlock>
          </div>

          <div className="space-y-2">
            <h3 className="font-sans text-lg font-semibold tracking-tight">OpenAI</h3>
            <CodeBlock language="bash">{`pnpm --filter @precisa-saude/medbench-harness exec medbench \\
  --backend openai --model gpt-5.4 \\
  --edition revalida-2025-1 --runs 3 \\
  --cutoff 2025-06-01 --label "GPT-5.4"`}</CodeBlock>
          </div>

          <div className="space-y-2">
            <h3 className="font-sans text-lg font-semibold tracking-tight">Google (Gemini)</h3>
            <CodeBlock language="bash">{`pnpm --filter @precisa-saude/medbench-harness exec medbench \\
  --backend google --model gemini-2.5-pro \\
  --edition revalida-2025-1 --runs 3 \\
  --cutoff 2025-01-01 --label "Gemini 2.5 Pro"`}</CodeBlock>
          </div>

          <div className="space-y-2">
            <h3 className="font-sans text-lg font-semibold tracking-tight">
              OpenRouter (Llama 4, DeepSeek, Qwen, etc.)
            </h3>
            <p className="text-muted-foreground">
              Gateway unificado para modelos open-weight sem hospedar localmente. Use o{' '}
              <code>modelId</code> no formato do{' '}
              <a
                className="underline text-ps-violet"
                href="https://openrouter.ai/models"
                target="_blank"
                rel="noopener noreferrer"
              >
                catálogo OpenRouter
              </a>
              . Declare o corte de treino com base na documentação oficial do fornecedor do modelo.
            </p>
            <CodeBlock language="bash">{`pnpm --filter @precisa-saude/medbench-harness exec medbench \\
  --backend openrouter --model meta-llama/llama-4-maverick \\
  --edition revalida-2025-1 --runs 3 \\
  --cutoff 2024-08-01 --label "Llama 4 Maverick"`}</CodeBlock>
          </div>

          <div className="space-y-2">
            <h3 className="font-sans text-lg font-semibold tracking-tight">Local via Ollama</h3>
            <CodeBlock language="bash">{`# Em outro terminal:
ollama pull qwen3:latest
ollama serve

# Na raiz do repo:
pnpm --filter @precisa-saude/medbench-harness exec medbench \\
  --backend ollama --model qwen3:latest \\
  --baseUrl http://localhost:11434/v1 \\
  --edition revalida-2025-1 --runs 3 \\
  --cutoff 2025-02-01 --label "Qwen 3"`}</CodeBlock>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-sans text-xl font-bold tracking-tight sm:text-2xl">4. Resultados</h2>
          <p>
            O harness grava <code>results/&lt;modelId&gt;.json</code> com precisão, IC95 Wilson,
            split por contaminação, breakdown por especialidade e edição, e uma linha por questão
            com a letra escolhida em cada execução.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-sans text-xl font-bold tracking-tight sm:text-2xl">
            5. Visualize localmente
          </h2>
          <CodeBlock language="bash">{`pnpm --filter @medbench-brasil/site dev
# Abra http://localhost:4321`}</CodeBlock>
          <p className="text-muted-foreground">
            O site lê <code>results/*.json</code> no build e monta o leaderboard automaticamente.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-sans text-xl font-bold tracking-tight sm:text-2xl">
            6. Publique no leaderboard oficial
          </h2>
          <p>
            Abra um PR com (a) o <code>results/&lt;edição&gt;/&lt;modelId&gt;.json</code> gerado e
            (b) uma entrada em <code>site/src/data/models.ts</code> chaveada pelo{' '}
            <code>modelId</code>. Exemplo:
          </p>
          <CodeBlock language="json">{`// site/src/data/models.ts — MODELS_METADATA
{
  "meta-llama/llama-4-maverick": {
    "label": "Llama 4 Maverick",
    "modelId": "meta-llama/llama-4-maverick",
    "provider": "Meta · OpenRouter",
    "tier": "open-weight",
    "releaseDate": "2025-04-05",
    "trainingCutoff": "2024-08-01",
    "trainingCutoffSource": "https://huggingface.co/meta-llama/Llama-4-Maverick-17B-128E-Instruct",
    "homepage": "https://ai.meta.com/blog/llama-4-multimodal-intelligence/",
    "description": "Flagship da família Llama 4 da Meta (MoE 17B × 128 experts, 400B total). Multimodal nativo."
  }
}`}</CodeBlock>
          <p className="text-muted-foreground">
            <code>trainingCutoff</code> vem exclusivamente de artefatos publicados pelo fornecedor
            (docs de API, model card no HF, tech report no arXiv, release notes — ADR 0002);{' '}
            <code>trainingCutoffSource</code> é a URL exata. Quando o fornecedor não publica, os
            dois campos ficam <code>undefined</code> e a contaminação é classificada como{' '}
            <em>unknown</em>. <code>tier</code> é <code>&quot;proprietaria&quot;</code> ou{' '}
            <code>&quot;open-weight&quot;</code>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-sans text-xl font-bold tracking-tight sm:text-2xl">Integridade</h2>
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
    </PageContainer>
  );
}
