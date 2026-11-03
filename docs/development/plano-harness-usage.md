# Captura de consumo do harness

## Objetivo

Executar a primeira entrega do plano de custo aprovado: registrar consumo real
de tokens e tentativas, sem alterar requisições, parâmetros ou scoring.
Preços e interface do site seguem na segunda entrega do plano original.

## Estado atual

Primeira entrega implementada em `feat/harness-usage`, separada da ingestão
Revalida. Nenhuma chamada paga, commit ou push foi feito.

Validação: lint/typecheck do monorepo; testes e cobertura do pacote harness;
CLI completa contra servidor HTTP local sintético (smoke, eval, resume,
rescore, restart e `--no-raw-log`). O cenário local confirmou 255 respostas
por avaliação, zero chamadas novas no resume e ledger preservado no restart.
O comando avulso de cobertura na raiz inclui frontend e arquivos de configuração
e não alcança o limite global; a cobertura do pacote alterado passa sem mudar
limites ou exclusões.

## Especificação

- `TokenUsage`: entrada total incluindo cache, saída total incluindo raciocínio;
  detalhes opcionais de cache, reasoning e total declarado pelo fornecedor.
  Contadores ausentes ou inválidos não viram zero.
- Anthropic soma input não-cacheado com reads/writes; OpenAI mantém completion
  incluindo reasoning; Google inclui thoughts na saída. Guardar apenas campos
  conhecidos, nunca payload arbitrário de usage com segredos ou preços.
- Metadata de resposta: identidade resolvida, request ID, rota sanitizada,
  fornecedor resolvido e tier quando declarados.
- Cada tentativa de `eval` e `smoke` recebe UUID, timestamp e contexto;
  ledger separado e append-only registra sucesso/erro, inclusive retries.
  Erros HTTP preservam usage quando o fornecedor o devolve. Falhas sem usage
  continuam desconhecidas; não estimar cobrança invisível.
- Raw de sucesso referencia o UUID da tentativa. Resume não dispara evento
  novo para respostas reutilizadas. Rescore preserva consumo, sem cobrar
  novamente. Agregados de scoring descrevem somente respostas aceitas;
  ledger descreve tentativas, inclusive gastos em itens depois anulados.
- Agregados incluem cobertura. Detalhes opcionais só são somados quando
  presentes em todas as chamadas com usage. Artefatos antigos continuam
  sem usage. Nenhum backfill de tokens por comprimento de texto.
- CLI grava ledger em `results/<edition>/<model>.<purpose>.requests.jsonl`,
  mesmo com `--no-raw-log`. UUID de execução separa invocações e restart
  não trunca o ledger. Resumos distinguem uso novo e uso histórico do score.
- Preços ficam fora de `results/`; ADR 0005 distingue estimativa a preço de
  tabela, estimativa com descontos e cobrança conciliada do fornecedor.

## Próximos passos

1. Concluído: tipos, normalizadores por API e metadata, com fixtures sintéticas
   baseadas nos contratos oficiais.
2. Concluído: ledger por tentativa, integração no runner, smoke e CLI.
3. Concluído: agregação e preservação em resume/rescore; testes offline.
4. Concluído: ADR, README, atualização do plano de custo e verificações locais.
5. Próxima entrega: registry de preços datados, cálculo de USD e interface.
6. Antes do Revalida, selecionar sucessores por família/tier, sem backfill
   de modelos substituídos. Medir piloto somente após orçamento aprovado.

## Contexto

O plano original é `plano-custo-e-enquadramento.md`. Campos opcionais
preservam leitura de resultados antigos. Esta entrega reforça a auditoria
do ADR 0002 e não relaxa suas garantias.
