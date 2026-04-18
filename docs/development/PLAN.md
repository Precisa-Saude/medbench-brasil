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

Trabalho real de ingestão. Alvo: edição **2025/1** como piloto (ver ADR futura sobre escolha).

### 2.1 Download — `scripts/ingest-inep.ts`

- [ ] Varrer a [página de provas e gabaritos da INEP](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/revalida/provas-e-gabaritos)
- [ ] Identificar os três PDFs de cada edição: **prova objetiva** (caderno), **gabarito preliminar**, **gabarito definitivo** (pós-recurso)
- [ ] Salvar em `scripts/data/raw/revalida/<AAAA-N>/{prova.pdf,gabarito-preliminar.pdf,gabarito-definitivo.pdf}` com `manifest.json` (URL origem + SHA-256 + data do download)
- [ ] Tolerância a mudanças de layout da página INEP — varredura baseada em padrão de URL (`.pdf` com `revalida` + ano), não posicional
- [ ] Sem dependências pesadas: `node:fetch` + `node:fs`

### 2.2 Extração — `scripts/extract-questions.ts`

O Revalida tem layout de duas colunas, ~100 questões numeradas, enunciado + 4 alternativas (A–D). Complicadores: tabelas inline, imagens clínicas, caracteres Unicode de unidades (µ, °), rodapés, quebras de página no meio de questão.

Abordagem híbrida em camadas:

- [ ] **2.2a Extração de texto estruturada** com `pdfjs-dist` — preserva coordenadas (x, y, pageN) de cada token. Evitar `pdf-parse` (perde estrutura de colunas)
- [ ] **2.2b Reconstrução de coluna** — agrupar tokens por `(page, columnBucket)` via clustering simples em `x`; concatenar por ordem crescente de `y` dentro de cada coluna
- [ ] **2.2c Fallback OCR** para páginas onde a extração de texto retornar caracteres suspeitos (`?`, `�`, ausência de caracteres acentuados comuns) — `tesseract.js` com idioma `por`
- [ ] **2.2d Segmentação em questões** — regex de start-of-question (`/^\d{1,3}\s/` no começo de linha) + lookahead até a próxima
- [ ] **2.2e Segmentação das alternativas** dentro da questão — regex `/^[A-D]\)/` ou `/^[A-D]\s/`
- [ ] **2.2f Marcação `hasImage`/`hasTable`** — detectar pela presença de objetos não-texto na página (via `pdfjs-dist` operator list) sobrepostos ao retângulo da questão
- [ ] **2.2g Cruzamento com gabarito definitivo** — parse do PDF de gabarito (tabela `questão → letra`), preferir sempre o definitivo sobre o preliminar, registrar diff em `notes` quando houver alteração pós-recurso
- [ ] **2.2h Marcação `annulled`** — gabarito definitivo marca anuladas com asterisco ou tarja; capturar explicitamente

### 2.3 Classificação por especialidade

O INEP não classifica explicitamente por especialidade dentro da prova objetiva. A classificação pode ser feita:

- [ ] **2.3a Heurística por âncoras** (primeira passada determinística) — palavras-chave clínicas conhecidas (ex.: "gestante", "puerpério" → GO; "lactente", "puericultura" → Pediatria; "campanha de vacinação", "vigilância epidemiológica" → Saúde Pública)
- [ ] **2.3b Revisão LLM com prompt rígido** — passar cada questão a um modelo de classificação (`claude-haiku-4-5` ou `claude-sonnet-4-6`) com prompt de classificação multi-label estrita nas 6 categorias de `src/specialty.ts`; log da classificação em campo separado para auditoria humana
- [ ] **2.3c Revisão humana por amostragem** — revisar ~20% das questões classificadas; registrar taxa de concordância

A classificação LLM **nunca** é usada no harness de avaliação — é apenas metadado do dataset para filtros do leaderboard. Não há contaminação metodológica.

### 2.4 Validação e publicação

- [ ] **2.4a Schema validation** — validar saída contra tipo `Edition` (checagem de tempo de build via `tsc`)
- [ ] **2.4b Testes de sanidade** — acima de 95% das questões têm 4 alternativas; todas têm gabarito; nenhuma questão anulada no gabarito definitivo aparece como não-anulada
- [ ] **2.4c Revisão manual** de 100% da edição piloto — comparação lado a lado com o PDF original
- [ ] **2.4d Commit** do `packages/dataset/data/revalida/2025-1.json` preenchido + nota de CHANGELOG

### 2.5 Metadados da edição

- [ ] Extrair nota de corte do edital de resultado oficial (`cutoffScore`)
- [ ] Extrair taxa de aprovação do Painel Revalida ou edital (`passRate`, `totalInscritos`)
- [ ] Quando a INEP não publicar granularidade, abrir pedido via Lei de Acesso à Informação

## Fase 3 — Primeira rodada de avaliação

- [ ] **3.1 Providers adicionais** — implementar `providers/openai.ts`, `providers/google.ts`, `providers/maritaca.ts`, `providers/openai-compat.ts` (para vLLM/Ollama/DeepSeek self-hosted). Cada um declara `trainingCutoff` com fonte oficial documentada
- [ ] **3.2 Corrida piloto** — Claude Sonnet 4.6 em `revalida-2025-1`, 3 execuções, inspecionar logs
- [ ] **3.3 Corrida completa** — 8–10 modelos × `revalida-2025-1` × 3 runs; salvar `results/<modelo>.json` + logs `.jsonl`
- [ ] **3.4 Publicar** — popular `site/src/data/results.ts` a partir de `results/`; site passa a renderizar leaderboard não-vazio

## Fase 4 — Visualizações pendentes

- [ ] **4.1 Gráfico de três linhas** em `EditionDetail` — nota de corte, média humana estimada, escore dos modelos (usar helper de retrocálculo documentado em `docs/human-baseline.md`)
- [ ] **4.2 Scatter de tendência** estilo METR — eixo X = data de release do modelo, eixo Y = acurácia em edições limpas; linha de tendência opcional
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
