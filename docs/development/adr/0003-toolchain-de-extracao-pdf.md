# ADR 0003 — Toolchain de extração de PDFs do Revalida

**Data**: 2026-04-18
**Status**: Aceito

## Contexto

O medbench-brasil precisa extrair texto estruturado de PDFs oficiais da INEP (prova objetiva + gabarito definitivo) para popular `packages/dataset/data/revalida/`. As opções consideradas foram `pdfjs-dist`, `pdf-parse`, `unpdf` e `@kreuzberg/node`.

O repo toolchain interna já processa PDFs de laudos laboratoriais em produção — mesmo domínio técnico (PDF médico em português, possivelmente digital ou escaneado) — e usa `@kreuzberg/node` com fallback OCR via Tesseract (`por+eng`) em ``@kreuzberg/node` wrapper`.

## Decisão

1. **Extração de texto**: `@kreuzberg/node` com a configuração (`extractPages: true`, fallback `forceOcr: true` com Tesseract `por+eng` quando o conteúdo digital é vazio ou curto demais). Wrapper em `packages/ingestion/src/extractor.ts`.
2. **Parsing estruturado**: Claude via `tool_use` (API Anthropic direta, não Bedrock) — com schema JSON rígido forçando enum para especialidade e letra correta. Temperatura 0.1. Implementação em `packages/ingestion/src/parser.ts`.
3. **Download**: `fetch` nativo + gravação de `manifest.json` com URL origem, SHA-256 e timestamp para auditoria.

## Consequências

- Fallback OCR cobre Revalida 2011–2016 (tipicamente escaneados) sem configuração adicional
- Fallback OCR herdado gratuitamente — Revalida 2011–2016 tendem a ser escaneados
- Uso de `tool_use` **só em preprocessamento** — a avaliação do benchmark continua zero-tools por ADR 0002. Essa separação é crítica: extração é determinística por design (o modelo reestrutura texto + gabarito já capturados, sem inventar), enquanto a avaliação mede capacidade crua do modelo.
- Dependência de chave Anthropic para a etapa de parsing; para reprodutibilidade, os JSONs gerados são commitados e o parser roda apenas quando uma nova edição é adicionada ao repo
- `@kreuzberg/node` + Tesseract sobem o tamanho do runtime quando embalado; não é um problema porque `@medbench-brasil/ingestion` é private e roda apenas no ambiente do mantenedor
