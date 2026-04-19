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

1. Se o backend ainda não existe, crie `packages/eval-harness/src/providers/<modelo>.ts`
   implementando a interface `Provider`. Para endpoints OpenAI-compatíveis,
   reutilize `openAiCompatProvider` apontando para o baseUrl do fornecedor.
2. Declare `trainingCutoff` em `site/src/data/models.ts` (fonte: documentação
   oficial do fornecedor — não invente).
3. **Rode `medbench smoke` ANTES do `medbench eval`**. Isso é obrigatório:

   ```bash
   pnpm --filter @precisa-saude/medbench-harness exec medbench smoke \
     --backend <backend> --model <id>
   ```

   O smoke manda 8 questões diversas ao modelo, aplica o parser, compara com
   o gabarito e aborta com código não-zero se a taxa de parses corretos cair
   abaixo de 70%. Isso pega problemas de parser específicos de formato de
   resposta antes de gastar créditos numa corrida completa de 255 chamadas.

   Se o smoke falhar:
   - Verifique os exemplos falhos impressos — o parser provavelmente não
     reconhece o padrão de resposta do modelo. Ajuste
     `packages/eval-harness/src/runner.ts#parseLetter` e adicione um caso em
     `__tests__/parse-letter.test.ts`.
   - Ou o modelo é genuinamente ruim em pt-BR médico (ex.: Gemini 2.5 Pro
     chegou a 37%). Nesse caso reduza `--threshold` temporariamente e
     documente no PR.

4. Rode a avaliação completa em todas as edições disponíveis:

   ```bash
   for ed in revalida-2025-1 revalida-2024-1 revalida-2024-2; do
     pnpm --filter @precisa-saude/medbench-harness exec medbench eval \
       --backend <backend> --model <id> --runs 3 --edition $ed
   done
   ```

   Cada execução produz dois arquivos em `results/<edition>/<modelo>/`:
   - `<modelo>.json` — resultado agregado (precisão, IC 95%, splits)
   - `<modelo>.raw.jsonl` — uma linha por chamada com o texto bruto do
     modelo, parâmetros da API, letra parseada. Serve para auditoria e
     re-parse sem re-inferência se o parser precisar ser atualizado.

5. Commite ambos os artefatos. O site consome os `.json` em build time; o
   `.raw.jsonl` é comiitado também para reprodutibilidade (é gitignored-safe
   para PDFs mas não para JSON de inferência).

6. Abra PR com escopo `feat(harness): adicionar <modelo>` e cite a
   documentação oficial do corte de treino.

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
