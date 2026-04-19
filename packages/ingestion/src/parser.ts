import type { Question, QuestionOption, Specialty } from '@precisa-saude/medbench-dataset';

import { parseGabarito } from './gabarito.js';
import { invokeBedrockParser } from './parser-bedrock.js';
import {
  buildUserPrompt,
  PARSER_SYSTEM_PROMPT,
  QUESTION_EXTRACTION_TOOL,
} from './parser-schema.js';

/**
 * Parsing de texto extraído do PDF em questões estruturadas via Claude tool_use.
 *
 * Backend padrão: AWS Bedrock (reusa credenciais AWS do ambiente).
 * Alternativa: API Anthropic direta via opção `backend: 'anthropic-api'`.
 *
 * Preprocessamento — não viola ADR 0002 de integridade do benchmark.
 */

export type ParserBackend = 'bedrock' | 'anthropic-api';

export interface ParseOptions {
  /** Sobrescreve ANTHROPIC_API_KEY quando backend=anthropic-api. */
  apiKey?: string;
  backend?: ParserBackend;
  editionId: string;
  gabaritoText: string;
  /** Bedrock: ARN ou ID de modelo; Anthropic: nome do modelo. */
  model?: string;
  provaText: string;
  /** Apenas Bedrock. Padrão: sa-east-1. */
  region?: string;
}

export interface ParsedEditionQuestions {
  questions: Question[];
  warnings: string[];
}

interface ToolUseResponse {
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
}

// Haiku é suficiente para a tarefa mecânica de reestruturar texto + gabarito
// em JSON tipado. Haiku 3 on-demand foi testado e fica travado no teto de
// 4096 tokens de saída, produzindo tool_use com input vazio quando estoura o
// limite. Haiku 4.5 via cross-region inference profile suporta saída maior
// e adere melhor ao schema. Usuário pode sobrescrever com --model / AWS
// account é inferido em tempo de execução quando um ARN completo é passado.
const DEFAULT_BEDROCK_MODEL = 'global.anthropic.claude-haiku-4-5-20251001-v1:0';
const DEFAULT_ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';

// Haiku 3 no Bedrock tem ceiling de 4096 tokens de saída, insuficiente para
// ~100 questões estruturadas. Chunkamos o pedido em faixas de 25 questões,
// passando o texto completo da prova e do gabarito em cada chamada — o modelo
// filtra pelo intervalo solicitado no prompt. Custo adicional de input é
// desprezível (Haiku 3 a $0.25/M input tokens).
const CHUNK_SIZE = 25;
const MAX_QUESTIONS = 100;

export async function parseEdition(opts: ParseOptions): Promise<ParsedEditionQuestions> {
  const backend: ParserBackend = opts.backend ?? 'bedrock';
  const gabaritoMap = parseGabarito(opts.gabaritoText);

  const allQuestions: Question[] = [];
  const allWarnings: string[] = [];

  for (let from = 1; from <= MAX_QUESTIONS; from += CHUNK_SIZE) {
    const to = Math.min(from + CHUNK_SIZE - 1, MAX_QUESTIONS);
    const userPrompt = buildUserPrompt(opts.editionId, opts.provaText, opts.gabaritoText, {
      from,
      to,
    });

    const toolUse =
      backend === 'bedrock'
        ? await invokeBedrockParser({
            model: opts.model ?? DEFAULT_BEDROCK_MODEL,
            region: opts.region ?? 'sa-east-1',
            systemPrompt: PARSER_SYSTEM_PROMPT,
            tool: QUESTION_EXTRACTION_TOOL,
            userPrompt,
          })
        : await invokeAnthropicApiParser({
            apiKey: opts.apiKey ?? process.env.ANTHROPIC_API_KEY,
            model: opts.model ?? DEFAULT_ANTHROPIC_MODEL,
            systemPrompt: PARSER_SYSTEM_PROMPT,
            tool: QUESTION_EXTRACTION_TOOL,
            userPrompt,
          });

    const parsed = toolUse as ToolUseResponse;
    for (const q of parsed.questions) {
      // Gabarito definitivo é fonte única de verdade. Sobrescrevemos o que o
      // LLM inferiu quando diverge do que foi parseado deterministicamente
      // do PDF de gabarito.
      const truth = gabaritoMap.get(q.number);
      const annulled = truth === 'ANNULLED' ? true : q.annulled;
      const correct = truth && truth !== 'ANNULLED' ? truth : q.correct;
      if (truth === 'ANNULLED' && !q.annulled) {
        allWarnings.push(
          `[${from}-${to}] Q${q.number}: gabarito marca como anulada, LLM marcou como não-anulada — corrigido`,
        );
      } else if (truth && truth !== 'ANNULLED' && truth !== q.correct) {
        allWarnings.push(
          `[${from}-${to}] Q${q.number}: LLM respondeu ${q.correct}, gabarito diz ${truth} — corrigido`,
        );
      } else if (!truth) {
        allWarnings.push(`[${from}-${to}] Q${q.number}: gabarito não encontrado no PDF`);
      }

      allQuestions.push({
        annulled,
        correct,
        editionId: opts.editionId as Question['editionId'],
        hasImage: q.hasImage,
        hasTable: q.hasTable,
        id: `${opts.editionId}-q${String(q.number).padStart(2, '0')}`,
        notes: q.notes,
        number: q.number,
        options: q.options,
        specialty: q.specialty,
        stem: q.stem,
      });
    }
    for (const w of parsed.warnings ?? []) allWarnings.push(`[${from}-${to}] ${w}`);
  }

  allQuestions.sort((a, b) => a.number - b.number);
  return { questions: allQuestions, warnings: allWarnings };
}

interface AnthropicApiArgs {
  apiKey: string | undefined;
  model: string;
  systemPrompt: string;
  tool: typeof QUESTION_EXTRACTION_TOOL;
  userPrompt: string;
}

async function invokeAnthropicApiParser(args: AnthropicApiArgs): Promise<unknown> {
  if (!args.apiKey) {
    throw new Error('ANTHROPIC_API_KEY ausente — defina no ambiente ou use --backend bedrock.');
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    body: JSON.stringify({
      max_tokens: 16_000,
      messages: [{ content: args.userPrompt, role: 'user' }],
      model: args.model,
      system: args.systemPrompt,
      temperature: 0.1,
      tool_choice: { name: args.tool.name, type: 'tool' },
      tools: [args.tool],
    }),
    headers: {
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'x-api-key': args.apiKey,
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
  if (!toolUse?.input) {
    throw new Error('Resposta da API não contém tool_use — parsing falhou.');
  }
  return toolUse.input;
}
