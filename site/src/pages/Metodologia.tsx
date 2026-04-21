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

        <TableOfContents />

        <section id="exames">
          <h2 className="font-sans text-xl font-bold tracking-tight sm:text-2xl">
            Exames avaliados
          </h2>
          <p className="mt-3">
            Desde outubro de 2025, Revalida e ENAMED são aplicados no mesmo dia, sob a{' '}
            <strong>Matriz de Referência Comum para a Avaliação da Formação Médica</strong>. São
            cinco áreas com peso igual: Clínica Médica, Cirurgia, Ginecologia-Obstetrícia, Pediatria
            e Medicina de Família e Comunidade. O ENAMED também serve de porta de entrada para o
            Enare (residência).
          </p>
          <p className="mt-3">
            Tratamos os dois exames como edições de um único benchmark: mesma matriz, duas portas de
            entrada, um leaderboard.
          </p>
        </section>

        <section id="protocolo">
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

        <section id="prompt">
          <h2 className="font-sans text-xl font-bold tracking-tight sm:text-2xl">
            System prompt literal
          </h2>
          <div className="mt-3">
            <CodeBlock>{SYSTEM_PROMPT}</CodeBlock>
          </div>
        </section>

        <section id="variancia">
          <h2 className="font-sans text-xl font-bold tracking-tight sm:text-2xl">
            Por que rodamos três vezes
          </h2>
          <p className="mt-3">
            Cada modelo é avaliado três vezes em cada edição; reportamos média e IC 95%. A mesma
            pergunta feita ao mesmo modelo pode render respostas diferentes entre rodadas, e a nota
            flutua por razões que vale explicitar.
          </p>

          <h3 className="mt-6 font-sans text-lg font-semibold tracking-tight">
            A execução não é determinística
          </h3>
          <p className="mt-3">
            <strong>Aritmética de GPU não é associativa.</strong> Em bf16 ou fp8, kernels reagrupam
            somas e produzem probabilidades ligeiramente distintas entre rodadas. Quando o modelo
            está confiante, nada muda; quando ele hesita entre duas alternativas, um bit basta para
            inverter a escolha.
          </p>

          <p className="mt-3">
            <strong>Roteamento dinâmico amplifica o efeito.</strong> Arquiteturas de{' '}
            <TermTag term="mistura de especialistas">
              Arquitetura onde o modelo é dividido em muitas sub-redes (os especialistas); cada
              token de entrada é roteado para um subconjunto pequeno delas, não para todas. Qwen 3
              235B, DeepSeek V3/R1 e Mixtral são exemplos. O roteamento depende do contexto e pode
              variar entre execuções, produzindo saídas distintas para a mesma entrada.
            </TermTag>{' '}
            roteiam cada token para um subconjunto de especialistas, e essa escolha depende dos
            outros tokens no mesmo lote. Companheiros de lote diferentes ativam especialistas
            diferentes.
          </p>

          <h3 className="mt-6 font-sans text-lg font-semibold tracking-tight">
            O nome do modelo é uma rota, não um artefato congelado
          </h3>
          <p className="mt-3">
            <code>claude-opus-4-7</code> ou <code>meta-llama/llama-3.3-70b-instruct</code> é um
            endereço que o fornecedor aponta para o que ele quiser. Acontecem atualizações
            silenciosas: nova versão com guardrails ajustados, troca para uma variante{' '}
            <TermTag term="quantizada">
              Versão comprimida do modelo que usa menos bits por peso (ex.: 8 bits em vez de 16),
              reduzindo custo de GPU e latência. A contrapartida é perda de precisão numérica que
              pode afetar o desempenho em casos borderline.
            </TermTag>{' '}
            mais barata, reconfiguração de hardware sob carga. Nada garante que o modelo servido em
            abril seja idêntico ao de março.
          </p>

          <p className="mt-3">
            O efeito é mais forte em modelos open-source via OpenRouter (Llama, DeepSeek, Qwen,
            Mistral). O OpenRouter não serve os modelos: roteia a requisição para um entre vários
            fornecedores terceirizados (DeepInfra, Together, Fireworks, Hyperbolic), cada um com
            hardware, quantização e stack próprios.
          </p>

          <h3 className="mt-6 font-sans text-lg font-semibold tracking-tight">
            Como interpretar diferenças entre execuções
          </h3>
          <ul className="mt-3 list-disc list-inside space-y-1">
            <li>
              Com 85 questões e precisão típica de 80%, o IC95 (Wilson) tem meia-largura próxima de
              5pp.
            </li>
            <li>Duas execuções do mesmo modelo diferindo por 3 a 5pp é ruído amostral esperado.</li>
            <li>
              Delta acima de 10pp pede investigação: quantização trocada, fornecedor terceirizado
              diferente no OpenRouter, re-treino sob o mesmo nome de rota, ou bug no parsing. Logs
              brutos e parâmetros de cada chamada ficam em <code>results/</code>.
            </li>
          </ul>

          <p className="mt-3 rounded-md bg-muted/40 p-4 text-sm">
            <strong>Limite deste benchmark.</strong> Não fixamos fornecedor terceirizado no
            OpenRouter e os fornecedores fechados não expõem versão congelada via API. A nota de um
            modelo é uma foto do que o fornecedor servia quando rodamos. A cada nova edição
            reexecutamos todos os modelos para manter a comparação contemporânea.
          </p>
        </section>

        <section id="contaminacao">
          <h2 className="font-sans text-xl font-bold tracking-tight sm:text-2xl">
            Contaminação de treino
          </h2>
          <p className="mt-3">
            Toda prova pública anterior ao corte de treino de um modelo é marcada como{' '}
            <em>provavelmente contaminada</em>. Relatamos precisão separadamente para edições limpas
            e contaminadas; a diferença mede quanto memorização infla o escore.
          </p>
          <p className="mt-3">
            Os cortes vêm exclusivamente de artefatos publicados pelo fornecedor: docs de API, model
            card no Hugging Face, technical report no arXiv ou release notes. Quando o fornecedor
            não publica o corte (caso atual de Mistral e Qwen), o modelo é classificado como{' '}
            <em>unknown</em> e fica de fora de ambas as fatias. Não estimamos, porque o número vira
            base para gráficos e decisões. A URL de cada corte está em{' '}
            <code>site/src/data/models.ts</code> (<code>trainingCutoffSource</code>).
          </p>
          <p className="mt-3">
            O recorte mais confiável é sempre a edição mais recente da INEP. A cada nova prova, o
            leaderboard ganha um ponto limpo para todos os modelos avaliados antes daquela data.
          </p>
          <div className="mt-6 space-y-4">
            <ContaminationDumbbell models={MODELS} />
            <CutoffGapScatter models={MODELS} />
          </div>
        </section>

        <section id="linha-de-base">
          <h2 className="font-sans text-xl font-bold tracking-tight sm:text-2xl">
            Linha de base humana e o sentido da nota de corte
          </h2>
          <p className="mt-3">
            Cada gráfico por edição mostra três linhas: nota de corte oficial do edital INEP, média
            humana estimada (retrocalculada a partir da taxa de aprovação, assumindo distribuição
            normal) e o escore do modelo.
          </p>
          <p className="mt-3">
            A nota de corte sozinha é uma linha de base ruim. A taxa de aprovação do Revalida fica
            na casa de 15–20% na média histórica, e caiu para 3,75% na edição 2022.2 e 1,82% na
            2023.2. A média real dos candidatos fica bem abaixo do corte.
          </p>

          <h3 className="mt-6 font-sans text-lg font-semibold tracking-tight">
            Por que o corte é tão alto (e o que as instituições dizem)
          </h3>
          <p className="mt-3">
            A nota mínima é calibrada via{' '}
            <TermTag term="Angoff Modificado">
              Método de definição de nota de corte em que especialistas estimam, para cada questão,
              a probabilidade de um candidato minimamente competente respondê-la corretamente. A
              soma dessas probabilidades vira o corte. Calibra o exame pela dificuldade das
              questões, não pela distribuição de notas dos candidatos.
            </TermTag>
            , sobre a dificuldade das questões. Ela não acompanha a distribuição de notas da turma:
            é um piso de competência, não um quantil.
          </p>
          <p className="mt-3">
            As baixas taxas de aprovação alimentam um debate institucional sem consenso:
          </p>
          <ul className="mt-3 list-disc list-inside space-y-1">
            <li>
              <strong>FMB, CFM e APM</strong> leem a baixa aprovação como evidência de que o filtro
              funciona e enquadram o exame como proteção à saúde pública.
            </li>
            <li>
              <strong>Candidatos, representantes do MEC na audiência de 2023 e a Anup</strong>{' '}
              apontam aumento indevido da nota de corte, inconsistências de conteúdo e desalinho com
              a realidade da formação.
            </li>
            <li>
              A Câmara dos Deputados discutiu a taxa de 3,75% em audiência pública (set./2023) sem
              consenso.
            </li>
          </ul>
          <p className="mt-3">
            Para efeito de leitura deste leaderboard: um modelo acima da nota de corte não está
            &ldquo;no limite da competência&rdquo;, está à frente da esmagadora maioria dos
            candidatos humanos reais. Um modelo abaixo do corte ainda pode estar bem à frente da
            média humana, o que torna a comparação só contra o corte pouco informativa.
          </p>
        </section>

        <section id="fontes">
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
            Debate institucional sobre a nota de corte do Revalida
          </h3>
          <ul className="mt-3 space-y-3">
            <AbntRef
              author="PAGNO, M."
              title="Revalida tem a menor taxa de aprovação em 11 edições; médicos formados no exterior apontam falhas e pedem mudanças"
              imprint="[S. l.]: G1, 2023. Republicado em: São Paulo: Associação Paulista de Medicina, 1 abr. 2023"
              url="https://www.apm.org.br/revalida-tem-a-menor-taxa-de-aprovacao-em-11-edicoes-medicos-formados-no-exterior-apontam-falhas-e-pedem-mudancas/"
            />
            <AbntRef
              author="ASSOCIAÇÃO PAULISTA DE MEDICINA"
              title="Balanço desastroso"
              imprint="São Paulo: APM, 20 fev. 2025. Publicado originalmente em: Revista da APM, n. 748, jan./fev. 2025"
              url="https://www.apm.org.br/balanco-desastroso/"
            />
            <AbntRef
              author="AGÊNCIA CÂMARA DE NOTÍCIAS"
              title="Comissão debate baixa taxa de aprovação no Revalida"
              imprint="Brasília, DF: Câmara dos Deputados, [2023]. Republicado em: São Paulo: Associação Médica Brasileira"
              url="https://amb.org.br/brasilia-urgente/comissao-debate-baixa-taxa-de-aprovacao-no-revalida/"
            />
            <AbntRef
              author="CONSELHO FEDERAL DE MEDICINA"
              title="CFM defende exigência de aprovação no Revalida como forma de proteção à saúde e vida dos brasileiros"
              imprint="Brasília, DF: CFM, 31 mar. 2021"
              url="https://portal.cfm.org.br/noticias/cfm-defende-exigencia-de-aprovacao-no-revalida-como-forma-de-protecao-a-saude-e-vida-dos-brasileiros/"
            />
            <AbntRef
              author="SONCINI, C. V."
              title="Revalida: baixa aprovação configura garantia da qualidade profissional dos formados fora do Brasil"
              imprint="[S. l.]: Federação Médica Brasileira, 6 jun. 2025"
              url="https://portalfmb.org.br/2025/06/revalida-baixa-aprovacao-configura-garantia-da-qualidade-profissional-dos-formados-fora-do-brasil/"
            />
            <AbntRef
              author="LACERDA, J."
              title="Especialistas discordam sobre nível de dificuldade do exame Revalida"
              imprint="Brasília, DF: Agência Câmara de Notícias, 12 set. 2023. Edição de Ana Chalub"
              url="https://www.camara.leg.br/noticias/996416-especialistas-discordam-sobre-nivel-de-dificuldade-do-exame-revalida/"
            />
            <AbntRef
              author="ALMEIDA, D."
              title="Inep define em 66,148 pontos o mínimo para aprovação no Revalida"
              imprint="Brasília, DF: Agência Brasil, 14 nov. 2024"
              url="https://agenciabrasil.ebc.com.br/educacao/noticia/2024-11/inep-define-em-66148-pontos-o-m%C3%ADnimo-para-aprova%C3%A7%C3%A3o-no-revalida"
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

const TOC_ITEMS: ReadonlyArray<{ href: string; label: string }> = [
  { href: '#exames', label: 'Exames avaliados' },
  { href: '#protocolo', label: 'Protocolo de avaliação' },
  { href: '#prompt', label: 'System prompt literal' },
  { href: '#variancia', label: 'Por que rodamos três vezes' },
  { href: '#contaminacao', label: 'Contaminação de treino' },
  { href: '#linha-de-base', label: 'Linha de base humana e o sentido da nota de corte' },
  { href: '#fontes', label: 'Fontes' },
];

function TableOfContents() {
  return (
    <nav
      aria-label="Sumário desta página"
      className="rounded-md border border-border/60 bg-muted/30 p-4 sm:p-5"
    >
      <p className="font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Nesta página
      </p>
      <ul className="mt-3 grid gap-y-1 gap-x-6 text-sm sm:grid-cols-2">
        {TOC_ITEMS.map((item) => (
          <li key={item.href}>
            <a className="text-ps-violet hover:underline" href={item.href}>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
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
