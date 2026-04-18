# Schema do dataset

O pacote `@precisa-saude/medbench-dataset` expõe o dataset de forma tipada. A definição canônica está em `packages/dataset/src/types.ts`.

## Edição

```ts
interface Edition {
  id: EditionId;           // 'revalida-2025-1'
  year: number;            // 2025
  publishedAt: string;     // ISO YYYY-MM-DD da aplicação da prova
  cutoffScore: number;     // proporção (0..1)
  passRate: number;        // proporção (0..1)
  totalInscritos?: number;
  source: string;          // URL da página oficial INEP
  questions: Question[];
}
```

## Questão

```ts
interface Question {
  id: string;              // 'revalida-2025-1-q42'
  editionId: EditionId;
  number: number;          // número da questão na prova
  stem: string;            // enunciado completo
  options: Record<'A' | 'B' | 'C' | 'D', string>;
  correct: 'A' | 'B' | 'C' | 'D';   // gabarito pós-recurso
  specialty: Specialty[];  // uma ou mais especialidades
  hasImage: boolean;       // questão depende de imagem
  hasTable: boolean;       // questão depende de tabela
  annulled: boolean;       // questão anulada pela INEP
  notes?: string;          // observações (ex.: alteração pós-recurso)
}
```

## Especialidades

Taxonomia em `packages/dataset/src/specialty.ts` — v1 usa as cinco grandes áreas do Revalida (`clinica-medica`, `cirurgia`, `ginecologia-obstetricia`, `pediatria`, `medicina-familia-comunidade`) mais `saude-publica`. Subespecialidades (cardiologia, endocrinologia, etc.) entrarão como extensão não-quebrante em v2.

## Convenções

- IDs estáveis e canônicos; não alterar após publicação
- Gabarito sempre refletindo a versão pós-recurso (definitiva) — alterações são documentadas em `notes`
- Questões anuladas são mantidas no JSON e o scorer as exclui; não deletar
- Sem caracteres especiais ou artefatos de OCR no `stem` — revisão manual obrigatória antes do merge
