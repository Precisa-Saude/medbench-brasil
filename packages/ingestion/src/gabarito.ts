import type { QuestionOption } from '@precisa-saude/medbench-dataset';

export type GabaritoValue = QuestionOption | 'ANNULLED';

/**
 * Parsing determinístico do texto extraído do gabarito definitivo da INEP.
 * Formato típico:
 *
 *   Questão 1 2 3 4 5 6 7 8 9 10 ...
 *   Gabarito B A A B D C - B A C ...
 *
 * "-" indica questão anulada. Retorna um mapa número → letra | 'ANNULLED'.
 */
export function parseGabarito(text: string): Map<number, GabaritoValue> {
  const out = new Map<number, GabaritoValue>();
  const lines = text.split('\n');

  let pendingNumbers: number[] | null = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^Quest[aã]o\b/i.test(trimmed)) {
      pendingNumbers = trimmed
        .split(/\s+/)
        .slice(1)
        .map((s) => Number(s))
        .filter((n) => Number.isFinite(n));
      continue;
    }
    if (/^Gabarito\b/i.test(trimmed) && pendingNumbers) {
      const tokens = trimmed.split(/\s+/).slice(1);
      // PDFs da INEP às vezes duplicam o gabarito com formatação "grudada"
      // (ex.: "C B- A" para Q21=C, Q22=B, Q23=anulada). Só aceitamos o par
      // Questão/Gabarito quando todos os tokens são letras A–D ou "-" e o
      // total de letras bate com o total de números. Isso faz a primeira
      // ocorrência (limpa) vencer e descarta silenciosamente a versão
      // concatenada.
      const allValid = tokens.every((t) => /^[A-D-]$/.test(t));
      if (allValid && tokens.length === pendingNumbers.length) {
        for (let i = 0; i < pendingNumbers.length; i++) {
          const n = pendingNumbers[i]!;
          if (out.has(n)) continue;
          const letter = tokens[i]!;
          out.set(n, letter === '-' ? 'ANNULLED' : (letter as QuestionOption));
        }
      }
      pendingNumbers = null;
    }
  }

  return out;
}
