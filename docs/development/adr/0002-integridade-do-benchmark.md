# ADR 0002 — Integridade do benchmark: protocolo canônico de inferência

**Data**: 2026-04-18
**Status**: Aceito

## Contexto

Leaderboards de LLM são facilmente invalidados quando o protocolo de inferência é frouxo: tool use, few-shot, histórico multi-turn, system prompts elaborados ou RAG transformam uma prova em uma tarefa diferente. O objetivo do medbench-brasil é medir capacidade zero-shot honesta; isso exige um protocolo rígido.

## Decisão

1. System prompt literal e fixo, definido em `packages/eval-harness/src/prompt.ts`
2. Single-turn absoluto, uma questão por requisição HTTP
3. Zero tools, connectors, web search, code interpreter ou RAG em qualquer provider
4. Três execuções independentes por modelo; IC 95% Wilson score
5. Todos os parâmetros de API registrados em `results/`
6. Modelos locais em modo completion puro, sem scaffolding

Qualquer alteração exige novo ADR e aprovação de mantenedor.

## Consequências

- Comparabilidade entre modelos e entre edições
- Custo de avaliação menor (uma chamada por questão, sem cache de contexto)
- Impossibilidade de usar modelos que só operam via agentic loops (aceitamos)
- Possível "penalização" de modelos de raciocínio que precisariam de mais tokens para pensar — documentamos essa limitação explicitamente
