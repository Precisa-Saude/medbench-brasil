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
