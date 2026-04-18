/**
 * Schema compartilhado para o tool_use de parsing de Revalida.
 * Separado de `parser.ts` para que backends (Bedrock, Anthropic API direta)
 * reusem a mesma definição — garante que mudanças no schema afetem todos os
 * caminhos de extração.
 */

export const QUESTION_EXTRACTION_TOOL = {
  description:
    'Extrai todas as questões de múltipla escolha de uma prova Revalida em formato estruturado.',
  input_schema: {
    properties: {
      questions: {
        items: {
          properties: {
            annulled: {
              description: 'True se a questão foi anulada no gabarito definitivo.',
              type: 'boolean',
            },
            correct: {
              description: 'Letra correta conforme gabarito definitivo (pós-recurso).',
              enum: ['A', 'B', 'C', 'D'],
              type: 'string',
            },
            hasImage: {
              description: 'True se o enunciado depende de uma imagem para ser respondido.',
              type: 'boolean',
            },
            hasTable: {
              description: 'True se o enunciado depende de uma tabela para ser respondido.',
              type: 'boolean',
            },
            notes: {
              description:
                'Observações relevantes: alteração de gabarito pós-recurso, correção de enunciado, etc.',
              type: 'string',
            },
            number: {
              description: 'Número da questão na prova objetiva (1 a ~100).',
              type: 'integer',
            },
            options: {
              properties: {
                A: { type: 'string' },
                B: { type: 'string' },
                C: { type: 'string' },
                D: { type: 'string' },
              },
              required: ['A', 'B', 'C', 'D'],
              type: 'object',
            },
            specialty: {
              description:
                'Especialidades da questão. Multi-label quando houver sobreposição clara.',
              items: {
                enum: [
                  'clinica-medica',
                  'cirurgia',
                  'ginecologia-obstetricia',
                  'pediatria',
                  'medicina-familia-comunidade',
                  'saude-publica',
                ],
                type: 'string',
              },
              type: 'array',
            },
            stem: {
              description: 'Enunciado completo da questão, sem o número inicial.',
              type: 'string',
            },
          },
          required: [
            'number',
            'stem',
            'options',
            'correct',
            'specialty',
            'hasImage',
            'hasTable',
            'annulled',
          ],
          type: 'object',
        },
        type: 'array',
      },
      warnings: {
        description:
          'Problemas encontrados durante o parsing: questões suspeitas, alternativas duplicadas, páginas com OCR ruim, etc.',
        items: { type: 'string' },
        type: 'array',
      },
    },
    required: ['questions', 'warnings'],
    type: 'object',
  },
  name: 'extract_revalida_questions',
} as const;

export const PARSER_SYSTEM_PROMPT = `Você é um extrator estruturado de provas Revalida da INEP. Sua tarefa é converter o texto bruto de uma prova objetiva em questões estruturadas.

Regras inegociáveis:
1. NÃO invente enunciados, alternativas ou gabaritos. Reproduza exatamente o que está no texto.
2. O gabarito definitivo é a fonte única de verdade. Se o texto da prova e o gabarito discordarem, siga o gabarito.
3. Quando o enunciado referencia imagem ou tabela, marque hasImage/hasTable como true.
4. Questões anuladas no gabarito definitivo recebem annulled=true, mantendo os demais campos.
5. Classificação por especialidade é multi-label. Use apenas as 6 categorias do enum.
6. Reporte qualquer dúvida ou inconsistência em warnings — não tente mascarar problemas.`;

export function buildUserPrompt(
  editionId: string,
  provaText: string,
  gabaritoText: string,
  range?: { from: number; to: number },
): string {
  const rangeInstruction = range
    ? `\nExtraia APENAS as questões de número ${range.from} a ${range.to} (inclusive). Ignore questões fora deste intervalo — elas serão processadas em outras chamadas.\n`
    : '';
  return [
    `Edição: ${editionId}`,
    rangeInstruction,
    '=== TEXTO DA PROVA (extraído do PDF) ===',
    provaText,
    '',
    '=== GABARITO DEFINITIVO (extraído do PDF) ===',
    gabaritoText,
  ].join('\n');
}
