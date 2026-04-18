# Convenções

## Mensagens de commit

[Conventional Commits](https://www.conventionalcommits.org/). Escopos válidos: `dataset`, `harness`, `canary`, `site`, `scripts`, `docs`, `ci`, `deps`, `lint`, `config`.

Exemplos:

- `feat(dataset): adicionar edição 2025-2`
- `feat(harness): adicionar provider Maritaca Sabiá`
- `fix(dataset): corrigir gabarito questão 47 da 2023-1 após recurso`
- `docs(metodologia): atualizar protocolo de prompt único`

## Idioma

- Commits, docs, READMEs, comentários voltados ao leitor, textos do site: **pt-BR**
- Identificadores técnicos (nomes de tipos, funções, variáveis, scripts): inglês técnico
- Arquivos padrão da comunidade (`LICENSE`, `SECURITY.md`, `CITATION.cff`): formato upstream

## Nomenclatura dos pacotes

- Publicados no npm sob o escopo `@precisa-saude/` (consistente com fhir-brasil)
- Nomes internos do workspace podem usar `@medbench-brasil/` para workspaces privados (ex.: `@medbench-brasil/site`)

## Estrutura de dados

- Uma questão por objeto JSON, uma edição por arquivo em `packages/dataset/data/revalida/<AAAA-N>.json`
- IDs estáveis: `revalida-<AAAA-N>-q<NN>`
- Especialidades sempre como array — questões transversais recebem múltiplas tags
- Questões com imagem, tabela ou anuladas são sempre marcadas; o scorer as exclui por padrão

## Integridade do benchmark

- Zero ferramentas, zero conectores, zero RAG em chamadas de API
- System prompt mínimo e fixo (documentado em `docs/methodology.md`)
- Uma questão por requisição, sem histórico nem few-shot
- Três execuções por modelo, intervalo de confiança 95%
- Todos os parâmetros de API logados em `results/`
