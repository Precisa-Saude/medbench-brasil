# Dados Revalida

Um arquivo JSON por edição — nome do arquivo no formato `AAAA-N.json` (ex.: `2025-1.json`, `2025-2.json`). As edições pré-gap (2011 a 2017) não têm semestre e são nomeadas como `AAAA.json`.

Cada arquivo segue o schema definido em `packages/dataset/src/types.ts` (`Edition`). Novas edições devem ser adicionadas via PR com:

- prova e gabarito definitivo baixados do [portal INEP](https://www.gov.br/inep)
- classificação por especialidade usando a taxonomia em `src/specialty.ts`
- marcação correta de questões com imagem, tabela ou anuladas
- `passRate` e `cutoffScore` extraídos do edital oficial do resultado

A edição `2025-1.json` está incluída como template — o array `questions` precisa ser preenchido a partir da extração da prova oficial.
