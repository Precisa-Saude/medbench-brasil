# Contaminação de treino

## O problema

Todas as provas do Revalida são publicadas pela INEP e estão indexadas publicamente. É praticamente certo que fazem parte do corpus de treino de todo modelo de fronteira. Não é possível eliminar essa contaminação; é possível e obrigatório **medi-la e reportá-la com transparência**.

## Classificação por edição

Para cada modelo, cada edição é classificada em:

- **`likely-clean`** — edição publicada após o corte de treino declarado do modelo
- **`likely-contaminated`** — edição publicada antes ou na mesma data do corte
- **`unknown`** — corte de treino não declarado pelo fornecedor

A implementação está em `packages/dataset/src/contamination.ts`.

## Reporte duplo obrigatório

Toda visualização no site apresenta o escore nos dois recortes quando ambos existem:

- precisão em edições limpas (medida mais confiável de capacidade real)
- precisão em edições contaminadas (baseline histórico, útil para comparação com estudos anteriores)

A diferença entre os dois é um dado em si: mede o quanto memorização infla o escore.

## Cortes de treino dos modelos

Declarados nos módulos por fornecedor em `site/src/data/model-registry/` (agregados pelo barrel `site/src/data/models.ts`) como `trainingCutoff` (ISO `YYYY-MM-DD`) e `trainingCutoffSource` (URL). A fonte é **obrigatoriamente** um artefato publicado pelo fornecedor: docs de API, model card no Hugging Face, technical report no arXiv ou release notes oficiais. A citação verbatim fica no comentário acima da entrada.

Quando o fornecedor não publica o corte, `trainingCutoff` e `trainingCutoffSource` ficam `undefined`. Nesse caso, todas as edições são classificadas como `unknown` — **não estimamos**. É mais honesto não classificar do que inventar um recorte que vira base para o gráfico de contaminação.

No momento desta versão, ficam `undefined`:

- Mistral (Large 2411, Large 3/2512) — o `SYSTEM_PROMPT.txt` dos repos HF cita "2023-10-01" de forma idêntica até no Large 3 (Dez 2025); é boilerplate, não cutoff real. Blog Mistral e docs da API não publicam.
- Qwen (3, 3.5, 3.6, 3.7) — blog Qwen, model cards HF e tech reports não declaram cutoff para nenhum modelo da família Qwen3+. Confirmação secundária (não autoritativa): o repositório [HaoooWang/llm-knowledge-cutoff-dates](https://github.com/HaoooWang/llm-knowledge-cutoff-dates) também lista Qwen3 como "Unknown / TBD" e "Mistral series" como "unknown"; uma snapshot via Wayback Machine deve ser anexada a uma issue antes de qualquer ajuste baseado nessa referência, já que o repo pode mudar ou sumir.
- DeepSeek (V3-0324, V3.1, V4 Pro) — nenhum declara cutoff próprio; ver a nota sobre o V3-Base mais abaixo. O model card do V4 Pro cita "more than 32T diverse and high-quality tokens", mas volume de corpus não é data de corte.
- Gemini 3.6 Flash — nem a página do modelo nem o changelog da Gemini API publicam knowledge cutoff (verificado em 2026-08-03), ao contrário do Gemini 2.5 Pro e do 3.1 Pro, que declaram "January 2025".
- Kimi K3 (Moonshot AI) — o model card no HF documenta a liberação dos pesos sob a Kimi K3 License, mas não declara cutoff nem as fontes dos dados de treino.

### Por que não usamos auto-declaração do modelo

Tentamos, por rigor, perguntar direto a cada um dos cinco modelos "What is your knowledge cutoff date?" via OpenRouter (abr/2026). O resultado:

- **Mistral Large 2411**: "October 2023" — idêntico ao boilerplate do SYSTEM_PROMPT.txt.
- **Mistral Large 3 (2512)**: "October 2023" — impossível, o modelo foi lançado em Dez/2025 e se reconhece como Large 3. Confirma que o valor é recitado do system prompt, não um cutoff real.
- **Qwen 3 235B**: "October 2024" — resposta firme mas não auditável contra doc oficial.
- **Qwen 3.5 122B** e **Qwen 3.6 Plus**: "2026" — ano apenas, preciso demais para contaminação (precisamos comparar com `publishedAt` de edições individuais).

Auto-declaração não substitui documentação: é comportamento treinado, repete system prompts ou alucina. Ficamos com `undefined`.

A Anthropic publica dois cutoffs por modelo: **training data cutoff** (janela ampla do corpus) e **reliable knowledge cutoff** (data até onde o conhecimento é "most extensive and reliable"). Usamos o training data cutoff por ser o mais conservador para contaminação — qualquer dado dentro da janela pode ter sido memorizado.

Na DeepSeek, o único corte oficial é o do V3-Base (jul/2024), atestado no paper do DeepSeek-R1 (arXiv:2501.12948) ao justificar a decontaminação do R1. Esse valor vale **apenas para o R1**: não é herdado pelos snapshots V3-0324 e V3.1, porque ambos passaram por etapas posteriores com dados de data não divulgada — pós-treinamento no 0324, extensão de long-context com "additional long documents" no 3.1. Herdar o corte da base subestimaria a janela real de memorização, então esses snapshots ficam `undefined`, como registrado em `model-registry/open-weights.ts`.

## Alterando um cutoff

Ao mudar `trainingCutoff` de um modelo, o `contaminationSplit` já persistido em `results/<edição>/<modelo>.json` fica desatualizado — ele é computado no momento do scoring. Rode:

```bash
medbench rescore --from-raw --edition <id> --model <modelId> --cutoff <nova-data>
```

Para cada edição com raw.jsonl disponível. Omita `--cutoff` quando o novo valor for `undefined` (resulta em `unknown`).

## A vantagem do benchmark vivo

A cada nova edição publicada pela INEP, o conjunto de provas limpas cresce para todos os modelos avaliados antes daquela data. Com o tempo, as edições mais recentes (2–3 últimas) tornam-se os números de referência e as antigas viram baseline histórico de contaminação.

## Canary tests (roadmap v2)

Para v2, planejamos três testes adicionais (opcional, por modelo):

1. **Completion test** — dar os primeiros 10–15 tokens do enunciado e pedir o restante; reprodução verbatim indica contaminação forte
2. **Shuffled options** — reordenar A/B/C/D; queda grande de precisão sugere memorização posicional
3. **Paraphrase** — reformular enunciado preservando conteúdo clínico; queda sugere memorização sobre compreensão

Os resultados desses testes serão publicados por modelo e por edição quando implementados.
