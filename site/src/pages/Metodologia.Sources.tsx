/**
 * Seção "Fontes" da página Metodologia — referências ABNT NBR 6023:2018.
 *
 * Separada do Metodologia.tsx porque a lista de citações é longa
 * (dezenas de referências) e cresce com cada nova edição do benchmark.
 */

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
        rel="noopener noreferrer"
        target="_blank"
      >
        {url}
      </a>
      . Acesso em: 20 abr. 2026.
    </li>
  );
}

export default function MetodologiaSources() {
  return (
    <section id="fontes">
      <h2 className="font-sans text-xl font-bold tracking-tight sm:text-2xl">Fontes</h2>
      <p className="mt-3 text-muted-foreground">
        Referências formatadas conforme ABNT NBR 6023:2018. Data de acesso: 20 abr. 2026.
      </p>

      <h3 className="mt-6 font-sans text-lg font-semibold tracking-tight">Provas e gabaritos</h3>
      <ul className="mt-3 space-y-3">
        <AbntRef
          author="INSTITUTO NACIONAL DE ESTUDOS E PESQUISAS EDUCACIONAIS ANÍSIO TEIXEIRA"
          imprint="Brasília, DF: INEP"
          title="Provas e gabaritos"
          url="https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/revalida/provas-e-gabaritos"
        />
      </ul>

      <h3 className="mt-6 font-sans text-lg font-semibold tracking-tight">
        Debate institucional sobre a nota de corte do Revalida
      </h3>
      <ul className="mt-3 space-y-3">
        <AbntRef
          author="PAGNO, M."
          imprint="[S. l.]: G1, 2023. Republicado em: São Paulo: Associação Paulista de Medicina, 1 abr. 2023"
          title="Revalida tem a menor taxa de aprovação em 11 edições; médicos formados no exterior apontam falhas e pedem mudanças"
          url="https://www.apm.org.br/revalida-tem-a-menor-taxa-de-aprovacao-em-11-edicoes-medicos-formados-no-exterior-apontam-falhas-e-pedem-mudancas/"
        />
        <AbntRef
          author="ASSOCIAÇÃO PAULISTA DE MEDICINA"
          imprint="São Paulo: APM, 20 fev. 2025. Publicado originalmente em: Revista da APM, n. 748, jan./fev. 2025"
          title="Balanço desastroso"
          url="https://www.apm.org.br/balanco-desastroso/"
        />
        <AbntRef
          author="AGÊNCIA CÂMARA DE NOTÍCIAS"
          imprint="Brasília, DF: Câmara dos Deputados, [2023]. Republicado em: São Paulo: Associação Médica Brasileira"
          title="Comissão debate baixa taxa de aprovação no Revalida"
          url="https://amb.org.br/brasilia-urgente/comissao-debate-baixa-taxa-de-aprovacao-no-revalida/"
        />
        <AbntRef
          author="CONSELHO FEDERAL DE MEDICINA"
          imprint="Brasília, DF: CFM, 31 mar. 2021"
          title="CFM defende exigência de aprovação no Revalida como forma de proteção à saúde e vida dos brasileiros"
          url="https://portal.cfm.org.br/noticias/cfm-defende-exigencia-de-aprovacao-no-revalida-como-forma-de-protecao-a-saude-e-vida-dos-brasileiros/"
        />
        <AbntRef
          author="SONCINI, C. V."
          imprint="[S. l.]: Federação Médica Brasileira, 6 jun. 2025"
          title="Revalida: baixa aprovação configura garantia da qualidade profissional dos formados fora do Brasil"
          url="https://portalfmb.org.br/2025/06/revalida-baixa-aprovacao-configura-garantia-da-qualidade-profissional-dos-formados-fora-do-brasil/"
        />
        <AbntRef
          author="LACERDA, J."
          imprint="Brasília, DF: Agência Câmara de Notícias, 12 set. 2023. Edição de Ana Chalub"
          title="Especialistas discordam sobre nível de dificuldade do exame Revalida"
          url="https://www.camara.leg.br/noticias/996416-especialistas-discordam-sobre-nivel-de-dificuldade-do-exame-revalida/"
        />
        <AbntRef
          author="ALMEIDA, D."
          imprint="Brasília, DF: Agência Brasil, 14 nov. 2024"
          title="Inep define em 66,148 pontos o mínimo para aprovação no Revalida"
          url="https://agenciabrasil.ebc.com.br/educacao/noticia/2024-11/inep-define-em-66148-pontos-o-m%C3%ADnimo-para-aprova%C3%A7%C3%A3o-no-revalida"
        />
      </ul>

      <h3 className="mt-6 font-sans text-lg font-semibold tracking-tight">
        Cortes de treino — documentação oficial dos fornecedores
      </h3>
      <p className="mt-3 text-sm text-muted-foreground">
        As URLs abaixo são as fontes primárias de cada corte; a data exata usada no leaderboard está
        em <code>site/src/data/models.ts</code> no campo <code>trainingCutoffSource</code> de cada
        entrada.
      </p>
      <ul className="mt-3 space-y-3">
        <AbntRef
          author="ANTHROPIC"
          imprint="[S. l.]: Anthropic Help Center, [2026]"
          title="How up-to-date is Claude's training data?"
          url="https://support.claude.com/en/articles/8114494-how-up-to-date-is-claude-s-training-data"
        />
        <AbntRef
          author="ANTHROPIC"
          imprint="[S. l.]: Anthropic, [2026]"
          title="Models overview"
          url="https://platform.claude.com/docs/en/about-claude/models/overview"
        />
        <AbntRef
          author="OPENAI"
          imprint="[S. l.]: OpenAI Developer Docs, [2026]"
          title="GPT-5.1 model"
          url="https://developers.openai.com/api/docs/models/gpt-5.1"
        />
        <AbntRef
          author="OPENAI"
          imprint="[S. l.]: OpenAI Developer Docs, [2026]"
          title="GPT-5.2 model"
          url="https://developers.openai.com/api/docs/models/gpt-5.2"
        />
        <AbntRef
          author="OPENAI"
          imprint="[S. l.]: OpenAI Developer Docs, [2026]"
          title="GPT-5.4 model"
          url="https://developers.openai.com/api/docs/models/gpt-5.4"
        />
        <AbntRef
          author="GOOGLE"
          imprint="[S. l.]: Google, [2026]"
          title="Gemini 2.5 Pro — Gemini API docs"
          url="https://ai.google.dev/gemini-api/docs/models/gemini-2.5-pro"
        />
        <AbntRef
          author="GOOGLE"
          imprint="[S. l.]: Google, [2026]"
          title="Gemini 3.1 Pro Preview — Gemini API docs"
          url="https://ai.google.dev/gemini-api/docs/models/gemini-3.1-pro-preview"
        />
        <AbntRef
          author="META"
          imprint="[S. l.]: Hugging Face, 6 dez. 2024"
          title="Llama-3.3-70B-Instruct — model card"
          url="https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct"
        />
        <AbntRef
          author="META"
          imprint="[S. l.]: Hugging Face, 5 abr. 2025"
          title="Llama-4-Maverick-17B-128E-Instruct — model card"
          url="https://huggingface.co/meta-llama/Llama-4-Maverick-17B-128E-Instruct"
        />
        <AbntRef
          author="META"
          imprint="[S. l.]: Hugging Face, 5 abr. 2025"
          title="Llama-4-Scout-17B-16E-Instruct — model card"
          url="https://huggingface.co/meta-llama/Llama-4-Scout-17B-16E-Instruct"
        />
        <AbntRef
          author="GUO, D. et al."
          imprint="arXiv:2501.12948, 22 jan. 2025"
          title="DeepSeek-R1: incentivizing reasoning capability in LLMs via reinforcement learning"
          url="https://arxiv.org/abs/2501.12948"
        />
        <AbntRef
          author="ALMEIDA, T. S. et al."
          imprint="arXiv:2410.12049, 15 out. 2024"
          title="Sabiá-3 technical report"
          url="https://arxiv.org/abs/2410.12049"
        />
        <AbntRef
          author="MARITACA AI"
          imprint="São Paulo: Maritaca AI, [2026]"
          title="Modelos — documentação da API"
          url="https://docs.maritaca.ai/pt/modelos"
        />
        <AbntRef
          author="QWEN TEAM"
          imprint="[S. l.]: Alibaba Cloud, [2026]. Sem corte de treino publicado para a família Qwen3+; classificados como unknown."
          title="Qwen"
          url="https://qwenlm.github.io/"
        />
        <AbntRef
          author="MISTRAL AI"
          imprint="[S. l.]: Mistral AI, [2026]. Sem corte de treino publicado por modelo; classificados como unknown."
          title="Models overview"
          url="https://docs.mistral.ai/getting-started/models/models_overview/"
        />
      </ul>
    </section>
  );
}
