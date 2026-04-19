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
// eslint-disable-next-line no-misleading-character-class
const ANNULLED_MARKERS = /^[-\u2013\u2014\u0336]$/u;
// eslint-disable-next-line no-misleading-character-class
const VALID_TOKEN = /^[A-D]$|^[-\u2013\u2014\u0336]$/u;

export function parseGabarito(text: string): Map<number, GabaritoValue> {
  const out = new Map<number, GabaritoValue>();
  const lines = text.split('\n');

  // Formato Revalida (linha-a-linha):
  //   Questão 1 2 3 4 ...
  //   Gabarito B A A B ...
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
      const allValid = tokens.every((t) => VALID_TOKEN.test(t));
      if (allValid && tokens.length === pendingNumbers.length) {
        for (let i = 0; i < pendingNumbers.length; i++) {
          const n = pendingNumbers[i]!;
          if (out.has(n)) continue;
          const letter = tokens[i]!;
          out.set(n, ANNULLED_MARKERS.test(letter) ? 'ANNULLED' : (letter as QuestionOption));
        }
      }
      pendingNumbers = null;
    }
  }

  // Formato ENAMED (tabela interleaved, com células que podem quebrar em
  // múltiplas linhas quando o rótulo é longo):
  //   1 A 11 Anulada 21 A
  //   2 Excluída* 12 D 22 A
  //   10
  //   Anulada
  //   Administrati-vamente**20 C 30 C
  //
  // Aplicamos como fallback — só preenche números ainda não capturados pelo
  // formato Revalida acima.
  //
  // Esta função só processa texto de PDFs de gabarito oficiais da INEP
  // (nunca enunciados de prova). Isso permite colapsar whitespace sem risco
  // de casar números clínicos em stems ('130 x 90 mmHg A'). O cenário
  // multi-linha real ('10\\nAnulada\\nAdministrati-vamente**') obriga esse
  // colapso — processar linha a linha dropa células que quebram em 3
  // linhas (visto em ENAMED 2025 Q10).
  //
  // Mitigações de falso positivo mantidas (defesa em profundidade):
  //   - Upper bound 200 (cadernos INEP têm ~100 questões)
  //   - Sem flag `i`: só casa A/B/C/D maiúsculos
  //   - `.toUpperCase()` no token como defesa redundante
  //   - Lookbehind `(?<=^|\\s)` e lookahead `(?=\\s|$|\\*)`: evita o
  //     comportamento instável de \\b com flag `u` próximo a acentos
  //     (Excluída, Administrati-vamente)
  // Lookbehind inclui `\*` porque o marcador `**` termina a célula anterior
  // ('Administrati-vamente**20 C') — depois dos asteriscos vem o próximo
  // número sem whitespace. Sem isso, Q20 após Q10 anulada administrativamente
  // fica sem correspondência.
  const pairRegex =
    /(?<=^|\s|\*)(\d{1,3})\s+(A|B|C|D|Anulada(?:\s+Administrati-?\s*vamente)?|Exclu[íi]da)\*{0,2}(?=\s|$|\*)/gu;
  const joined = text.replace(/\s+/g, ' ');
  for (const m of joined.matchAll(pairRegex)) {
    const n = Number(m[1]);
    if (!Number.isFinite(n) || n < 1 || n > 200) continue;
    if (out.has(n)) continue;
    const token = m[2]!.toUpperCase();
    out.set(n, /^[ABCD]$/.test(token) ? (token as QuestionOption) : 'ANNULLED');
  }

  return out;
}
