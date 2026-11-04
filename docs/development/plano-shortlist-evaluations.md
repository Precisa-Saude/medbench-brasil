# Avaliação completa do shortlist

## Objetivo

Avaliar GPT-6.1 Terra, Claude Haiku 5.5 e Gemini 4 Argon em Revalida 2025/2
e 2026/1, após os pilotos aprovados. O mantenedor autorizou continuar em
04/11/2026. Branch `feat/shortlist-evaluations`, baseada nos adapters do PR #91.
PR #90 mantém a correção de custo separada.

## Estado atual

As seis avaliações foram concluídas e auditadas. Há 1.494 respostas aceitas
no score e 1.495 tentativas no ledger, incluindo a única resposta de erro
operacional preservada nos originais do Argon. Retomada finalizada com
exatamente 208 chamadas novas, sem retries. Alterações desta entrega ainda
sem commit ou PR; PRs #90 e #91 já foram mesclados.

## Especificação

- Seis combinações modelo/edição: 82 e 84 questões elegíveis, três runs por
  questão. Total esperado: 1.494 respostas novas. Não reaproveitar pilotos.
- Terra `openai/gpt-6.1-terra` e Argon `google/gemini-4-argon` via OpenRouter;
  Haiku `claude-haiku-5-5` via Anthropic. Mesmos parâmetros dos pilotos:
  effort high, sem sampling, 8.192 tokens Terra/Haiku, 32.768 Argon.
- System literal do harness e uma questão por requisição. Nenhuma ferramenta,
  histórico, few-shot, continuação ou fallback. Timeout Terra 300s, Haiku 180s,
  Argon 900s. No máximo três requests simultâneos por combinação.
- Usar runner e scorer canônicos, incluindo sua política de retries de
  falhas transitórias. Persistir toda tentativa e raw imediatamente. Não
  retry de parsing/truncamento. Interromper a combinação nesses casos, após
  salvar a resposta e aguardar as chamadas em voo. Não ajustar parâmetros
  com base em acertos. Falhas operacionais não serão publicadas como score.
- Resume somente com raws válidos e parâmetros idênticos. Não iniciar nova
  invocação automaticamente após falha fatal. Sem sobrescrever score existente.
- Publicar scored JSON somente após cobertura completa (246/252 respostas),
  três runs por questão e todos os ledgers ligados aos raws por attempt ID.
- Cadastro separado por rota, fontes primárias para release/cutoff/preço.
  Terra tem data exata de cutoff: 01/06/2026. Haiku publica apenas junho/2026;
  Argon, março/2026. Não inventar dias: campos de cutoff e source ficam
  undefined, com citação e explicação no comentário. Ambos permanecem unknown
  no scorer, sem fallback de release para APIs.
- Verificar que as três médias por run e o IC95% canônico acompanham o score.
  Auditar consumo, identidade resolvida, motivos de parada e referência USD.
  Tokens de raciocínio já pertencem à saída. Sem extrapolar consumo ausente.
- O custo dos pilotos extrapolado ao lote é aproximadamente US$ 7,74, apenas
  uma referência de planejamento. Não é teto, pois questões e raciocínio
  variam. Usar consumo efetivo ao relatar o custo final.

## Fontes verificadas nesta sessão

- https://developers.openai.com/api/docs/models/gpt-6.1-terra:
  "Jun 01, 2026 knowledge cutoff".
- https://developers.openai.com/api/docs/changelog: "Oct 26", "Released
  GPT-6.1 Terra" na seção de 2026.
- https://platform.claude.com/docs/en/models/haiku-5-5/overview:
  "Training data cutoff | Jun 2026", "October 7, 2026". Preço para prompts
  até 100.000 tokens: US$ 0,10 de entrada e US$ 0,50 de saída por milhão.
- https://deepmind.google/models/model-cards/gemini-4-argon/:
  "The knowledge cutoff for Gemini 4 is March 2026".
- https://ai.google.dev/gemini-api/docs/changelog: 13/10/2026, "Gemini 4 Argon
  (`gemini-4-argon`) generally available (GA)".
- https://openrouter.ai/api/v1/models: IDs exatos dos dois modelos, preços e
  parâmetros suportados. Reconsultar preços antes do cadastro.

## Próximos passos

1. Concluído: cadastro com testes de procedência e executor operacional que
   recusa repetir um lote existente. Retomada exige revisão explícita.
2. Verificações locais passaram. Lote iniciado em background em 04/11/2026.
   Log local: `shortlist-full-evaluations.log` no diretório temporário OpenCode.
   Processo encerrado com código 1: cinco combinações concluídas; Argon em
   2026/1 interrompido após 45 respostas, uma vazia com `stopReason=error`,
   parsing null e usage explicitamente zero. Nenhum scored JSON dessa combinação.
3. Concluído: auditoria dos seis artefatos, cadastro e documentação.
4. Aprovação específica antes de novo commit e PR. Este lote não altera PRs #90/#91.

## Auditoria preparada

Após o encerramento do processo, executar offline:

```bash
node packages/eval-harness/scripts/audit-shortlist.mjs --refresh-max
```

O auditor exige os seis scores completos, valida cada parâmetro de request,
resposta, identidade resolvida, vínculo ao ledger, cobertura e score recalculado.
Também calcula as três precisões por run e confirma sua média. `--refresh-max`
adiciona somente o máximo de entrada observado em usage, mantendo todos os
demais campos idênticos. Isso permite usar a faixa de custo quando o PR #90
for integrado, sem depender da soma dos prompts. Sem usage completo, o campo
não é adicionado e o custo fica desconhecido.

Enquanto Argon 2026/1 estiver incompleto, usar `--completed-only` para auditar
os cinco scores disponíveis. O relatório marca a combinação ausente como
incompleta, sem métricas ou estimativas extrapoladas; não publica score parcial.
A retomada paga foi autorizada e concluída conforme a seção final. Todas as
tentativas, inclusive a resposta com erro, permanecem preservadas.

## Resultado auditado do lote interrompido

Os cinco scores completos foram recalculados dos raws e comparados campo a
campo, preservando votos e métricas. A média das três runs coincide com o
score canônico; o intervalo abaixo é o Wilson de 95% do harness.

| Modelo    | Edição | Média | IC95%      | Referência USD |
| --------- | ------ | ----: | ---------- | -------------: |
| Terra     | 2025/2 | 94,7% | 91,2–96,9% |       0,237767 |
| Terra     | 2026/1 | 98,0% | 95,4–99,1% |       0,247642 |
| Haiku 5.5 | 2025/2 | 80,5% | 75,1–85,0% |      0,0972153 |
| Haiku 5.5 | 2026/1 | 75,4% | 69,7–80,3% |      0,1038699 |
| Argon     | 2025/2 | 98,8% | 96,5–99,6% |       3,650458 |

Terra 2025/2 é `likely-contaminated` e 2026/1 é `likely-clean` pelo cutoff
exato publicado. Haiku e Argon permanecem `unknown` conforme a limitação de
precisão do cutoff documentada acima.

Foram recebidas 1.287 respostas HTTP bem-sucedidas, incluindo a resposta de
erro do Argon: 1.286 com parsing válido e uma vazia. Não houve erro HTTP ou
retry no ledger. O Argon incompleto tem 45 registros, 44 válidos. Faltam 207
pares questão/run nunca chamados; repetir o par com erro seria uma chamada
adicional, não um dos 207 pares ausentes. Essa decisão não foi automatizada.

O erro pertence a `revalida-2026-1-q22`, run 2, attempt
`127126cd-621b-40ea-add2-4a20fc71bdf8`, geração OpenRouter
`gen-1793800107-2VWpTD9q85aammYnCcVh`. A API reportou modelo e provedor
corretos, `finish_reason=error`, texto vazio e todos os contadores de usage
iguais a zero. A causa detalhada não foi preservada no adapter atual.

Custo de referência dos cinco scores: **US$ 4,3369522**. As 45 chamadas
do Argon 2026/1 somam 14.143 tokens de entrada e 63.945 de saída, equivalentes
a **US$ 0,667736** pela tabela registrada. Total operacional de referência
deste lote: **US$ 5,0046882**, sem pilotos. Não é fatura; o zero de usage da
resposta com erro é declaração da API, não comprovação independente de cobrança.

Os cinco scores receberam apenas o máximo derivado em usage após a auditoria:
Terra 420/468, Haiku 680/785 e Argon 456 tokens de entrada por chamada.
Isso confirma as faixas de preço usando a correção integrada pelo PR #90.
PRs #90 e #91 foram mesclados após duas conferências sem comentários; o
worktree desta avaliação foi preservado e atualizado sobre main, sem novas
chamadas pagas ou commits nesta etapa de auditoria.

## Retomada Argon autorizada em 04/11/2026

O mantenedor autorizou 208 chamadas: 207 pares ausentes e uma nova tentativa
para a falha operacional. Não repetir respostas com parsing válido, mesmo
quando incorretas. Manter esforço, limite de tokens, rota e prompt idênticos.

- Preservar cópias byte a byte dos 45 raws e das 45 tentativas originais em
  arquivos `*.interrupted.*.jsonl`, sem remover ou editar a falha.
- Manifesto `*.resume.jsonl` documenta hashes SHA-256 dos arquivos originais,
  a autorização e a única exclusão: attempt ID
  `127126cd-621b-40ea-add2-4a20fc71bdf8`, questão 22/run 2, texto vazio,
  parsing null, `stopReason=error`. Nenhuma exclusão baseada em acerto.
- O raw canônico passa a ser a visão aceita: 44 respostas válidas anteriores
  mais as respostas novas. O ledger canônico permanece append-only com as
  45 tentativas anteriores e todas as novas, inclusive a falha preservada.
- Três chamadas simultâneas no máximo, sem retries automáticos nesta retomada.
  Limite de 208 chamadas HTTP novas. Parar na primeira falha e aguardar as
  chamadas em voo para persistir sua auditoria. Não retomar outra vez sozinho.
- Validar protocolo e identidade de todas as respostas, preservar hashes e
  vínculo raw/ledger. Gerar score apenas se os 252 pares estiverem completos
  com parada normal. Auditar a tentativa adicional excluída pelo manifesto,
  sem tratá-la como resposta pontuada nem esconder seu consumo operacional.
- Testar o seletor de retomada: falha exata, preservação de respostas válidas
  incorretas, rejeição de duplicatas, exclusões inesperadas e falta no ledger.

Executor: `packages/eval-harness/scripts/resume-argon.mjs`. O dry-run
confirmou 44 respostas preservadas e 208 chamadas novas. Cinco testes do
seletor passaram antes de iniciar a retomada em background. O auditor foi
estendido para verificar os hashes dos arquivos interrompidos, o prefixo
inalterado do ledger e a única tentativa não pontuada, em vez de exigir
erroneamente que toda resposta HTTP bem-sucedida esteja no score.

## Fechamento da retomada

As 208 chamadas autorizadas terminaram sem falhas, parsing inválido ou
truncamento. A matriz final contém 252 pares únicos com três runs por questão.
O ledger tem 253 tentativas e conserva seu prefixo original byte a byte.
Hashes dos arquivos interrompidos conferem com o manifesto. As 44 respostas
anteriores aceitas são idênticas às originais, inclusive as incorretas.

Argon em Revalida 2026/1: **98,8%**, IC95% Wilson **96,6–99,6%**.
Cada uma das três runs teve 83 acertos em 84 questões. Consumo aceito:
76.815 tokens de entrada e 381.551 de saída, dos quais 261.560 de raciocínio,
já incluídos na saída. Máximo de entrada por chamada: 512 tokens. Custo de
referência dessa combinação completa: **US$ 3,969140**. O consumo adicional
da retomada representa US$ 3,301404 pela mesma tabela.

| Modelo           | Revalida 2025/2 | Revalida 2026/1 | Referência USD, duas edições |
| ---------------- | --------------: | --------------: | ---------------------------: |
| GPT-6.1 Terra    |           94,7% |           98,0% |                     0,485409 |
| Claude Haiku 5.5 |           80,5% |           75,4% |                    0,2010852 |
| Gemini 4 Argon   |           98,8% |           98,8% |                     7,619598 |

Total de referência das seis avaliações: **US$ 8,3060922**. Incluindo os
pilotos dos três candidatos (US$ 0,1242584), a referência desta onda é
**US$ 8,4303506**, sem taxas, câmbio, créditos ou descontos presumidos.
Não é uma fatura. O ledger inclui o zero de usage declarado para a tentativa
de erro, que não prova independentemente ausência de cobrança.
As falhas nativas HTTP 401/402 dos pilotos não declararam usage; sua eventual
cobrança continua desconhecida e não foi preenchida com zero nesse total.

O auditor offline passou para as seis combinações com validação integral
de protocolo, score recalculado, três precisões por run, consumo e identidade.
Testes de integração também cobrem a preservação dos originais e a única
exclusão operacional autorizada.
