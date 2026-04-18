import type { QuestionOption } from '@precisa-saude/medbench-dataset';

export type GabaritoValue = QuestionOption | 'ANNULLED';

/**
 * Parsing determinístico do texto extraído do gabarito definitivo da INEP.
 * Formato típico:
 *
 *   Questão 1 2 3 4 5 6 7 8 9 10 ...
 *   Gabarito B A A B D C - B A C ...
 *
 * Retorna um mapa número → letra | 'ANNULLED'.
 *
 * Marcadores de anulada observados na prática:
 *   - "-" (hífen ASCII, U+002D) — visto em Revalida 2025/1
 *   - "̶"  (combining long solidus overlay, U+0336) — visto em Revalida 2024/1
 *   - "–" (en dash, U+2013) / "—" (em dash, U+2014) — possíveis em outras edições
 * Qualquer token de 1 caractere que não seja A/B/C/D e apareça em posição
 * gabarito-compatível é tratado como anulada.
 */
const ANNULLED_MARKERS = /^[-\u2013\u2014\u0336]$/;
const VALID_TOKEN = /^[A-D]$|^[-\u2013\u2014\u0336]$/;

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
      // Questão/Gabarito quando todos os tokens são letras A–D ou um
      // marcador de anulada, e o total de letras bate com o total de
      // números. Isso faz a primeira ocorrência (limpa) vencer.
      const allValid = tokens.every((t) => VALID_TOKEN.test(t));
      if (allValid && tokens.length === pendingNumbers.length) {
        for (let i = 0; i < pendingNumbers.length; i++) {
          const n = pendingNumbers[i]!;
          if (out.has(n)) continue;
          const letter = tokens[i]!;
          out.set(
            n,
            ANNULLED_MARKERS.test(letter) ? 'ANNULLED' : (letter as QuestionOption),
          );
        }
      }
      pendingNumbers = null;
    }
  }

  return out;
}
