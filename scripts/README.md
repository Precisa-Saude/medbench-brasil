# scripts/

Scripts de ingestão e orquestração de pipelines. Não publicados como pacote.

## `ingest-inep.ts` (stub)

Baixa provas e gabaritos oficiais do portal INEP. Saída em `scripts/data/raw/revalida/<AAAA-N>/` (gitignored).

## `extract-questions.ts` (stub)

Converte PDFs de prova e gabarito em `packages/dataset/data/revalida/<AAAA-N>.json` seguindo o schema. Envolve OCR, normalização de caracteres e cruzamento com gabarito definitivo (pós-recurso).

## `run-eval.ts` (stub)

Orquestra uma varredura completa: para cada modelo configurado, rodar 3 execuções em todas as edições disponíveis, gerar resultados em `results/`.

Implementação em `docs/development/PLAN.md`, item 1.
