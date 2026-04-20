# @precisa-saude/medbench-harness

Harness reproduzível de avaliação de LLMs em provas médicas brasileiras.

---

## Sobre

Pipeline de avaliação que roda uma questão por requisição HTTP, três execuções por modelo, sem ferramentas, sem few-shot, com log bruto (`raw.jsonl`) persistido para re-scoring determinístico. Acompanha providers para Anthropic, OpenAI, Google e qualquer backend compatível com a API do OpenAI (Ollama local, Maritaca, Together, OpenRouter).

É o pipeline por trás do leaderboard em [medbench-brasil.ia.br](https://medbench-brasil.ia.br). Depende de [`@precisa-saude/medbench-dataset`](https://www.npmjs.com/package/@precisa-saude/medbench-dataset).

## Garantias de integridade

Seguem literalmente o [ADR-0002](https://github.com/Precisa-Saude/medbench-brasil/blob/main/docs/development/adr/0002-integridade-do-benchmark.md) — alterar qualquer uma exige novo ADR e aprovação do mantenedor:

1. **System prompt literal e fixo**: `Responda a seguinte questão de múltipla escolha selecionando a letra correta (A, B, C ou D).`
2. **Single-turn absoluto** — uma questão por requisição, sem histórico, sem few-shot, sem contexto de outras questões.
3. **Zero tools, zero connectors, zero web search, zero code interpreter, zero RAG** em qualquer provider.
4. **Três execuções independentes** por modelo; intervalo de confiança 95% pelo método de Wilson.
5. **Todos os parâmetros de API registrados** em `results/<edition>/<model>.raw.jsonl` (uma linha por requisição).
6. **Modelos locais em completion puro**, sem scaffolding de ferramentas.

## Instalação

```bash
pnpm add @precisa-saude/medbench-harness
# ou
npm install @precisa-saude/medbench-harness
```

A CLI fica disponível como o binário `medbench`. Requer Node ≥ 20.

## Uso como CLI

Dois subcomandos: `smoke` (pré-flight, ~8 amostras estratificadas) e `eval` (run completo).

### `medbench smoke` — validação de provider e parser

Sempre rode antes de queimar créditos num modelo novo: valida que o provider responde e que o parser reconhece o formato emitido. Aborta com código não-zero se a taxa de parse correto fica abaixo do threshold.

```bash
medbench smoke \
  --backend anthropic \
  --model claude-opus-4-7 \
  --edition revalida-2025-1 \
  --samples 8 \
  --threshold 0.7
```

### `medbench eval` — avaliação completa

```bash
medbench eval \
  --backend openrouter \
  --model google/gemini-3.1-pro-preview \
  --cutoff 2025-11-01 \
  --edition revalida-2025-1 \
  --runs 3
```

### Flags

Comuns a `smoke` e `eval`:

| Flag            | Valor                                                                                       | Padrão                |
| --------------- | ------------------------------------------------------------------------------------------- | --------------------- |
| `--backend`     | `anthropic` \| `openai` \| `google` \| `ollama` \| `maritaca` \| `together` \| `openrouter` | **obrigatório**       |
| `--model`       | identificador do modelo (ex.: `claude-opus-4-7`, `gpt-5`, `google/gemini-3.1-pro-preview`)  | **obrigatório**       |
| `--edition`     | `revalida-2025-1`, `revalida-2024-2`, etc.                                                  | `revalida-2025-1`     |
| `--label`       | nome legível exibido no site                                                                | derivado do modelo    |
| `--cutoff`      | data de corte de treino do modelo (`YYYY-MM-DD`)                                            | —                     |
| `--concurrency` | requisições simultâneas                                                                     | 10 (APIs), 1 (ollama) |
| `--apiKey`      | chave explícita (sobrescreve variável de ambiente)                                          | —                     |
| `--baseUrl`     | endpoint custom (ollama, maritaca, together, openrouter)                                    | padrão do backend     |

Específicas de `eval`:

| Flag           | Valor                                    | Padrão     |
| -------------- | ---------------------------------------- | ---------- |
| `--runs`       | execuções por questão                    | `3`        |
| `--out`        | diretório de saída                       | `results/` |
| `--no-raw-log` | desabilita JSONL bruto                   | ativado    |
| `--restart`    | descarta JSONL prévio e recomeça do zero | retoma     |

Específicas de `smoke`:

| Flag          | Valor                                       | Padrão |
| ------------- | ------------------------------------------- | ------ |
| `--samples`   | número de questões estratificadas           | `8`    |
| `--threshold` | taxa mínima de parses corretos para aprovar | `0.7`  |

## Uso como biblioteca

```ts
import { runEvaluation, anthropicProvider, SYSTEM_PROMPT } from '@precisa-saude/medbench-harness';
import type { Provider, RunConfig } from '@precisa-saude/medbench-harness';

const provider = anthropicProvider({
  model: 'claude-opus-4-7',
  trainingCutoff: '2025-03-01',
});

const result = await runEvaluation(provider, {
  editions: ['revalida-2025-1'],
  runsPerQuestion: 3,
  concurrency: 10,
  excludeImages: true,
  excludeTables: true,
  onRawResponse: (record) => {
    // persista `record` onde quiser — ele tem requestParams, rawResponse, parsed, correct
  },
});

console.log(result.accuracy, result.ci95, result.contaminationSplit);
```

Se você só quer o system prompt literal (por exemplo, para citar no seu próprio site de metodologia), use a export secundária:

```ts
import { SYSTEM_PROMPT } from '@precisa-saude/medbench-harness/prompt';
```

### Exports

**Funções**: `runEvaluation`, `scoreRun`, `parseLetter`.
**Providers**: `anthropicProvider`, `openAiProvider`, `googleProvider`, `openAiCompatProvider` (usado por ollama, maritaca, together, openrouter).
**Constante**: `SYSTEM_PROMPT`.
**Tipos**: `Provider`, `ProviderResponse`, `RunConfig`, `EvaluationResult`, `RawResponseRecord`.

## Formato de saída

Cada `medbench eval` produz, em `results/<edition>/<model-slug>.*`:

- `<model>.json` — agregado com `accuracy`, `ci95`, `perQuestion[]`, `perSpecialty`, `contaminationSplit: { clean, contaminated }`, parâmetros da run.
- `<model>.raw.jsonl` — uma linha por requisição, com `requestParams` (inclusive system prompt verbatim), `rawResponse`, `modelId`, `editionId`, `questionId`, `run`, `elapsedMs`, `parsed`, `correct`. Re-scoring determinístico a partir deste arquivo.

## Variáveis de ambiente

Conforme o `--backend` escolhido:

| Backend      | Variável             |
| ------------ | -------------------- |
| `anthropic`  | `ANTHROPIC_API_KEY`  |
| `openai`     | `OPENAI_API_KEY`     |
| `google`     | `GOOGLE_API_KEY`     |
| `openrouter` | `OPENROUTER_API_KEY` |
| `maritaca`   | `MARITACA_API_KEY`   |
| `together`   | `TOGETHER_API_KEY`   |
| `ollama`     | — (roda local)       |

Carregadas automaticamente via `dotenv` a partir de `.env.local` (preferido) ou `.env` no `cwd` — não é preciso `export` no shell. Para começar, copie o [`.env.example`](https://github.com/Precisa-Saude/medbench-brasil/blob/main/.env.example) da raiz do repo para `.env.local` e preencha as chaves dos backends que vai usar.

## Licença

[Apache-2.0](https://github.com/Precisa-Saude/medbench-brasil/blob/main/LICENSE).

## Links

- **Site**: [medbench-brasil.ia.br](https://medbench-brasil.ia.br)
- **Repositório**: [github.com/Precisa-Saude/medbench-brasil](https://github.com/Precisa-Saude/medbench-brasil)
- **ADR-0002 (protocolo de integridade)**: [docs/development/adr/0002-integridade-do-benchmark.md](https://github.com/Precisa-Saude/medbench-brasil/blob/main/docs/development/adr/0002-integridade-do-benchmark.md)
- **Dataset**: [`@precisa-saude/medbench-dataset`](https://www.npmjs.com/package/@precisa-saude/medbench-dataset)
