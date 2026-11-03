# ADR 0005: consumo observado e estimativas de custo

**Data**: 2026-11-03
**Status**: Aceito para captura de consumo; publicação de preços na próxima entrega

## Contexto

Os raws anteriores não preservavam tokens faturados. Texto visível não permite
reconstruir raciocínio oculto. Uma avaliação retomada pode incluir respostas
pagas em execuções anteriores; retries e smoke também podem gerar cobrança.
O custo de respostas atualmente elegíveis não representa todo o gasto do projeto.

## Decisão

### Fatos em tokens, não USD

O harness normaliza apenas contadores declarados pelo fornecedor e preserva
metadata da resposta: modelo resolvido, ID de resposta/requisição, endpoint
sem credenciais/query/fragmento, fornecedor upstream e tier quando disponíveis.
Não envia parâmetros novos para obter usage e não consulta serviços externos
durante uma avaliação. Não armazena valores monetários de usage em `results/`.

`inputTokens` inclui entrada cacheada. `outputTokens` inclui reasoning.
`reasoningTokens` e detalhes de cache são breakdowns, não parcelas a somar
novamente. `totalTokens` só existe quando declarado pela API.

- OpenAI/OpenRouter: `prompt_tokens` e `completion_tokens` já são totais;
  reasoning é subconjunto de completion e cache é subconjunto de prompt.
- Anthropic: entrada total = `input_tokens + cache_read_input_tokens +
cache_creation_input_tokens`. Os dois campos de cache são opcionais;
  quando ausentes não há parcela de cache a adicionar nem breakdown publicado.
  TTLs de escrita são subdivisões de `cache_creation_input_tokens`.
- Google: saída = `totalTokenCount - promptTokenCount` quando o total existe,
  pois o protocolo não usa ferramentas. Sem total, usa `candidatesTokenCount +
thoughtsTokenCount`, com thoughts opcional conforme o contrato da API.
  `cachedContentTokenCount` já pertence ao prompt. Nunca somar thoughts ao
  total novamente.
- System One: normaliza campos OpenAI-compatible quando presentes. Payloads
  de consumo sem esse contrato permanecem disponíveis no raw original,
  sem converter unidades ou inferir tokens.

Contadores inválidos/incompletos deixam usage ausente. Zero só representa
um valor observado ou uma soma definida pelo contrato da API. Detalhes
opcionais ausentes não se tornam zero no breakdown.

### Score e gasto operacional têm escopos diferentes

O raw de sucesso guarda usage, timestamp e UUID de tentativa/execução.
O scored JSON soma consumo somente das respostas aceitas no score, com
`callsWithUsage` e `totalCalls`. Detalhes opcionais só são agregados quando
disponíveis em todas as chamadas que possuem usage. Cobertura incompleta
não autoriza apresentar soma observada como custo completo.

`*.eval.requests.jsonl` e `*.smoke.requests.jsonl` são ledgers append-only
independentes dos raws. Incluem tentativas bem-sucedidas e falhas observadas,
com UUID único, ordem da tentativa, timestamp, duração, contexto e usage
quando recebido. Erros HTTP com JSON de usage preservam esse consumo.
O ledger não inclui mensagens de erro arbitrárias, credenciais ou prompts.
Um processo morto antes da resposta ou um erro de transporte pode deixar
cobrança sem observação; não há promessa de completude de faturamento.

Resume não gera evento para respostas reutilizadas. Restart não trunca ledger.
Rescore não chama providers nem cria gasto novo: reconstitui consumo das
respostas aceitas ou preserva o agregado já existente no scored JSON.
Uma anulação posterior pode reduzir consumo do score, mas não apaga o ledger.
Para consolidar arquivos copiados, deduplicar por `attemptId`; não somar ledger
e raw, pois representam as mesmas chamadas bem-sucedidas.

Uma falha de persistência de auditoria interrompe a execução sem retry da
chamada bem-sucedida. Na CLI o ledger continua ativo com `--no-raw-log`.
Consumidores da biblioteca recebem `onRequestAttempt` e devem persistir os
eventos para ter auditoria operacional, além de `onRawResponse`.

### Preços e publicação (segunda entrega)

Preços ficam em registry separado de `results/`, por modelo e rota de
fornecedor, com fonte oficial aberta, citação literal, data de verificação
e vigência quando publicada. Sem preço verificável, custo desconhecido.
Não aplicar preço de API a execução local nem preço de antecessor a sucessor.

O custo comparativo de tabela usa tarifas padrão por milhão de tokens, sem
descontos de batch/cache, e informa a data da tabela. Reprecificar consumo
antigo com tabela atual produz uma estimativa a preços atuais, não gasto
histórico. Quando oferecida, uma estimativa com cache/tier deve usar os
breakdowns e tarifas correspondentes, sem presumir detalhes ausentes.

Cobrança efetiva exige conciliação com extratos do fornecedor por request ID
e período. Descontos, taxas, retries invisíveis e BYOK podem divergir da
estimativa. A interface deve distinguir estimativa de tabela, estimativa
ajustada e cobrança conciliada; nenhuma delas é intercambiável.

Não reexecutar modelos antigos apenas para obter usage. Novas edições usam
sucessores selecionados por família/tier; preservar resultados históricos
sob seus IDs originais.

## Garantias do benchmark

Somente logging de resposta e contabilização offline mudam. O system prompt
literal, single-turn, ausência de ferramentas, três execuções e IC95%
permanecem os mesmos do ADR 0002. Fixtures verificam que usage não adiciona
campos à requisição.

## Fontes verificadas em 03/11/2026

- [OpenAI, Chat Completions](https://platform.openai.com/docs/api-reference/chat/object):
  contadores de prompt/completion, detalhes de reasoning/cache e identidade
  da resposta. A descrição de `max_completion_tokens` inclui “visible output
  tokens and reasoning tokens”.
- [Anthropic, Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching):
  “total_input_tokens = cache_read_input_tokens + cache_creation_input_tokens + input_tokens”.
- [Google, GenerateContentResponse](https://ai.google.dev/api/generate-content#UsageMetadata):
  “Total token count for the generation request (prompt + tool-use prompt + thoughts + response candidates).”
- [OpenRouter, API Reference](https://openrouter.ai/docs/api/reference/overview):
  `completion_tokens_details.reasoning_tokens`, `prompt_tokens_details.cached_tokens`,
  `cache_write_tokens`, identificação de resposta e consulta de geração para
  auditoria posterior. Nenhuma consulta adicional é feita pelo harness.
