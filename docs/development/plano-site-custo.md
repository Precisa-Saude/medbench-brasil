# Preços e estimativas no site

## Objetivo

Executar a fase 3 do plano de custo, após PR #87: registry com preços
verificados, estimativas derivadas, coluna de custo e scatter com Pareto.
Sem chamadas pagas, backfill de tokens ou alteração de resultados históricos.

## Estado atual

Worktree `feat/site-custo`, baseado em `main` após publicação 2.4.0.
Fontes oficiais de Anthropic, OpenAI, Google, Maritaca e catálogo público
OpenRouter abertas em 03/11/2026. A skill `dataviz` referida pelo plano
não está disponível neste ambiente; o gráfico seguirá os componentes
Recharts existentes, com descrição textual e tabela acessível.

Implementação: 30 IDs com tarifa de referência; estimativas por edição e
escopo; coluna ordenável; Pareto por edição e metodologia com fontes.
O registro atual de resultados não tem usage histórico, então a UI mantém
lacunas e estado vazio, sem gerar dados substitutos.

Verificação visual pendente: o CLI `superset` não está instalado neste
ambiente e o lançamento detached do dev server não ficou acessível.
Testes de renderização server-side verificam coluna, estado vazio, tabela
textual e fontes com fixtures, sem publicar resultados sintéticos.

## Especificação

- Preços são tarifas padrão de referência, em USD por milhão de tokens,
  sem cache/batch, não cobrança histórica nem fatura da rota executada.
  Fonte, citação literal, fornecedor de referência e data são obrigatórios.
  Todos os campos numéricos e de procedência existem juntos ou ficam ausentes.
- Reutilizar preços somente para o ID exato verificado. Não incluir modelos
  novos no roster nesta mudança, nem alterar cutoffs de treinamento.
  Preços publicados apenas em BRL não serão convertidos sem fonte cambial.
- Preços promocionais têm validade conservadora explícita. Quando a fonte
  publica faixas por tamanho do prompt, usar a faixa somente se o agregado
  de entrada inteiro não ultrapassa seu limite: é uma condição suficiente
  de que cada chamada cabe nessa faixa, sem inferir máximo pela média.
  Caso contrário, o custo fica desconhecido até haver dados por requisição.
- Persistir preços fora de `results/`, nos módulos de registry. USD só
  é calculado em memória/build. Raciocínio já pertence à saída; não somar
  cache ou reasoning novamente. Não usar tarifas de API para controles locais.
- Custo por questão inclui as três execuções. Custo por resposta é também
  derivado para tornar a unidade explícita. Dividir pelo número de questões
  representadas (`total / runsPerQuestion`), não confundir questão e chamada.
- Uso incompleto, números inválidos, score parcial, preço sem fonte,
  faixa de contexto desconhecida ou preço expirado não produzem custo zero.
  Agregação de edições só fornece custo completo se todas possuem consumo.
- Separar estimativas por edição e escopo de contaminação. Um escopo que
  corta parte das chamadas dentro de um artefato não tem custo recuperável
  pelo agregado. Nunca parear acurácia limpa com consumo de provas contaminadas.
- Coluna ordenável com lacunas sempre no fim e tooltip de procedência/unidade.
  Mostrar o traço existente da UI para desconhecido, sem inventar estimativas.
- Scatter: uma edição por vez, filtro de contaminação igual ao ranking,
  custo positivo em escala log, acurácia em %, Pareto observada destacada.
  Empates exatos pertencem à fronteira; domínio em todos os eixos com pelo
  menos uma melhora define dominância. Não alegar significância estatística.
  Custos zero verdadeiros aparecem na descrição/tabela, fora do eixo log.
- Sem dados reais de usage ainda, renderizar estado vazio honesto. Fixtures
  sintéticas validam pontos e fronteira, sem publicar dados inventados.

## Próximos passos

1. Concluído: tipos e preços com citação junto a cada entrada.
2. Concluído: funções puras de custo/agregação/escopo e testes de borda.
3. Concluído: coluna, scatter e metodologia com fontes e limitações.
4. Concluído: 296 testes do monorepo, lint/typecheck, formatação e build do site.
   Helpers de custo e Pareto com 100% de cobertura no teste focado. O build
   mantém aviso de chunks grandes; nenhum limite foi afrouxado. Inspeção visual
   depende de browser disponível e continua pendente.
5. Pedir aprovação antes de commit; nova PR separada da ingestão Revalida.

## Contexto

Fontes e preços não são automaticamente herdados de sucessores/antecessores.
A seleção de sucessores para as próximas avaliações continua no plano
Revalida. Estimativas de tabela não incluem retries, smoke ou tentativas
sem resposta: essas despesas dependem dos ledgers e conciliação do fornecedor.
