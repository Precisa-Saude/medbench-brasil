import { SYSTEM_PROMPT } from '@precisa-saude/medbench-harness/prompt';

import ContaminationDumbbell from '../components/ContaminationDumbbell';
import CutoffGapScatter from '../components/CutoffGapScatter';
import { PageContainer } from '../components/PageContainer';
import { CodeBlock } from '../components/ui/code-block';
import { MODELS } from '../data/results';

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
            Exames avaliados
          </h2>
          <p className="mt-3">
            Desde outubro de 2025, Revalida e ENAMED são aplicados no mesmo dia sob a{' '}
            <strong>Matriz de Referência Comum para a Avaliação da Formação Médica</strong> — cinco
            áreas com peso igual: Clínica Médica, Cirurgia, Ginecologia-Obstetrícia, Pediatria e
            Medicina de Família e Comunidade. O ENAMED também serve de porta de entrada para o Enare
            (residência). Tratamos os dois exames como edições de um único benchmark: mesma matriz,
            duas portas de entrada, um leaderboard.
          </p>
        </section>

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
            Toda prova pública (Revalida ou ENAMED) anterior ao corte de treino de um modelo é
            marcada como <em>provavelmente contaminada</em>. Relatamos precisão separadamente para
            edições limpas e contaminadas — a diferença entre as duas mede quanto memorização infla
            o escore.
          </p>
          <p className="mt-3">
            O recorte mais confiável é sempre a edição mais recente da INEP. A cada nova prova, o
            leaderboard ganha um ponto de dado limpo para todos os modelos avaliados antes daquela
            data.
          </p>
          <div className="mt-6 space-y-4">
            <ContaminationDumbbell models={MODELS} />
            <CutoffGapScatter models={MODELS} />
          </div>
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
          <p className="mt-3 text-muted-foreground">
            Referências formatadas conforme ABNT NBR 6023:2018. Data de acesso: 20 abr. 2026.
          </p>

          <h3 className="mt-6 font-sans text-lg font-semibold tracking-tight">
            Provas e gabaritos
          </h3>
          <ul className="mt-3 space-y-3">
            <AbntRef
              author="INSTITUTO NACIONAL DE ESTUDOS E PESQUISAS EDUCACIONAIS ANÍSIO TEIXEIRA"
              title="Provas e gabaritos"
              imprint="Brasília, DF: INEP"
              url="https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/revalida/provas-e-gabaritos"
            />
          </ul>

          <h3 className="mt-6 font-sans text-lg font-semibold tracking-tight">
            Cortes de treino — documentação oficial dos fornecedores
          </h3>
          <ul className="mt-3 space-y-3">
            <AbntRef
              author="ANTHROPIC"
              title="Models overview"
              imprint="[S. l.]: Anthropic, [2026]"
              url="https://platform.claude.com/docs/en/docs/about-claude/models/overview"
            />
            <AbntRef
              author="OPENAI"
              title="Models"
              imprint="[S. l.]: OpenAI, [2026]"
              url="https://platform.openai.com/docs/models"
            />
            <AbntRef
              author="GOOGLE"
              title="Gemini API: models"
              imprint="[S. l.]: Google, [2026]"
              url="https://ai.google.dev/gemini-api/docs/models"
            />
            <AbntRef
              author="META"
              title="The Llama 4 herd: The beginning of a new era of natively multimodal AI innovation"
              imprint="[S. l.]: Meta AI, 5 abr. 2025"
              url="https://ai.meta.com/blog/llama-4-multimodal-intelligence/"
            />
            <AbntRef
              author="DEEPSEEK"
              title="DeepSeek-R1 release"
              imprint="[S. l.]: DeepSeek, 20 jan. 2025"
              url="https://api-docs.deepseek.com/news/news250120"
            />
            <AbntRef
              author="QWEN TEAM"
              title="Qwen"
              imprint="[S. l.]: Alibaba Cloud, [2026]"
              url="https://qwenlm.github.io/"
            />
            <AbntRef
              author="MARITACA AI"
              title="Inteligência artificial para o Brasil"
              imprint="São Paulo: Maritaca AI, [2026]"
              url="https://maritaca.ai/"
            />
          </ul>
        </section>
      </div>
    </PageContainer>
  );
}

/**
 * Referência no estilo ABNT NBR 6023:2018 para documento online:
 *   AUTOR. **Título**. Imprenta (local, editora, data). Disponível em: URL. Acesso em: DD mmm. AAAA.
 */
function AbntRef({
  author,
  imprint,
  title,
  url,
}: {
  author: string;
  imprint: string;
  title: string;
  url: string;
}) {
  return (
    <li className="leading-relaxed">
      {author}. <span className="font-semibold">{title}</span>. {imprint}. Disponível em:{' '}
      <a
        className="text-ps-violet break-all underline"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {url}
      </a>
      . Acesso em: 20 abr. 2026.
    </li>
  );
}
