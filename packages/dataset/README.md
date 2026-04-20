# @precisa-saude/medbench-dataset

Dataset estruturado de questões de provas médicas brasileiras (Revalida e ENAMED).

---

## Sobre

Questões extraídas dos cadernos oficiais publicados pelo INEP, com gabarito **definitivo pós-recurso**, classificação por especialidade e metadados de edição (nota de corte, taxa de aprovação, data de publicação). Distribuído em JSON, tipado em TypeScript, consumível em Node e no bundler de qualquer site estático.

É o dataset por trás do leaderboard em [medbench-brasil.ia.br](https://medbench-brasil.ia.br) e do harness [`@precisa-saude/medbench-harness`](https://www.npmjs.com/package/@precisa-saude/medbench-harness).

## Instalação

```bash
pnpm add @precisa-saude/medbench-dataset
# ou
npm install @precisa-saude/medbench-dataset
```

Requer Node ≥ 20.

## Uso

```ts
import {
  listEditions,
  loadEdition,
  loadAll,
  getModelContaminationRisk,
} from '@precisa-saude/medbench-dataset';
import type { Edition, Question } from '@precisa-saude/medbench-dataset';

// Listar todas as edições disponíveis
const ids = listEditions();
// → ['revalida-2024-1', 'revalida-2024-2', 'revalida-2025-1', 'enamed-2025']

// Carregar uma edição específica
const edition: Edition = loadEdition('revalida-2025-1');
console.log(edition.questions.length); // 100
console.log(edition.cutoffScore); // 0.6
console.log(edition.passRate); // 0.18

// Carregar todas de uma vez
const all: Edition[] = loadAll();

// Classificar risco de contaminação por par (edição × modelo)
const risk = getModelContaminationRisk(edition, '2024-10-01');
// → 'likely-clean' | 'likely-contaminated' | 'unknown'
```

## API

**Funções**

| Export                        | Assinatura                                                                   |
| ----------------------------- | ---------------------------------------------------------------------------- |
| `listEditions()`              | `() => EditionId[]`                                                          |
| `loadEdition(id)`             | `(id: EditionId) => Edition`                                                 |
| `loadAll()`                   | `() => Edition[]`                                                            |
| `getModelContaminationRisk()` | `(edition: Edition, modelTrainingCutoff?: string) => ContaminationRisk`      |
| `examFamilyOf(id)`            | `(id: EditionId) => 'revalida' \| 'enamed'`                                  |

**Constantes**

- `SPECIALTIES` — lista de especialidades válidas (`'cirurgia'`, `'clinica-medica'`, `'ginecologia-obstetricia'`, `'medicina-familia-comunidade'`, `'pediatria'`, `'saude-publica'`).

**Tipos**

- `Edition`, `EditionId`, `Question`, `QuestionOption` (`'A' | 'B' | 'C' | 'D'`), `Specialty`, `ExamFamily`, `ContaminationRisk`.

## Formato dos dados

Cada edição é um JSON com o seguinte shape (trecho real de `revalida-2025-1`):

```json
{
  "id": "revalida-2025-1",
  "year": 2025,
  "publishedAt": "2025-04-14",
  "cutoffScore": 0.6,
  "passRate": 0.18,
  "source": "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/revalida/provas-e-gabaritos",
  "questions": [
    {
      "id": "revalida-2025-1-q02",
      "number": 2,
      "editionId": "revalida-2025-1",
      "stem": "Homem de 42 anos, em uso crônico de anti-inflamatório…",
      "options": {
        "A": "Úlcera gástrica perfurada.",
        "B": "Pancreatite aguda.",
        "C": "Colecistite aguda.",
        "D": "Diverticulite aguda."
      },
      "correct": "A",
      "specialty": ["cirurgia"],
      "annulled": false,
      "hasImage": false,
      "hasTable": true
    }
  ]
}
```

Os arquivos ficam em `data/revalida/<ano>-<N>.json` e `data/enamed/<ano>.json` e são incluídos no tarball publicado no npm (`files: ["dist", "data"]`).

## Edições disponíveis

| Edição             | Questões | Publicação INEP |
| ------------------ | -------- | --------------- |
| `revalida-2024-1`  | 100      | 2024-03-17      |
| `revalida-2024-2`  | 100      | 2024-08-25      |
| `revalida-2025-1`  | 100      | 2025-04-14      |
| `enamed-2025`      | 100      | 2025-10-26      |

Novas edições são incorporadas conforme o INEP publica os gabaritos definitivos pós-recurso. Edições anteriores (Revalida 2011–2023) estão no roadmap.

## Integridade dos dados

- **Fonte única**: portal oficial do INEP. Nenhum dado é importado de terceiros, transcrições informais ou bancos de questões privados.
- **Gabarito definitivo**: alterações pós-recurso (marcadas em azul pelo INEP) prevalecem sobre o gabarito preliminar.
- **Questões com imagem, tabela ou anuladas** ficam marcadas por `hasImage`, `hasTable` e `annulled`, mas **não são excluídas** do JSON — a exclusão é decisão do consumidor (o harness, por padrão, exclui imagens e tabelas).
- Detalhes do pipeline e política editorial em [`CLAUDE.md`](https://github.com/Precisa-Saude/medbench-brasil/blob/main/CLAUDE.md) e nos ADRs em [`docs/development/adr/`](https://github.com/Precisa-Saude/medbench-brasil/tree/main/docs/development/adr).

## Licença

[Apache-2.0](https://github.com/Precisa-Saude/medbench-brasil/blob/main/LICENSE).

## Links

- **Site**: [medbench-brasil.ia.br](https://medbench-brasil.ia.br)
- **Repositório**: [github.com/Precisa-Saude/medbench-brasil](https://github.com/Precisa-Saude/medbench-brasil)
- **Issues**: [github.com/Precisa-Saude/medbench-brasil/issues](https://github.com/Precisa-Saude/medbench-brasil/issues)
- **Harness de avaliação**: [`@precisa-saude/medbench-harness`](https://www.npmjs.com/package/@precisa-saude/medbench-harness)
