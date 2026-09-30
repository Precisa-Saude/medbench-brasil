# Metodologia

## Objetivo

Medir, de forma reproduzível e honesta, o desempenho de modelos de linguagem em questões de provas médicas brasileiras (Revalida primeiro; ENAMED/ENARE e afins em roadmap).

## Protocolo de inferência

1. **Zero-shot**. Uma questão por requisição HTTP. Sem histórico, sem few-shot, sem qualquer contexto de outras questões.
2. **Sem ferramentas**. Nenhuma chamada a `tools`, `connectors`, navegação web, execução de código ou recuperação de documentos.
3. **System prompt fixo e literal**:
   > Responda a seguinte questão de múltipla escolha selecionando a letra correta (A, B, C ou D).
4. **Três execuções por modelo**. Reportamos média e intervalo de confiança 95% (Wilson score), calculado sobre questões independentes (não replicadas).
5. **Temperatura 0** e `max_tokens` mínimo necessário para emitir a letra. Todos os parâmetros são registrados em `results/<modelo>/<edição>/run-<n>.jsonl`.
6. **Modelos locais** (vLLM, Ollama): modo completion puro, sem scaffolding de ferramentas.
7. **Nível de esforço fixo em `high`** nos modelos que expõem o parâmetro, registrado em cada artefato. O default do fornecedor nunca é usado.

### Por que o esforço é fixado

Alguns fornecedores expõem um controle de quanto o modelo "pensa" antes de responder. Na Anthropic é `output_config.effort`, com cinco níveis (`low`, `medium`, `high`, `xhigh`, `max`).

O problema é que **o default varia entre modelos da mesma família**. A Anthropic documenta `high` como default em todos os modelos que aceitam o parâmetro, exceto o Claude Opus 5.5, que usa `medium`. Nas palavras da própria documentação, "a request that omits effort runs one level lower than it did on Claude Opus 5". Uma requisição que simplesmente omite o parâmetro mede modelos diferentes sob esforços diferentes, o que quebra a comparabilidade que o [ADR 0002](development/adr/0002-integridade-do-benchmark.md) existe para garantir.

Fixamos em `high` porque é o default de 8 dos 9 modelos Anthropic do roster. Como a documentação garante que "setting effort to the model's default produces exactly the same behavior as omitting the parameter", fixar `high` deixa esses oito com comportamento idêntico ao que já havia sido medido, e altera apenas o Opus 5.5, que rodava um nível abaixo dos demais.

O valor efetivo vai para o `requestParams` de cada registro, de modo que é possível auditar depois sob qual esforço um número foi medido. Modelos que não aceitam o parâmetro (gerações anteriores, Haiku) não o recebem, porque enviá-lo devolveria erro 400.

Alterar esse nível exige ADR, como qualquer outro parâmetro do protocolo canônico. Ver [#73](https://github.com/Precisa-Saude/medbench-brasil/issues/73).

#### Uma exceção de rota, registrada: Opus 5.5 na ENAMED 2026

O Claude Opus 5.5 é o único modelo Anthropic desta edição medido **via OpenRouter**, e não pela rota direta. Os outros oito foram medidos direto. A causa é prosaica: os créditos da conta Anthropic acabaram no meio da remedição com esforço fixado, e a rodada terminou pela OpenRouter em vez de ficar com o número antigo, medido em `medium`.

Pela OpenRouter o controle chega como `reasoning_effort` (estilo OpenAI), não como `output_config.effort`. Que o parâmetro de fato alcança o controle do fornecedor foi verificado na mão antes da rodada: no mesmo prompt, `low` devolveu 0 tokens de raciocínio e `high` devolveu 13, ou seja o parâmetro não é aceito e ignorado. `max_tokens` (8192) e `temperature` (0) são idênticos nas duas rotas para este modelo.

O que **não** se pode concluir: que a diferença entre a medição antiga (87,8%, esforço `medium`, rota direta) e a nova (89,4%, esforço `high`, OpenRouter) se deva ao esforço. Duas variáveis mudaram junto, e os intervalos de confiança das duas medições se sobrepõem amplamente, e a diferença de 1,6 pp não é distinguível de ruído nesta prova. O registro existe para que ninguém leia o par como um experimento controlado de esforço.

## Modelos de decisão

Parte dos modelos do roster não gera texto. Recebem um estado e uma pergunta
tipada, e devolvem a alternativa escolhida junto de um vetor de probabilidades
sobre A, B, C e D, num único passe. No leaderboard aparecem com o selo
**decisão**.

O que muda:

- Não há parsing de letra, porque a alternativa vem em campo próprio. Os modos
  de falha do `parseLetter` não se aplicam.
- `max_tokens` e `temperature` não existem neste protocolo e ficam gravados
  como `n/a`, para separar "não se aplica" de "não registramos".
- O vetor de probabilidades é persistido por questão, o que permite recalcular
  calibração depois. Nenhum provider generativo do roster expõe esse dado.

O que continua igual: o texto do system prompt vai literal no campo de
instruções, as quatro alternativas mantêm a ordem que o modelo generativo vê,
e valem uma questão por requisição, três execuções e nenhuma ferramenta.

A decisão completa está no [ADR 0004](development/adr/0004-modelos-de-decisao.md),
incluindo o formato verificado na API, a regra de fixar versão em vez de usar
alias móvel e o motivo de o Laya ficar fora da tabela, servindo de controle de
protocolo.

## Parsing da resposta

- Extraímos a primeira letra (A, B, C, D) do output bruto com regex case-insensitive, tolerando ruído
- Respostas sem letra reconhecível contam como incorretas (nunca como ausência)
- Registramos tanto `rawResponse` quanto `parsedAnswer` no log da execução

## Exclusões

Por padrão, excluímos do scorer:

- Questões com imagens ou tabelas (marcadas com `hasImage`/`hasTable` no dataset)
- Questões anuladas oficialmente pela INEP

O dataset bruto mantém todas as questões — a exclusão é responsabilidade do scorer, configurável.

## Publicação dos resultados

Para cada modelo avaliado, publicamos em `results/`:

- `results/<modelo>.json` — output agregado (`EvaluationResult`)
- `results/<modelo>/<edição>/run-<n>.jsonl` — log linha-a-linha, uma questão por linha

Nenhum resultado é publicado sem os três logs completos disponíveis para auditoria.

## Métricas reportadas

Para cada par (modelo, edição) calculamos:

- **Precisão** (accuracy) — fração de questões com resposta majoritária correta (voto entre as 3 runs).
- **IC 95%** — Wilson score interval, mais confiável que o método normal em valores próximos a 0 ou 1.
- **Macro-F1** — média não ponderada do F1 por classe (A/B/C/D), detecta viés de classe quando N é pequeno. Reportada lado a lado com accuracy, como em Correia et al. (PROPOR 2026).
- **passesCutoff por edição** — flag booleana (accuracy ≥ nota de corte oficial). Expõe no leaderboard a razão `aprova = X/Y edições`.
- **Split por contaminação** — precisão em edições posteriores vs. anteriores ao corte de treino declarado pelo fornecedor. Delta positivo sugere memorização.
- **Conceito Enade 1–5** — métrica agregada por edição, tratando o conjunto de modelos avaliados como uma "turma de egressos". Mapeamento oficial do MEC:

  | Nível | Fração aprovada |
  | ----- | --------------- |
  | 1     | < 40%           |
  | 2     | 40% – 59%       |
  | 3     | 60% – 74%       |
  | 4     | 75% – 89%       |
  | 5     | ≥ 90%           |

  Aplicação direta do procedimento de Correia et al. (PROPOR 2026, secção 5.3), que usa a mesma tabela adotada pelo MEC para avaliar cursos de medicina.

- **Erros de consenso** — questões em que ≥ 80% dos modelos reprovados convergem para o mesmo distractor. Útil para identificar vieses sistemáticos (e.g., protocolos internacionais competindo com diretrizes do SUS). Comando `medbench report --edition <id> --consensus-errors`.

## Comparação com Correia et al. (PROPOR 2026)

O paper "Class of LLMs" (Correia et al., PROPOR 2026) é a referência metodológica mais próxima do medbench-brasil — também avalia LLMs no ENAMED 2025. Registramos aqui as divergências deliberadas:

| Dimensão             | medbench-brasil                                   | Correia et al.                                   |
| -------------------- | ------------------------------------------------- | ------------------------------------------------ |
| Prompt               | Instrução mínima, sem persona, sem JSON           | "Você é um médico especialista…" + JSON estrito  |
| Runs por modelo      | 3 + IC 95% (Wilson)                               | 1 (single-run)                                   |
| Split contaminação   | Por edição × corte de treino                      | Não reportado                                    |
| IRT Rasch 1PL        | Planejado (Question type já aceita `difficulty`)  | Implementado (parâmetros `b` oficiais do INEP)   |
| Cobertura de modelos | Proprietários recentes e open-weight generalistas | Inclui fine-tunes médicos (MedGemma, Bode, etc.) |

Por que o prompt minimalista? O CLAUDE.md deste repositório trata o system prompt como uma garantia **inegociável** do benchmark: mudar para persona ou JSON estrito alteraria o sinal entre modelos (alguns seguem JSON melhor que outros) e introduziria uma dependência na capacidade de instrução, que queremos isolar do conhecimento médico. A decisão do paper é diferente e igualmente válida no contexto deles.

Por que 3 runs? Reduz variância em modelos com temperature efetiva > 0 e permite relatar IC 95%. O voto majoritário por questão é usado como predição única nas métricas por classe (Macro-F1).
