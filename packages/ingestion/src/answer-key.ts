import type { AnswerKeyStatus } from '@precisa-saude/medbench-dataset';

/**
 * Nome do arquivo bruto do gabarito, por situação.
 *
 * O nome carrega a situação porque o diretório `scripts/data/raw/<edição>/` é
 * a fonte do reprocesso de dezembro: ao trocar o preliminar pelo definitivo,
 * o arquivo antigo não pode ser sobrescrito silenciosamente nem confundido
 * com o novo. Um `gabarito-definitivo.pdf` que na verdade contém o
 * preliminar destrói a auditoria do `rescore --from-raw`.
 */
export function gabaritoFilename(status: AnswerKeyStatus): string {
  return `gabarito-${status}.pdf`;
}

/** Situação declarada num argumento de CLI, validada em runtime. */
export function parseAnswerKeyStatus(value: string | undefined): AnswerKeyStatus {
  // Default `definitivo`: preserva o comportamento de todas as edições
  // ingeridas antes da ENAMED 2026, que só rodaram com gabarito pós-recurso.
  if (value === undefined || value === 'definitivo') return 'definitivo';
  if (value === 'preliminar') return 'preliminar';
  throw new Error(`--gabarito-status inválido: "${value}" — use "preliminar" ou "definitivo"`);
}

/**
 * Resolve qual gabarito bruto usar na extração.
 *
 * Prefere o definitivo quando os dois existem: é o que o `AGENTS.md` manda
 * prevalecer, e é o estado normal depois do reprocesso de dezembro. Quando só
 * há preliminar, devolve-o com a situação explícita para que o chamador grave
 * `answerKeyStatus` na edição.
 */
export function resolveAnswerKey(fileExists: (filename: string) => boolean): {
  filename: string;
  status: AnswerKeyStatus;
} {
  for (const status of ['definitivo', 'preliminar'] as const) {
    const filename = gabaritoFilename(status);
    if (fileExists(filename)) return { filename, status };
  }
  throw new Error(
    `nenhum gabarito encontrado — esperado ${gabaritoFilename('definitivo')} ou ${gabaritoFilename('preliminar')}`,
  );
}
