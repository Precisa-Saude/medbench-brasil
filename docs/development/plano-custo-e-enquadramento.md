# Plano — custo por questão e enquadramento metodológico

## Objetivo

Incorporar as lições dos leaderboards de busca da OpenRouter (ago/2026)
ao medbench-brasil em três frentes:

1. **Custo por questão** ao lado da precisão — "custo não acompanha
   qualidade" só é visível se o custo for publicado.
2. **Evidência externa para o protocolo fixo** — a variância de
   configuração (mesmo modelo: 36% → 75% só mudando o turn budget)
   é o argumento mais forte já publicado para as garantias do ADR 0002.
3. **Enquadramento comparativo** — escores são comparações sob um
   protocolo fixo, não medidas absolutas de competência médica.

## Contexto

- O harness **não captura `usage`** das respostas das APIs: nenhum
  provider (`packages/eval-harness/src/providers/*.ts`) lê os campos de
  tokens, e `RawResponseRecord`/`EvaluationResult`
  (`packages/eval-harness/src/types.ts`) não têm onde guardá-los.
  Consequência: os `.raw.jsonl` existentes em `results/` não permitem
  reconstruir custo.
- O registry do site (`site/src/data/model-registry/`) não tem preços.
- Decisão de arquitetura deste plano: **`results/` guarda tokens
  (fatos retornados pela API); USD nunca é persistido**. Preço mora no
  registry do site com fonte citada, e o custo é derivado em build
  time. Preços mudam; artefatos commitados não devem envelhecer.
- **Sem backfill**: tokens de saída incluem thinking (Fable 5, Opus 5,
  GPT-5.x…) que não aparece em `rawResponse`, então não há como
  reconstituir usage de runs antigas sem re-executar. Lacuna explícita
  (`—` no site) até cada modelo ser reavaliado — nunca estimar.

## Fase 1 — Harness captura `usage` (PR 1)

- [ ] **1.1 Tipos** — `ProviderResponse.usage?: { inputTokens: number;
outputTokens: number }` e o mesmo campo em `RawResponseRecord`.
      Opcional para back-compat com artefatos existentes.
- [ ] **1.2 Providers** — parsear o campo de usage de cada API:
      Anthropic `usage.input_tokens/output_tokens`; OpenAI e
      OpenAI-compat `usage.prompt_tokens/completion_tokens`; Google
      `usageMetadata.promptTokenCount/candidatesTokenCount`. Quando a
      API não retornar o campo (ex.: Ollama local), `usage` fica
      `undefined` — nunca estimar por contagem própria.
- [ ] **1.3 Agregação** — `EvaluationResult.usage?: { inputTokens;
outputTokens; callsWithUsage; totalCalls }` somado pelo scorer.
      `callsWithUsage < totalCalls` sinaliza cobertura parcial e o
      site trata como lacuna.
- [ ] **1.4 Testes** — fixtures de resposta por provider com e sem
      usage; cobertura ≥ 80% mantida.
- [ ] **1.5 Nota no ADR 0002** — registrar que a mudança é só de
      logging de resposta (reforça a garantia 5); nenhum parâmetro de
      requisição muda, nenhuma garantia é afrouxada.

## Fase 2 — ADR 0005: metodologia de custo (PR 1, mesmo branch)

- [ ] **2.1 Escrever `docs/development/adr/0005-metodologia-de-custo.md`**:
  - Preço de tabela oficial do fornecedor (página de pricing da API),
    em USD por MTok, sem descontos de batch/cache.
  - Fonte obrigatória: URL + citação verbatim + data de acesso, no
    mesmo padrão de `trainingCutoffSource`. Sem fonte → sem preço →
    `—` no site. Nunca inferir preço de modelo similar.
  - Custo derivado = tokens médios por questão × preço vigente;
    recalculado em build, nunca persistido em `results/`.
  - Sem backfill de runs antigas (justificativa: thinking tokens não
    reconstituíveis).

## Fase 3 — Site: preços, coluna de custo e Pareto (PR 2)

- [ ] **3.1 Registry** — em `model-registry/types.ts`, union
      discriminada `PricingFields` espelhando `TrainingCutoffFields`:
      `{ pricePerMTokInputUSD; pricePerMTokOutputUSD; priceSource;
priceAsOf } | { todos undefined }`. Preencher por fornecedor com
      comentário citando a fonte (regra de verificação: abrir a página
      antes de escrever o valor).
- [ ] **3.2 Derivação** — em `site/src/data/results.ts`, custo médio
      por questão quando `usage` e preço existem; caso contrário
      `undefined`.
- [ ] **3.3 LeaderboardTable** — coluna "custo/questão" com `—` +
      tooltip explicando a lacuna (run anterior à captura de usage ou
      preço não publicado).
- [ ] **3.4 Scatter precisão × custo** — novo componente no padrão de
      `CutoffGapScatter` (eixo X custo log, eixo Y precisão, fronteira
      de Pareto destacada). Consultar a skill `dataviz` antes de
      implementar.
- [ ] **3.5 Docs** — `docs/methodology`/Metodologia: seção curta
      "Custo" apontando o ADR 0005.

## Fase 4 — Enquadramento metodológico (PR 3)

- [ ] **4.1 Verificar a fonte** — abrir os leaderboards de busca da
      OpenRouter e confirmar URL, números (36%/58%/75% por turn budget
      no BrowseComp; $2,91 vs $0,48 no DeepSearchQA) e data antes de
      citar. Se algum número não for confirmável na página pública,
      citar só o que for.
- [ ] **4.2 Metodologia.tsx** — parágrafo em "por que o protocolo é
      fixo": variância de configuração domina a variância de modelo em
      benchmarks com scaffold; o medbench fixa o setup (ADR 0002) para
      que a única variável seja o modelo.
- [ ] **4.3 Caveat no Leaderboard** — nota visível (não só na
      Metodologia): escores são comparativos sob protocolo fixo, não
      competência clínica absoluta; leitura por edição > agregado.
- [ ] **4.4 Auditoria de agregação** — conferir que nenhuma
      visualização soma edições sem rotular (lição "qual modelo é
      melhor depende de qual benchmark você lê").

## Fase 5 — Reavaliações com usage (contínua, pós PR 1)

- [ ] Novas avaliações (frontier ago/2026, ENAMED 2026) já saem com
      `usage` preenchido.
- [ ] Reavaliar modelos antigos apenas quando houver outro motivo para
      re-run (novo gabarito, nova edição) — custo não justifica re-run
      sozinho.

## Sequenciamento

| PR  | Conteúdo                         | Depende de |
| --- | -------------------------------- | ---------- |
| 1   | Fases 1 + 2 (harness + ADR 0005) | —          |
| 2   | Fase 3 (site)                    | PR 1       |
| 3   | Fase 4 (enquadramento)           | —          |

PR 3 é independente e pode sair primeiro. Cada PR em worktree próprio
(`feat/harness-usage`, `feat/site-custo`, `docs/enquadramento`).

## Contexto de origem

E-mail da OpenRouter (ago/2026) anunciando cinco leaderboards de busca
(BrowseComp, HLE, DeepSearchQA, WideSearch, GPQA Diamond). Lições
mapeadas para o medbench na conversa de 05/08/2026: variância de
configuração valida o protocolo fixo; custo não acompanha qualidade;
rankings se reordenam entre benchmarks; leitura comparativa com IC
explícito.
