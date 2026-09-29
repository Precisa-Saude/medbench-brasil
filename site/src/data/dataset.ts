/**
 * Carrega as edições (Revalida + ENAMED) em tempo de build via Vite.
 * Usado pelo site para renderizar enunciados e alternativas nas páginas
 * de questão/edição — tudo estático, sem fetch em runtime.
 */

import type { Edition, Question } from '@precisa-saude/medbench-dataset';

const raw = import.meta.glob<Edition>('../../../packages/dataset/data/*/*.json', {
  eager: true,
  import: 'default',
});

export const EDITIONS_DATA: Record<string, Edition> = {};
for (const edition of Object.values(raw)) {
  EDITIONS_DATA[edition.id] = edition;
}

export function getEdition(id: string): Edition | undefined {
  return EDITIONS_DATA[id];
}

export function getQuestion(questionId: string): Question | undefined {
  for (const ed of Object.values(EDITIONS_DATA)) {
    const q = ed.questions.find((q) => q.id === questionId);
    if (q) return q;
  }
  return undefined;
}

export function allQuestions(): Question[] {
  const out: Question[] = [];
  for (const ed of Object.values(EDITIONS_DATA)) out.push(...ed.questions);
  return out.sort((a, b) =>
    a.editionId === b.editionId ? a.number - b.number : a.editionId.localeCompare(b.editionId),
  );
}

/**
 * Edições corrigidas com gabarito preliminar da INEP, anterior à análise de
 * recursos. Os escores dessas edições são provisórios e serão reprocessados
 * quando o gabarito definitivo sair.
 *
 * Exposto aqui (e não só na página da edição) porque o ranking agrega todas
 * as edições: quem lê a tabela precisa saber que parte do número vem de
 * gabarito que ainda pode mudar.
 */
export function editionsWithPreliminaryKey(): string[] {
  return Object.values(EDITIONS_DATA)
    .filter((e) => e.answerKeyStatus === 'preliminar')
    .map((e) => e.id)
    .sort();
}
