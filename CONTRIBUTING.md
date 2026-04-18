# Contribuindo

Obrigado pelo interesse em contribuir com o medbench-brasil.

## Tipos de contribuição

### Reportar problemas

1. Verifique se o problema já foi reportado nas [Issues](https://github.com/Precisa-Saude/medbench-brasil/issues)
2. Abra uma nova issue com descrição clara, passos para reproduzir e comportamento esperado

### Adicionar uma nova edição do Revalida

1. Baixe a prova e o gabarito definitivo no portal da INEP
2. Use `scripts/ingest-inep.ts` para download e `scripts/extract-questions.ts` para extração
3. Revise o JSON gerado em `packages/dataset/data/revalida/` — confira estrutura, marque questões com imagem, tabela ou anuladas
4. Classifique cada questão por especialidade usando a taxonomia em `packages/dataset/src/specialty.ts`
5. Abra PR com escopo `feat(dataset): adicionar edição <AAAA-N>` e cite o edital oficial da INEP

### Adicionar um novo modelo

1. Crie `packages/eval-harness/src/providers/<modelo>.ts` implementando a interface `Provider`
2. Declare `trainingCutoff` na definição do provider (fonte: documentação oficial do fornecedor)
3. Rode a avaliação completa (3 execuções em todas as edições disponíveis)
4. Publique os resultados em `results/<modelo>.json`
5. Abra PR com escopo `feat(harness): adicionar <modelo>` e cite a documentação oficial do corte de treino

### Corrigir gabarito ou classificação

1. Cite a fonte — alteração oficial INEP pós-recurso, diretriz atualizada, ou correção de classificação com base em programa de residência
2. Abra PR com escopo `fix(dataset): ...`

## Convenções

- Conventional Commits (escopos: `dataset`, `harness`, `canary`, `site`, `scripts`, `docs`, `ci`, `deps`, `lint`, `config`)
- pt-BR em commits, READMEs, comentários voltados ao usuário e conteúdo do site
- Prettier + ESLint: `pnpm format && pnpm lint`
- Antes de abrir PR: `pnpm turbo run build typecheck lint test`

## Fontes aceitas

Para dados de prova e gabarito, somente [INEP oficial](https://www.gov.br/inep). Para metadados de modelos, somente documentação oficial do fornecedor. Não aceitamos fontes comerciais, blogs ou material de terceiros para os dados de benchmark.

## Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob [Apache-2.0](LICENSE).
