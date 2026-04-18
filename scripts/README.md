# scripts/

Scripts de ingestão e orquestração de pipelines. Para a **nova implementação real**, use o pacote workspace `@medbench-brasil/ingestion`:

```bash
# 1. Baixar prova + gabarito definitivo oficiais da INEP
pnpm --filter @medbench-brasil/ingestion exec medbench-ingest download \
  --edition revalida-2025-1 \
  --prova https://download.inep.gov.br/.../prova.pdf \
  --gabarito https://download.inep.gov.br/.../gabarito-definitivo.pdf

# PDFs e manifest.json ficam em scripts/data/raw/revalida-2025-1/

# 2. Extrair texto (@kreuzberg/node + Tesseract por+eng quando necessário) e
#    estruturar em JSON via Claude tool_use
export ANTHROPIC_API_KEY=sk-ant-...
pnpm --filter @medbench-brasil/ingestion exec medbench-ingest extract \
  --edition revalida-2025-1

# Saída: packages/dataset/data/revalida/2025-1.json
```

## Toolchain

Ver `docs/development/adr/0003-toolchain-de-extracao-pdf.md`. Usa `@kreuzberg/node` + Tesseract `por+eng` + Claude `tool_use`.

## Revisão obrigatória pós-extração

A saída do parser é um ponto de partida. Antes de commitar:

1. Confira `warnings[]` — o modelo deve reportar inconsistências honestamente
2. Valide o gabarito contra o PDF de gabarito definitivo manualmente (pelo menos amostragem)
3. Revise 100% da edição piloto (2025/1) lado a lado com o PDF
4. Confirme `cutoffScore` e `passRate` no edital de resultado oficial e ajuste se necessário

## Stubs herdados do scaffold

Os arquivos `scripts/ingest-inep.ts`, `scripts/extract-questions.ts` e `scripts/run-eval.ts` eram stubs do bootstrap e foram substituídos pelo pacote `@medbench-brasil/ingestion` (comandos `download` e `extract`) e pelo binário do harness (`medbench eval`). Podem ser removidos num commit de limpeza.
