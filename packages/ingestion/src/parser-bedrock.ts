import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

import type { QUESTION_EXTRACTION_TOOL } from './parser-schema.js';

interface BedrockParserArgs {
  model: string;
  region: string;
  systemPrompt: string;
  tool: typeof QUESTION_EXTRACTION_TOOL;
  userPrompt: string;
}

/**
 * Invoca Claude via AWS Bedrock para estruturar questões via tool_use.
 *
 * Payload: `anthropic_version: bedrock-2023-05-31`, tool_choice obrigando o
 * tool específico, temperature 0.1.
 *
 * Credenciais AWS lidas do ambiente padrão (`AWS_PROFILE`, `~/.aws/credentials`,
 * IAM role, etc.). Nenhuma configuração explícita — reusa o que já está no
 * ambiente do mantenedor.
 */
export async function invokeBedrockParser(args: BedrockParserArgs): Promise<unknown> {
  const client = new BedrockRuntimeClient({ region: args.region });

  const body = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 16_000,
    messages: [{ content: args.userPrompt, role: 'user' }],
    system: args.systemPrompt,
    temperature: 0.1,
    tool_choice: { name: args.tool.name, type: 'tool' },
    tools: [args.tool],
  };

  const res = await client.send(
    new InvokeModelCommand({
      accept: 'application/json',
      body: JSON.stringify(body),
      contentType: 'application/json',
      modelId: args.model,
    }),
  );

  const decoded = JSON.parse(new TextDecoder().decode(res.body)) as {
    content?: Array<{ input?: unknown; name?: string; text?: string; type: string }>;
    stop_reason?: string;
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  const toolUse = decoded.content?.find((c) => c.type === 'tool_use');
  const input = toolUse?.input as { questions?: unknown[] } | undefined;
  if (!input || !Array.isArray(input.questions)) {
    // eslint-disable-next-line no-console
    console.error(
      '[bedrock] resposta inesperada. stop_reason=%s usage=%o tool_use.input keys=%o',
      decoded.stop_reason,
      decoded.usage,
      input ? Object.keys(input) : '(sem input)',
    );
    // eslint-disable-next-line no-console
    console.error('[bedrock] payload truncado:', JSON.stringify(decoded).slice(0, 3000));
    throw new Error(
      `Resposta Bedrock sem questions[] (stop_reason=${decoded.stop_reason ?? '?'}, output_tokens=${decoded.usage?.output_tokens ?? '?'}).`,
    );
  }
  return toolUse!.input;
}
