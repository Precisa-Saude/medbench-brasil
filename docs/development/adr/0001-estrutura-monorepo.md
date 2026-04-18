# ADR 0001 — Estrutura em monorepo pnpm + turbo

**Data**: 2026-04-18
**Status**: Aceito

## Contexto

O medbench-brasil tem três artefatos com ciclos de vida distintos: o dataset (atualização por edição), o harness de avaliação (atualização por modelo), e o site (atualização por mudança de UX ou publicação de resultados). Eles compartilham tipos e convenções — manter em repositórios separados criaria divergência de schema.

## Decisão

Adotar a mesma arquitetura do [fhir-brasil](https://github.com/Precisa-Saude/fhir-brasil): monorepo pnpm com workspaces `packages/*` e `site/`, orquestrado por Turbo. Toolchain idêntica (TS 5.7, Vitest, ESLint 10, Prettier 3, tsup).

## Consequências

- Schema de dataset tipado, consumido pelo harness e pelo site sem cópia
- Um único CI pipeline; cache de build via Turbo
- Coerência visual com fhir-brasil (mesmos tokens OKLch, mesma grid)
- Publicação individual dos pacotes no npm via semantic-release em v2
