import { SYSTEM_PROMPT } from '@precisa-saude/medbench-harness/prompt';

import ContaminationDumbbell from '../components/ContaminationDumbbell';
import CutoffGapScatter from '../components/CutoffGapScatter';
import { PageContainer } from '../components/PageContainer';
import { CodeBlock } from '../components/ui/code-block';
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip';
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
            <li>
              <TermTag term="Zero-shot">
                O modelo recebe apenas o enunciado e as alternativas, sem exemplos resolvidos. Mede
                o conhecimento já internalizado no treino.
              </TermTag>
              , uma questão por requisição, sem histórico nem{' '}
              <TermTag term="few-shot">
                Técnica em que o prompt inclui exemplos resolvidos antes da questão real, ajudando o
                modelo a inferir o formato esperado. Não usamos aqui para evitar pistas de resposta.
              </TermTag>
            </li>
            <li>
              Nenhuma ferramenta, conector, capacidade de busca ou{' '}
              <TermTag term="RAG">
                Retrieval-Augmented Generation: o modelo consulta uma base externa (diretrizes,
                UpToDate, literatura) durante a resposta. Proibido no medbench para isolar o
                conhecimento do próprio modelo.
              </TermTag>
            </li>
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

        <section id="variancia">
          <h2 className="font-sans text-xl font-bold tracking-tight sm:text-2xl">
            Por que rodamos três vezes: variância e deriva de fornecedor
          </h2>
          <p className="mt-3">
            Cada modelo é avaliado três vezes em cada edição e reportamos a média acompanhada de um
            intervalo de confiança de 95%. Isso existe porque a mesma pergunta feita ao mesmo modelo
            pode produzir respostas diferentes em execuções distintas. A nota final flutua alguns
            pontos percentuais entre rodadas por razões que vale explicitar.
          </p>

          <h3 className="mt-6 font-sans text-lg font-semibold tracking-tight">
            Por que não é determinístico
          </h3>
          <p className="mt-3">
            <strong>Aritmética de GPU não é associativa.</strong> Operações de ponto flutuante em
            precisão reduzida (bf16, fp8) acumulam erros de arredondamento que mudam com a ordem das
            somas. Entre execuções, os kernels podem reagrupar operações e produzir probabilidades
            ligeiramente diferentes. Em questões onde o modelo está confiante, nada muda. Em
            questões onde ele hesita entre duas alternativas, um bit é suficiente para inverter a
            escolha.
          </p>

          <p className="mt-3">
            <strong>Arquiteturas com roteamento dinâmico amplificam o efeito.</strong> Modelos de{' '}
            <TermTag term="mistura de especialistas">
              Arquitetura onde o modelo é dividido em muitas sub-redes (os especialistas); cada
              token de entrada é roteado para um subconjunto pequeno delas, não para todas. Qwen 3
              235B, DeepSeek V3/R1 e Mixtral são exemplos. O roteamento depende do contexto e pode
              variar entre execuções, produzindo saídas distintas para a mesma entrada.
            </TermTag>{' '}
            roteiam cada token para um subconjunto de especialistas. Esse roteamento depende também
            dos outros tokens que estão no mesmo lote de inferência. Duas execuções da mesma
            pergunta com companheiros de lote diferentes podem ativar especialistas diferentes e
            produzir saídas diferentes.
          </p>

          <h3 className="mt-6 font-sans text-lg font-semibold tracking-tight">
            O nome do modelo é uma rota, não um artefato congelado
          </h3>
          <p className="mt-3">
            <code>claude-opus-4-7</code> ou <code>meta-llama/llama-3.3-70b-instruct</code> é um
            endereço que o fornecedor aponta para o que ele quiser. Atualizações silenciosas
            acontecem: nova versão com ajustes de guardrails, troca para uma variante{' '}
            <TermTag term="quantizada">
              Versão comprimida do modelo que usa menos bits por peso (ex.: 8 bits em vez de 16),
              reduzindo custo de GPU e latência. A contrapartida é perda de precisão numérica que
              pode afetar o desempenho em casos borderline.
            </TermTag>{' '}
            mais barata, reconfiguração de hardware sob carga. Não há notificação ao usuário, e nada
            garante que o modelo servido em abril seja idêntico ao de março.
          </p>

          <p className="mt-3">
            Isso importa especialmente para modelos open-source acessados via OpenRouter (Llama,
            DeepSeek, Qwen, Mistral). O OpenRouter não serve os modelos: ele roteia a requisição
            para um entre vários fornecedores terceirizados (DeepInfra, Together, Fireworks,
            Hyperbolic). Cada um usa hardware, quantização e stack de inferência diferentes. A mesma
            chamada para <code>deepseek/deepseek-r1</code> pode pousar em fornecedores diferentes em
            momentos diferentes, cada um com características numéricas próprias.
          </p>

          <h3 className="mt-6 font-sans text-lg font-semibold tracking-tight">
            Como interpretar diferenças entre execuções
          </h3>
          <p className="mt-3">
            Com 85 questões por edição e precisão típica em torno de 80%, o erro padrão binomial é
            de aproximadamente 4,3pp e o IC95 (Wilson score) tem meia-largura próxima de 5pp. Duas
            execuções independentes do mesmo modelo costumam diferir por 3 a 5pp sem que nada tenha
            mudado: é o nível esperado de ruído amostral.
          </p>

          <p className="mt-3">
            Quando uma re-execução produz delta superior a 10pp, o ruído amostral não explica mais a
            diferença e a causa precisa ser investigada. Possíveis explicações: troca silenciosa de
            quantização pelo fornecedor, troca do fornecedor terceirizado no OpenRouter, re-treino
            sob o mesmo nome de rota, ou bug na pipeline de parsing ou scoring. Todos os parâmetros
            da chamada e o log bruto de cada resposta ficam em <code>results/</code> justamente para
            permitir esse tipo de auditoria a posteriori.
          </p>

          <p className="mt-3 rounded-md bg-muted/40 p-4 text-sm">
            <strong>Limite deste benchmark.</strong> Não fixamos fornecedor terceirizado específico
            no OpenRouter e os fornecedores fechados não expõem versão congelada via API que
            possamos exigir. A nota de um modelo em uma edição é uma foto do que o fornecedor servia
            quando rodamos. Um modelo que escorregou no ranking entre edições pode simplesmente
            estar sendo servido por uma variante mais leve. A cada nova edição, reexecutamos todos
            os modelos para manter a comparação sob condições contemporâneas.
          </p>
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
            Os cortes vêm exclusivamente de artefatos publicados pelo fornecedor: docs de API, model
            card no Hugging Face, technical report no arXiv ou release notes. Quando o fornecedor
            não publica o corte (caso atual de Mistral e Qwen), o modelo é classificado como{' '}
            <em>unknown</em> e não entra nem na fatia limpa nem na contaminada — evitamos estimar
            porque o número vira base para gráficos e decisões. A URL exata de cada corte está no
            código (<code>site/src/data/models.ts</code>, campo <code>trainingCutoffSource</code>).
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
          <p className="mt-3 text-sm text-muted-foreground">
            As URLs abaixo são as fontes primárias de cada corte; a data exata usada no leaderboard
            está em <code>site/src/data/models.ts</code> no campo <code>trainingCutoffSource</code>{' '}
            de cada entrada.
          </p>
          <ul className="mt-3 space-y-3">
            <AbntRef
              author="ANTHROPIC"
              title="How up-to-date is Claude's training data?"
              imprint="[S. l.]: Anthropic Help Center, [2026]"
              url="https://support.claude.com/en/articles/8114494-how-up-to-date-is-claude-s-training-data"
            />
            <AbntRef
              author="ANTHROPIC"
              title="Models overview"
              imprint="[S. l.]: Anthropic, [2026]"
              url="https://platform.claude.com/docs/en/about-claude/models/overview"
            />
            <AbntRef
              author="OPENAI"
              title="GPT-5.1 model"
              imprint="[S. l.]: OpenAI Developer Docs, [2026]"
              url="https://developers.openai.com/api/docs/models/gpt-5.1"
            />
            <AbntRef
              author="OPENAI"
              title="GPT-5.2 model"
              imprint="[S. l.]: OpenAI Developer Docs, [2026]"
              url="https://developers.openai.com/api/docs/models/gpt-5.2"
            />
            <AbntRef
              author="OPENAI"
              title="GPT-5.4 model"
              imprint="[S. l.]: OpenAI Developer Docs, [2026]"
              url="https://developers.openai.com/api/docs/models/gpt-5.4"
            />
            <AbntRef
              author="GOOGLE"
              title="Gemini 2.5 Pro — Gemini API docs"
              imprint="[S. l.]: Google, [2026]"
              url="https://ai.google.dev/gemini-api/docs/models/gemini-2.5-pro"
            />
            <AbntRef
              author="GOOGLE"
              title="Gemini 3.1 Pro Preview — Gemini API docs"
              imprint="[S. l.]: Google, [2026]"
              url="https://ai.google.dev/gemini-api/docs/models/gemini-3.1-pro-preview"
            />
            <AbntRef
              author="META"
              title="Llama-3.3-70B-Instruct — model card"
              imprint="[S. l.]: Hugging Face, 6 dez. 2024"
              url="https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct"
            />
            <AbntRef
              author="META"
              title="Llama-4-Maverick-17B-128E-Instruct — model card"
              imprint="[S. l.]: Hugging Face, 5 abr. 2025"
              url="https://huggingface.co/meta-llama/Llama-4-Maverick-17B-128E-Instruct"
            />
            <AbntRef
              author="META"
              title="Llama-4-Scout-17B-16E-Instruct — model card"
              imprint="[S. l.]: Hugging Face, 5 abr. 2025"
              url="https://huggingface.co/meta-llama/Llama-4-Scout-17B-16E-Instruct"
            />
            <AbntRef
              author="GUO, D. et al."
              title="DeepSeek-R1: incentivizing reasoning capability in LLMs via reinforcement learning"
              imprint="arXiv:2501.12948, 22 jan. 2025"
              url="https://arxiv.org/abs/2501.12948"
            />
            <AbntRef
              author="ALMEIDA, T. S. et al."
              title="Sabiá-3 technical report"
              imprint="arXiv:2410.12049, 15 out. 2024"
              url="https://arxiv.org/abs/2410.12049"
            />
            <AbntRef
              author="MARITACA AI"
              title="Modelos — documentação da API"
              imprint="São Paulo: Maritaca AI, [2026]"
              url="https://docs.maritaca.ai/pt/modelos"
            />
            <AbntRef
              author="QWEN TEAM"
              title="Qwen"
              imprint="[S. l.]: Alibaba Cloud, [2026]. Sem corte de treino publicado para a família Qwen3+; classificados como unknown."
              url="https://qwenlm.github.io/"
            />
            <AbntRef
              author="MISTRAL AI"
              title="Models overview"
              imprint="[S. l.]: Mistral AI, [2026]. Sem corte de treino publicado por modelo; classificados como unknown."
              url="https://docs.mistral.ai/getting-started/models/models_overview/"
            />
          </ul>
        </section>
      </div>
    </PageContainer>
  );
}

function TermTag({ children, term }: { children: React.ReactNode; term: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-block cursor-pointer rounded-full bg-ps-violet/15 px-2 py-0.5 font-sans text-sm font-medium text-ps-violet-dark">
          {term}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm font-sans text-sm leading-relaxed">
        {children}
      </TooltipContent>
    </Tooltip>
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
