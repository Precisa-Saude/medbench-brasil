# Pilotos dos novos candidatos

## Objetivo

Verificar acesso, parsing e consumo de GPT-6.1 Terra, Claude Haiku 5.5 e
Gemini 4 Argon antes de avaliar o conjunto completo. Alterar somente os
adapters necessários para esses IDs exatos, preservando requests históricos.

## Estado atual

Worktree `feat/shortlist-pilots`, independente da correção de máximo em
`feat/usage-max-input`. Fonte de questões: Revalida 2026/1, definitivo.
Nenhum resultado de benchmark será gerado a partir do piloto.

Piloto concluído em 03/11/2026 (02:03–02:04 UTC de 04/11): dez tentativas,
oito respostas. Terra e Argon ficaram bloqueados na primeira chamada, sem
retry. Nenhum scored JSON, cutoff ou entrada do leaderboard foi alterado.

## Especificação

- Terra: Chat Completions, `max_completion_tokens=8192`,
  `reasoning_effort=high`, sem sampling. O guia permite Chat Completions sem
  ferramentas e exige omitir temperature quando effort não é none.
- Haiku 5.5: Messages API, `max_tokens=8192`, `output_config.effort=high`,
  sem temperature, top_p ou top_k. Thinking adaptativo é padrão.
- Argon: GenerateContent, `maxOutputTokens=32768`,
  `thinkingConfig.thinkingLevel=HIGH`, sem temperature. O guia recomenda
  limite de pelo menos 32768 e timeout de pelo menos 15 minutos.
- Efeito restrito aos três IDs exatos. GPT-5, Haiku 4.5 e demais Gemini
  mantêm seus requests anteriores. Nenhuma heurística sobre versões futuras.
- System prompt literal, uma questão por HTTP, sem histórico, exemplos,
  ferramentas, Managed Agents, continuação ou previous_interaction_id.
- Oito questões elegíveis distribuídas ao longo da edição, iguais para os
  três modelos. Uma chamada por amostra, máximo de 24 chamadas; sem retry.
  Parar o modelo no primeiro erro de acesso, parsing ou truncamento e
  continuar os demais. Não trocar de rota ou ajustar parâmetros silenciosamente.
- Persistir respostas e tentativas em arquivos smoke JSONL, sem scored JSON.
  Acertos do piloto não são um escore de benchmark nem critério para tuning.
- Chaves ficam em memória, carregadas do ambiente local já conectado.
  Não gravar credenciais nos scripts, parâmetros ou logs.
- Cutoff Terra: data exata publicada em sua página. Haiku publica junho/2026;
  não inventar um dia. Classificação de contaminação e entradas do registry
  ficam para uma decisão posterior ao piloto; não alterar cutoffs existentes.

## Fontes primárias abertas nesta sessão

- [Terra](https://developers.openai.com/api/docs/models/gpt-6.1-terra):
  `gpt-6.1-terra`, Chat Completions suportado; "Jun 01, 2026 knowledge cutoff".
- [Guia GPT-6](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-6-astra):
  "Use reasoning.effort in Responses or reasoning_effort in Chat Completions."
  "When reasoning effort is not none, remove temperature, top_p, and top_logprobs."
- [Haiku overview](https://platform.claude.com/docs/en/models/haiku-5-5/overview)
  e [migração](https://platform.claude.com/docs/en/models/haiku-5-5/migration-guide):
  "Adaptive thinking is on by default"; "Remove temperature, top_p, and top_k".
- [Argon](https://ai.google.dev/gemini-api/docs/models/gemini-4-argon)
  e [migração](https://ai.google.dev/gemini-api/docs/latest-model):
  default medium, thinking configurável; sampling fornecido é ignorado;
  recomendação de limite de saída 32768 e timeout de 15 minutos.
- [GenerateContent API](https://ai.google.dev/api/generate-content):
  `thinkingConfig.thinkingLevel` aceita o enum `HIGH`.

## Próximos passos

1. Concluído: adapters específicos e sete testes de protocolo/compatibilidade.
2. Concluído: lint/typecheck, 309 testes e build de todos os pacotes.
   Cobertura do harness passou. Logging de stop reason adicionado também ao
   OpenAI para detectar truncamento, sem alterar o request histórico.
3. Concluído: pilotos limitados e auditoria dos logs.
4. Antes de novo lote: corrigir acesso OpenAI (HTTP 401) e investigar resposta
   HTTP 402 do Google. Não houve confirmação de identidade nesses modelos.
5. Commit autorizado pelo mantenedor em 04/11/2026; publicação de PR pendente.
   Registro no roster e avaliação completa não serão tratados como concluídos
   pelo piloto.

## Resultado operacional

### Continuação autorizada via OpenRouter (04/11/2026)

O mantenedor autorizou testar Terra e Argon pelo OpenRouter após os bloqueios
nativos. O catálogo `https://openrouter.ai/api/v1/models`, consultado nesta
sessão, lista `openai/gpt-6.1-terra` e `google/gemini-4-argon`, ambos com
`reasoning_effort=high`. Tarifas por milhão: Terra US$ 1/5 e Argon US$ 2/10.
Não usar variantes Pro, batch ou modelos substitutos.

Especificação desta continuação:

- Mesmas oito questões, no máximo 16 chamadas novas, sem retry. Interromper
  cada modelo no primeiro erro, parsing inválido ou parada diferente de stop.
- Chat Completions OpenRouter; system literal e uma mensagem de usuário.
  Sem sampling para esses dois IDs exatos nessa URL. Effort explícito high.
- Terra: `max_tokens=8192`, timeout 300 segundos; Argon: `max_tokens=32768`,
  timeout 900 segundos. OpenRouter aceita `max_tokens` nos dois modelos.
- `provider.require_parameters=true` e `provider.allow_fallbacks=false`,
  conforme a [documentação de roteamento](https://openrouter.ai/docs/guides/routing/provider-selection)
  aberta nesta sessão. Nenhum fallback de modelo ou provedor na falha.
- Compatibilidade: requests antigos de OpenAI-compat permanecem idênticos.
  Cobrir os dois IDs e a restrição da URL por testes antes das chamadas.
- Modo `openrouter` separado no script, carregando somente sua credencial.
  Novos logs usam os IDs com prefixo do fornecedor, sem tocar nos nativos.
  Registrar identidade resolvida, provedor, usage e motivos de parada.
- Sem scored JSON ou publicação no roster. Nova alteração ainda sem commit.

Resultado: 16/16 chamadas concluídas, parsing válido e `stop` em todas.
Identidades resolvidas iguais aos IDs solicitados, com provedor reportado
`OpenAI` para Terra e `Google` para Argon. Não houve falhas nem retries.

| Modelo via OpenRouter | Entrada | Saída (inclui raciocínio) | Raciocínio | Custo de referência |
| --------------------- | ------: | ------------------------: | ---------: | ------------------: |
| Terra                 |   1.959 |                       840 |        612 |        US$ 0,006159 |
| Argon                 |   2.210 |                    10.947 |      7.589 |        US$ 0,113890 |

Total de referência desta continuação: **US$ 0,120049**. Tarifas consultadas
no catálogo OpenRouter nesta sessão: `(entrada × tarifa + saída × tarifa) /
1000000`. Não somar raciocínio novamente. Cache lido/escrito explicitamente
zero. Máximos de entrada/saída por chamada: Terra 309/175, Argon 344/2.057.
O máximo de Terra fica abaixo da faixa longa de 272.000 tokens do catálogo.
O total é uma estimativa de tabela sem taxas ou créditos, não uma fatura.

Raws e ledgers separados: `openai_gpt-6.1-terra.smoke*.jsonl` e
`google_gemini-4-argon.smoke*.jsonl` em `results/revalida-2026-1/`.
Auditoria confirmou oito tentativas bem-sucedidas por modelo, cada uma ligada
à resposta pelo attempt ID. Logs nativos permanecem intactos. Os pilotos
validam a rota, mas não publicam acurácia ou substituem três runs completas.

### Piloto nativo (03/11/2026)

As oito questões selecionadas por índices igualmente espaçados entre as 84
elegíveis foram 01, 18, 34, 47, 58, 74, 86 e 100. Terra e Argon receberam
somente a questão 01, pois a política interrompe o modelo no primeiro erro.

| Modelo           | Tentativas | Respostas |      Entrada |        Saída | Situação                      |
| ---------------- | ---------: | --------: | -----------: | -----------: | ----------------------------- |
| GPT-6.1 Terra    |          1 |         0 | desconhecida | desconhecida | HTTP 401                      |
| Claude Haiku 5.5 |          8 |         8 |        3.184 |        7.782 | Parsing 8/8, todas `end_turn` |
| Gemini 4 Argon   |          1 |         0 | desconhecida | desconhecida | HTTP 402                      |

Haiku retornou `resolvedModel=claude-haiku-5-5` e `serviceTier=standard`
nas oito respostas. Máximo observado de entrada: 502 tokens; de saída:
3.158 tokens, abaixo do limite de 8.192. Não houve truncamento declarado.
Cache lido/escrito foi explicitamente zero. Breakdown de raciocínio não
foi declarado pela API; não foi estimado a partir do texto.

Estimativa de referência de Haiku: **US$ 0,0042094**, calculada por
`(3184 × 0,10 + 7782 × 0,50) / 1000000`. A
[página oficial de Haiku](https://platform.claude.com/docs/en/models/haiku-5-5/overview),
reaberta nesta sessão, publica essas tarifas para prompts até 100.000 tokens.
O máximo observado confirma a faixa. Não é uma fatura. Terra e Argon não
declararam usage nas falhas; eventual cobrança permanece desconhecida.

Os logs estão em `results/revalida-2026-1/<model>.smoke.jsonl` e
`<model>.smoke.requests.jsonl`. Os raws de Terra e Argon estão vazios; suas
tentativas e metadados disponíveis estão nos ledgers. Status HTTP foi
observado no terminal e registrado aqui, pois o ledger atual não o persiste.
O request ID da falha OpenAI é `req_1e18d0219aab4868b51eed65b09993de`.

O script `packages/eval-harness/scripts/shortlist-pilots.mjs` recusa executar
se qualquer arquivo do piloto já existir. Não apagar logs para contornar
essa proteção. Uma retomada requer decisão explícita de escopo e novos
arquivos, preservando a auditoria existente.
