import type { Question, QuestionOption, Specialty } from '@precisa-saude/medbench-dataset';

/**
 * Parsing de texto extraído do PDF em questões estruturadas.
 *
 * Usa Claude com `tool_use` — mesmo padrão do
 * Claude Bedrock tool_use, mas
 * via API direta Anthropic (não Bedrock). Isso é preprocessamento, não faz
 * parte do benchmark — usar tools aqui não viola a integridade (ver ADR 0002).
 *
 * O modelo recebe o texto bruto extraído e o gabarito oficial (ambos já
 * deterministicamente capturados do PDF). Sua única tarefa é reestruturar —
 * não inventar valores.
 */

interface ParseOptions {
  apiKey?: string;
  editionId: string;
  gabaritoText: string;
  /** Modelo Claude para parsing (padrão: claude-sonnet-4-6). */
  model?: string;
  provaText: string;
}

export interface ParsedEditionQuestions {
  questions: Question[];
  warnings: string[];
}

const QUESTION_EXTRACTION_TOOL = {
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

const SYSTEM_PROMPT = `Você é um extrator estruturado de provas Revalida da INEP. Sua tarefa é converter o texto bruto de uma prova objetiva em questões estruturadas.

Regras inegociáveis:
1. NÃO invente enunciados, alternativas ou gabaritos. Reproduza exatamente o que está no texto.
2. O gabarito definitivo é a fonte única de verdade. Se o texto da prova e o gabarito discordarem, siga o gabarito.
3. Quando o enunciado referencia imagem ou tabela, marque hasImage/hasTable como true.
4. Questões anuladas no gabarito definitivo recebem annulled=true, mantendo os demais campos.
5. Classificação por especialidade é multi-label. Use apenas as 6 categorias do enum.
6. Reporte qualquer dúvida ou inconsistência em warnings — não tente mascarar problemas.`;

export async function parseEdition(opts: ParseOptions): Promise<ParsedEditionQuestions> {
  const apiKey = opts.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY ausente — defina no ambiente antes de rodar o parser.');
  }

  const userPrompt = [
    `Edição: ${opts.editionId}`,
    '',
    '=== TEXTO DA PROVA (extraído do PDF) ===',
    opts.provaText,
    '',
    '=== GABARITO DEFINITIVO (extraído do PDF) ===',
    opts.gabaritoText,
  ].join('\n');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    body: JSON.stringify({
      max_tokens: 16_000,
      messages: [{ content: userPrompt, role: 'user' }],
      model: opts.model ?? 'claude-sonnet-4-6',
      system: SYSTEM_PROMPT,
      temperature: 0.1,
      tool_choice: { name: QUESTION_EXTRACTION_TOOL.name, type: 'tool' },
      tools: [QUESTION_EXTRACTION_TOOL],
    }),
    headers: {
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'x-api-key': apiKey,
    },
    method: 'POST',
  });

  if (!res.ok) {
    throw new Error(`Anthropic API erro ${res.status}: ${await res.text()}`);
  }

  const body = (await res.json()) as {
    content: Array<{ input?: unknown; name?: string; type: string }>;
  };
  const toolUse = body.content.find((c) => c.type === 'tool_use');
  if (!toolUse || !toolUse.input) {
    throw new Error('Resposta da API não contém tool_use — parsing falhou.');
  }
  const parsed = toolUse.input as {
    questions: Array<{
      annulled: boolean;
      correct: QuestionOption;
      hasImage: boolean;
      hasTable: boolean;
      notes?: string;
      number: number;
      options: Record<QuestionOption, string>;
      specialty: Specialty[];
      stem: string;
    }>;
    warnings: string[];
  };

  const questions: Question[] = parsed.questions.map((q) => ({
    annulled: q.annulled,
    correct: q.correct,
    editionId: opts.editionId as Question['editionId'],
    hasImage: q.hasImage,
    hasTable: q.hasTable,
    id: `${opts.editionId}-q${String(q.number).padStart(2, '0')}`,
    notes: q.notes,
    number: q.number,
    options: q.options,
    specialty: q.specialty,
    stem: q.stem,
  }));

  return { questions, warnings: parsed.warnings ?? [] };
}
