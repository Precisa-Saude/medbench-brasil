import { SYSTEM_PROMPT } from '@precisa-saude/medbench-harness/prompt';

import { PageContainer } from '../components/PageContainer';
import { CodeBlock } from '../components/ui/code-block';

export default function Metodologia() {
  return (
    <PageContainer>
      <div className="space-y-10">
        <header>
          <h1 className="font-sans text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Metodologia
          </h1>
          <p className="mt-6 max-w-3xl font-serif text-lg leading-relaxed text-muted-foreground sm:text-xl">
            O medbench-brasil existe porque um leaderboard público só é útil se for reproduzível e
            honesto sobre suas limitações. Esta página documenta o protocolo exato usado para cada
            avaliação.
          </p>
        </header>

        <section>
          <h2 className="font-sans text-xl font-bold tracking-tight sm:text-2xl">
            Protocolo de avaliação
          </h2>
          <ul className="mt-3 list-disc list-inside space-y-1 text-foreground">
            <li>Zero-shot, uma questão por requisição, sem histórico nem few-shot</li>
            <li>Nenhuma ferramenta, conector, capacidade de busca ou RAG</li>
            <li>Três execuções por modelo; média e IC 95% (Wilson score) reportados</li>
            <li>Questões com imagem, tabela ou anuladas excluídas por padrão</li>
            <li>
              Todos os parâmetros de API registrados em <code>results/</code>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-sans text-xl font-bold tracking-tight sm:text-2xl">
            System prompt literal
          </h2>
          <div className="mt-3">
            <CodeBlock>{SYSTEM_PROMPT}</CodeBlock>
          </div>
        </section>

        <section id="contaminacao">
          <h2 className="font-sans text-xl font-bold tracking-tight sm:text-2xl">
            Contaminação de treino
          </h2>
          <p className="mt-3">
            Toda prova pública do Revalida anterior ao corte de treino de um modelo é marcada como{' '}
            <em>provavelmente contaminada</em>. Relatamos precisão separadamente para edições limpas
            e contaminadas — a diferença entre as duas mede quanto memorização infla o escore.
          </p>
          <p className="mt-3">
            O recorte mais confiável é sempre a edição mais recente da INEP. A cada nova prova, o
            leaderboard ganha um ponto de dado limpo para todos os modelos avaliados antes daquela
            data.
          </p>
        </section>

        <section>
          <h2 className="font-sans text-xl font-bold tracking-tight sm:text-2xl">
            Linha de base humana
          </h2>
          <p className="mt-3">
            Mostramos três linhas em cada gráfico por edição: nota de corte oficial (publicada no
            edital da INEP), média humana estimada (retrocalculada a partir da taxa de aprovação,
            assumindo distribuição normal) e o escore do modelo. A nota de corte sozinha é uma linha
            de base ruim — a taxa de aprovação do Revalida fica na casa de 15–20%, então a média
            real dos candidatos está bem abaixo da nota de corte.
          </p>
        </section>

        <section>
          <h2 className="font-sans text-xl font-bold tracking-tight sm:text-2xl">Fontes</h2>
          <ul className="mt-3 list-disc list-inside space-y-2 text-foreground">
            <li>
              Provas e gabaritos:{' '}
              <a
                className="underline text-ps-violet"
                href="https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/revalida/provas-e-gabaritos"
                target="_blank"
                rel="noopener noreferrer"
              >
                INEP Revalida
              </a>
            </li>
            <li>
              Cortes de treino dos modelos — documentação oficial de cada fornecedor:
              <ul className="mt-2 ml-6 list-[circle] list-outside space-y-1 text-sm">
                <li>
                  Anthropic (Claude Opus 4.5/4.6/4.7):{' '}
                  <a
                    className="underline text-ps-violet"
                    href="https://docs.anthropic.com/en/docs/about-claude/models/overview"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    docs.anthropic.com/models/overview
                  </a>
                </li>
                <li>
                  OpenAI (GPT-5.1/5.2/5.4):{' '}
                  <a
                    className="underline text-ps-violet"
                    href="https://platform.openai.com/docs/models"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    platform.openai.com/docs/models
                  </a>
                </li>
                <li>
                  Google (Gemini 2.5 Pro / 3.1 Pro):{' '}
                  <a
                    className="underline text-ps-violet"
                    href="https://ai.google.dev/gemini-api/docs/models"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ai.google.dev/gemini-api/docs/models
                  </a>
                </li>
                <li>
                  Meta (Llama 4 Scout/Maverick):{' '}
                  <a
                    className="underline text-ps-violet"
                    href="https://ai.meta.com/blog/llama-4-multimodal-intelligence/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ai.meta.com/blog/llama-4-multimodal-intelligence
                  </a>
                </li>
                <li>
                  DeepSeek (V3.1 / R1):{' '}
                  <a
                    className="underline text-ps-violet"
                    href="https://api-docs.deepseek.com/news/news250120"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    api-docs.deepseek.com
                  </a>
                </li>
                <li>
                  Alibaba Qwen (3.5 / 3.6):{' '}
                  <a
                    className="underline text-ps-violet"
                    href="https://qwenlm.github.io/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    qwenlm.github.io
                  </a>
                </li>
                <li>
                  Maritaca AI (Sabiá 4):{' '}
                  <a
                    className="underline text-ps-violet"
                    href="https://maritaca.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    maritaca.ai
                  </a>
                </li>
              </ul>
            </li>
          </ul>
        </section>
      </div>
    </PageContainer>
  );
}
