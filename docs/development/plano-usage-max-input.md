# Máximo de entrada por chamada

## Objetivo

Liberar estimativas de custo com tarifa por faixa de contexto quando os raws
comprovam que todas as chamadas cabem na faixa, sem repetir inferências.

## Estado atual

Worktree `feat/usage-max-input`, baseado em `main` após PR #89.
Grok 4.7 tem consumo completo nas duas novas edições, mas a soma de entrada
ultrapassa 200 mil tokens. O site não pode deduzir o máximo pela média.

Implementado e validado: 317 testes, lint/typecheck, formatação, cobertura do
harness e build do site passaram. Os quatro artefatos receberam somente uma
linha adicional em usage, com máximos de 1.656/1.712 (Grok) e 680/785 (Opus).
Todos os demais campos e arquivos raw/ledger permaneceram intactos. Nenhuma
chamada paga foi feita nesta branch. Commit autorizado pelo mantenedor em
04/11/2026; publicação de PR pendente.

## Especificação

- `UsageSummary.maxInputTokensPerCall?: number`: máximo calculado dos
  contadores de entrada de cada resposta válida, incluindo cache.
- Publicar o campo somente quando todas as chamadas do agregado possuem
  usage válido. Em cobertura parcial ele fica ausente, sem extrapolação.
- Resume e rescore-from-raw calculam o máximo das respostas aceitas uma vez.
  Rescore de scored JSON apenas preserva o campo, sem tentar reconstruí-lo.
- Site usa o máximo quando presente e válido; ele deve ser inteiro não
  negativo, menor ou igual à soma e pelo menos a média arredondada para cima.
  Sem o campo, mantém o fallback conservador da soma inteira caber na faixa.
- Máximo acima da faixa permanece desconhecido, mesmo com média baixa.
- Regenerar os quatro scored JSONs de Revalida a partir dos raws já salvos.
  Verificar que apenas usage muda e que acurácia, IC95%, splits, votos e
  demais métricas permanecem idênticos. Nenhuma API será chamada para isso.
- O teste de regressão encontrou reordenação de arrays de runs em rescore
  completo após resume. A atualização dos artefatos existentes será somente
  de usage, validando cobertura e igualdade dos demais campos antes de gravar.
  Não corrigir a ordenação histórica nem outros comportamentos do scorer nesta PR.
- Não inserir USD nos artefatos, nem alterar requests, cutoffs ou protocolo.
- Pilotos do novo shortlist ficam em worktree/entrega separada, depois desta
  alteração, com parâmetros suportados verificados em fontes primárias.

## Próximos passos

1. Concluído: campo opcional, agregação e testes de cobertura completa/parcial/zero.
2. Concluído: validação do site e testes de fronteira, ausência e contradições.
3. Concluído: atualização offline de usage nos quatro resultados e integração.
4. Concluído: documentação e verificações locais.
5. Solicitar aprovação antes de commit; não iniciar lote pago nesta branch.

## Contexto

Os máximos auditados de Grok foram 1.656 (2025/2) e 1.712 (2026/1).
Esses números devem ser calculados novamente a partir dos raws, não copiados
para satisfazer a condição de preço. Artefatos antigos sem usage continuam
sem estimativa. Agregados com edições sem consumo continuam incompletos.
