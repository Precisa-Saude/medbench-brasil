# Plano — medbench-brasil

## Objetivo

Publicar `medbench-brasil.dev.br` como leaderboard contínuo de LLMs em provas médicas brasileiras, em paralelo ao fhir-brasil.

## Status atual

- [x] Bootstrap do monorepo (pnpm, turbo, TS, ESLint, Prettier, Vitest)
- [x] Governança (LICENSE, README, CONTRIBUTING, CONVENTIONS, CLAUDE, CODE_OF_CONDUCT, DISCLAIMER, SECURITY, SUPPORT, CITATION)
- [x] `packages/dataset` — tipos, loader, taxonomia, módulo de contaminação, template 2025-1
- [x] `packages/eval-harness` — prompt canônico, runner, scorer com Wilson IC, provider Anthropic, CLI
- [x] `site/` — Vite + React 19 + Tailwind v4 + Recharts + react-router; páginas Leaderboard, Modelo, Edição, Metodologia, Dataset
- [x] CI + deploy Cloudflare Pages
- [x] Documentação de metodologia, contaminação, linha de base humana e schema (pt-BR)

## Próximos passos

1. **Dataset real**: ingerir Revalida 2025/1 via `scripts/ingest-inep.ts` + `scripts/extract-questions.ts`; revisão manual; classificação por especialidade
2. **Providers adicionais**: OpenAI, Google, Maritaca (Sabiá), local (OpenAI-compatible)
3. **Primeira corrida completa**: Claude Sonnet 4.6, Opus 4.7, GPT, Gemini, Sabiá — 3 runs cada em 2025/1
4. **Gráfico de três linhas** em `EditionDetail` — nota de corte, média humana estimada, escore do modelo
5. **Gráfico de tendência temporal** estilo METR (release-date vs acurácia)
6. **Ingestão das edições 2020–2024** (pós-gap) incrementalmente
7. **Canary tests** como pacote separado (`packages/canary`)
8. **DNS**: configurar `medbench-brasil.dev.br` apontando ao Cloudflare Pages

## Arquitetura

Decisões registradas em `docs/development/adr/`.
