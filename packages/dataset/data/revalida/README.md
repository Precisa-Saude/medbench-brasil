# Dados Revalida

Um arquivo JSON por edição — nome do arquivo no formato `AAAA-N.json` (ex.: `2025-1.json`, `2025-2.json`). As edições pré-gap (2011 a 2017) não têm semestre e são nomeadas como `AAAA.json`.

Cada arquivo segue o schema definido em `packages/dataset/src/types.ts` (`Edition`). Novas edições devem ser adicionadas via PR com:

- prova e gabarito definitivo baixados do [portal INEP](https://www.gov.br/inep)
- classificação por especialidade usando a taxonomia em `src/specialty.ts`
- marcação correta de questões com imagem, tabela ou anuladas
- `passRate` e `cutoffScore` extraídos do edital oficial do resultado

As cinco edições presentes, de `2024-1.json` a `2026-1.json`, contêm 100
questões cada. Nenhuma é template vazio.

## Edições adicionadas em novembro de 2026

| Edição | Aplicação oficial (`publishedAt`) | Anuladas                 | Com imagem     | Com tabela                                    | Elegíveis por padrão |
| ------ | --------------------------------- | ------------------------ | -------------- | --------------------------------------------- | -------------------- |
| 2025/2 | 19/10/2025                        | 7, 9, 11, 43, 55, 85, 87 | 5, 58, 91, 100 | 10, 15, 24, 38, 41, 46, 86                    | 82                   |
| 2026/1 | 07/06/2026                        | Nenhuma                  | 5, 11, 27, 68  | 4, 15, 17, 20, 21, 29, 40, 66, 72, 73, 91, 96 | 84                   |

Foram usados os cadernos 01 e os gabaritos definitivos dos índices oficiais
[2025](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/revalida/provas-e-gabaritos/2025)
e [2026](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/revalida/provas-e-gabaritos/2026).
Todas as 100 posições de cada gabarito foram conferidas visualmente. O PDF
2026/1 tem texto corrompido; a transcrição foi feita a partir das páginas
renderizadas, sem usar números de questões defeituosos do OCR.

A extração estruturada foi comparada com o texto oficial em todos os
enunciados e nas 800 alternativas. Diferenças de transcrição foram corrigidas
a partir da fonte; imagens e tabelas foram revistas nas 24 páginas de
questões de cada caderno. Dados brutos e auditoria de extração ficam em
`scripts/data/raw/`, ignorado pelo Git.

Datas de aplicação: editais INEP
[86/2025](https://www.in.gov.br/en/web/dou/-/edital-n-86-de-2-de-julho-de-2025-639825685)
e [20/2026](https://www.in.gov.br/web/dou/-/edital-n-20-de-24-de-marco-de-2026-695235736),
indexados nas páginas oficiais de legislação do INEP. `publishedAt` segue
a convenção do schema: data de aplicação, não de download ou de ingestão.
Os cortes são 61/100 e 59/100, com fonte junto ao número no JSON.
Taxa de aprovação e total de inscritos ficam ausentes por não terem sido
verificados nesta ingestão. Questões anuladas usam `correct: "A"` como
placeholder técnico, com nota explícita; não são pontuadas.
