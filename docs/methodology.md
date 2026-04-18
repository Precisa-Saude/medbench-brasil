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
