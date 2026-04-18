# Plano — medbench-brasil

## Objetivo

Publicar `medbench-brasil.dev.br` como leaderboard contínuo de LLMs em provas médicas brasileiras, em paralelo ao fhir-brasil.

## Status atual

- [x] Bootstrap do monorepo (pnpm, turbo, TS, ESLint, Prettier, Vitest)
- [x] Governança (LICENSE, README, CONTRIBUTING, CONVENTIONS, CLAUDE, CODE_OF_CONDUCT, DISCLAIMER, SECURITY, SUPPORT, CITATION)
- [x] `packages/dataset` — tipos, loader, taxonomia, módulo de contaminação, template 2025-1 vazio
- [x] `packages/eval-harness` — prompt canônico, runner, scorer com Wilson IC, provider Anthropic, CLI
- [x] `site/` — Vite + React 19 + Tailwind v4 + Recharts + react-router; páginas Leaderboard, Modelo, Edição, Metodologia, Dataset (sem dados reais ainda)
- [x] CI + deploy Cloudflare Pages (workflow pronto; projeto Pages e DNS ainda não configurados)
- [x] Documentação de metodologia, contaminação, linha de base humana e schema (pt-BR)

## Fase 1 — Rodar localmente (bloqueia tudo)

Antes de qualquer trabalho de conteúdo, validar que o monorepo build e roda.

- [ ] **1.1 `pnpm install`** na raiz (Node ≥ 20, pnpm ≥ 9)
- [ ] **1.2 `pnpm turbo build`** — deve compilar `packages/dataset`, `packages/eval-harness` e o site; ajustar tsconfig/paths se tsup ou vite reclamar de imports `workspace:*`
- [ ] **1.3 `pnpm turbo typecheck lint test`** — zero erros; corrigir qualquer discrepância do scaffold
- [ ] **1.4 `pnpm --filter @medbench-brasil/site dev`** — subir em `http://localhost:4321`, conferir Leaderboard (estado vazio), Metodologia (imports `SYSTEM_PROMPT` do harness), navegação
- [ ] **1.5** Primeiro commit assinado no `main` (pós-Fase 1 deve haver `pnpm-lock.yaml` + quaisquer ajustes)
- [ ] **1.6** Criar repo remoto `Precisa-Saude/medbench-brasil`, `git push -u origin main`

## Fase 2 — Pipeline de extração Revalida

Trabalho real de ingestão. Alvo: edição **2025/1** como piloto. Toolchain definida em ADR 0003 (`@kreuzberg/node` + Tesseract `por+eng` + Claude `tool_use`).

### 2.1 Download (`@medbench-brasil/ingestion medbench-ingest download`)

- [x] `packages/ingestion/src/downloader.ts` — `fetch` + gravação de `manifest.json` com URL, SHA-256, timestamp
- [ ] **Rodar na 2025/1**: localizar URLs oficiais de prova + gabarito definitivo na [página INEP](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/revalida/provas-e-gabaritos) e executar o comando

### 2.2 Extração + estruturação

- [x] **2.2a `@kreuzberg/node` wrapper** em `packages/ingestion/src/extractor.ts` — mesmo padrão (`extractPages: true`, fallback OCR Tesseract `por+eng` quando conteúdo < 20 chars)
- [x] **2.2b Parser estruturado** em `packages/ingestion/src/parser.ts` — Claude `tool_use` com schema JSON rígido (enum para `correct` e `specialty`). Temperatura 0.1. Recebe texto da prova + texto do gabarito e retorna `Question[]` + `warnings[]`. Preprocessamento, não viola ADR 0002.
- [x] **2.2c CLI** — `medbench-ingest download` e `medbench-ingest extract` em `packages/ingestion/src/cli.ts`
- [ ] **Rodar na 2025/1**: executar `extract` com `ANTHROPIC_API_KEY`, conferir warnings, revisar amostra

### 2.3 Classificação por especialidade

Feita inline pelo parser (schema enum obriga classificação no momento do `tool_use`). Para auditoria:

- [ ] **Revisão humana por amostragem** — conferir ~20% das classificações, registrar taxa de concordância em `docs/development/adr/0004-*` quando a edição piloto estiver pronta

### 2.4 Validação e publicação

- [ ] **Schema validation** — validar saída contra tipo `Edition` (verificação vem do `tsc` dos consumidores)
- [ ] **Sanidade** — todas as questões têm 4 alternativas e gabarito; questão anulada no gabarito nunca aparece como `annulled: false`
- [ ] **Revisão manual** de 100% da edição piloto lado a lado com o PDF oficial
- [ ] **Commit** do `packages/dataset/data/revalida/2025-1.json` preenchido + CHANGELOG

### 2.5 Metadados da edição

- [ ] Extrair `cutoffScore` do edital de resultado
- [ ] Extrair `passRate` e `totalInscritos` do Painel Revalida ou edital
- [ ] Quando a INEP não publicar granularidade, abrir pedido via Lei de Acesso à Informação

## Fase 3 — Primeira rodada de avaliação

- [ ] **3.1 Providers adicionais** — implementar `providers/openai.ts`, `providers/google.ts`, `providers/maritaca.ts`, `providers/openai-compat.ts` (para vLLM/Ollama/DeepSeek self-hosted). Cada um declara `trainingCutoff` com fonte oficial documentada
- [ ] **3.2 Corrida piloto** — Claude Sonnet 4.6 em `revalida-2025-1`, 3 execuções, inspecionar logs
- [ ] **3.3 Corrida completa** — 8–10 modelos × `revalida-2025-1` × 3 runs; salvar `results/<modelo>.json` + logs `.jsonl`
- [ ] **3.4 Publicar** — popular `site/src/data/results.ts` a partir de `results/`; site passa a renderizar leaderboard não-vazio

## Fase 4 — Visualizações pendentes

- [ ] **4.1 Gráfico de três linhas** em `EditionDetail` — nota de corte, média humana estimada, escore dos modelos (usar helper de retrocálculo documentado em `docs/human-baseline.md`)
- [ ] **4.2 Scatter de tendência** estilo METR — eixo X = data de release do modelo, eixo Y = precisão em edições limpas; linha de tendência opcional
- [ ] **4.3 Filtro por especialidade** no Leaderboard — dropdown que recalcula ranking usando `accuracyBySpecialty`
- [ ] **4.4 Página de detalhe da edição** com distribuição de acertos por questão, destaque para itens em que todos os modelos erraram

## Fase 5 — Expansão do dataset

- [ ] **5.1** 2024/2 e 2024/1 (edições limpas para modelos com corte ≤ 2024-06)
- [ ] **5.2** 2023/2, 2023/1, 2022/2, 2022/1, 2021, 2020 (pós-gap, historicamente contaminadas)
- [ ] **5.3** 2011–2017 (pré-gap, incrementais)
- [ ] **5.4** ENAMED 2025 (schema multi-exame já suporta; precisa decidir namespace `enamed-2025`)
- [ ] **5.5** ENARE, HealthQA-BR (licenciamento a verificar)

## Fase 6 — Deploy e lançamento

- [ ] **6.1 Cloudflare Pages** — criar projeto `medbench-brasil`, configurar secrets no GitHub Actions (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ZONE_ID`)
- [ ] **6.2 DNS** — registrar `medbench-brasil.dev.br` (se ainda não é propriedade da Precisa), apontar CNAME para `medbench-brasil.pages.dev`
- [ ] **6.3 robots.txt + sitemap.xml** — permissivos; sitemap gerado no build
- [ ] **6.4 Meta tags OG** — imagem, descrição, pt-BR; Twitter card
- [ ] **6.5 Release 0.1.0** — tag no git, anotação no CHANGELOG, publicação dos dois pacotes no npm via workflow

## Fase 7 — Canary tests (v2)

Ver `docs/contamination.md` seção "Canary tests". Não bloqueante para v1; escopo de um `packages/canary` separado com:

- [ ] completion test (reprodução verbatim)
- [ ] shuffled options (memorização posicional)
- [ ] paraphrase (memorização vs compreensão)

## Arquitetura

Decisões registradas em `docs/development/adr/`.

- ADR 0001 — Estrutura em monorepo pnpm + turbo
- ADR 0002 — Integridade do benchmark: protocolo canônico de inferência

Decisões pendentes de ADR:

- **ADR 0003** — Escolha da biblioteca de parsing de PDF (decisão: `pdfjs-dist` + fallback `tesseract.js`), a ser registrada no fim da Fase 2.2
- **ADR 0004** — Uso de LLM para classificação por especialidade (decisão + prompt literal + taxa de concordância com revisão humana), a ser registrada no fim da Fase 2.3
