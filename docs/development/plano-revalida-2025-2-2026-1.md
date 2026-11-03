# Revalida 2025/2 e 2026/1

## Objetivo

Adicionar as duas edições com gabarito definitivo do INEP e avaliar modelos
sem alterar o protocolo do benchmark. Definir orçamento antes das chamadas pagas.

## Primeiro lote concluído

As quatro avaliações terminaram após retomada de uma falha de DNS da
OpenRouter. As 996 respostas pontuadas têm usage, UUID de tentativa e
parâmetros completos. Auditoria confirmou matriz elegível × 3 runs sem
duplicatas ou exclusões, datasets com hashes inalterados, nenhuma resposta
sem parsing e nenhum truncamento declarado. Ainda não houve commit dos
datasets/resultados nem publicação no site.

| Modelo   | Edição | Precisão média | IC95%      | Referência de custo (USD) |
| -------- | ------ | -------------- | ---------- | ------------------------- |
| Grok 4.7 | 2025/2 | 95,1%          | 91,7–97,2% | 3,354690                  |
| Grok 4.7 | 2026/1 | 92,9%          | 89,0–95,4% | 3,558030                  |
| Opus 5.5 | 2025/2 | 91,5%          | 87,3–94,3% | 3,428632                  |
| Opus 5.5 | 2026/1 | 88,9%          | 84,4–92,2% | 3,638956                  |

Consumo observado das avaliações: **US$ 13,980308** à tarifa padrão
registrada. Com pilotos (US$ 0,046390) e estruturação (US$ 0,738441),
referência total: **US$ 14,765139**. Não é fatura: há sete tentativas com
falha e sem usage, de cobrança desconhecida, e não se aplicaram descontos
de cache ou outras condições comerciais.

As duas execuções de Grok tiveram no máximo 1.656 e 1.712 tokens de entrada
por chamada, respectivamente, verificados nos raws. Assim, todas cabem na
faixa de preço abaixo de 200 mil tokens. O agregado de tokens sozinho não
prova esse limite; por isso o site pode manter custo desconhecido para Grok
até preservar também o máximo por chamada no resumo. Não preencher USD nem
inventar esse metadado nos artefatos para contornar a limitação.

As edições 2025/2 estão classificadas como contaminadas e 2026/1 como limpas
pelos cortes atualmente registrados. Os IC95% se sobrepõem; a diferença
observada não deve ser apresentada como superioridade estatística conclusiva.

## Estado atual

Em 03/11/2026, os PDFs oficiais foram baixados pelo ingestor para
`scripts/data/raw/revalida-2025-2/` e `scripts/data/raw/revalida-2026-1/`,
com manifestos de procedência e hashes. Esses diretórios são ignorados pelo Git.
Os textos foram extraídos localmente. Em seguida, a estruturação via Haiku
4.5 realizou oito chamadas auditadas no diretório bruto. Os dois JSONs de
edição foram gerados e revisados; ainda não foram commitados/publicados.

Validação concluída: 100 questões por edição, 100 posições de cada gabarito
conferidas visualmente, todas as alternativas e enunciados comparados com o
texto oficial (tolerando espaços, aspas tipográficas e hifenização de linha).
Doze enunciados com diferenças de transcrição/diagramação foram repostos a
partir da fonte. As 800 alternativas não apresentaram divergências nessa
comparação. As flags foram conferidas nas páginas renderizadas; o modelo
extrator havia omitido imagens em ambos os cadernos e três tabelas de 2026/1.

- 2025/2: 7 anuladas, 4 imagens, 7 tabelas, 82 elegíveis, 246 chamadas/modelo.
- 2026/1: nenhuma anulada, 4 imagens, 12 tabelas, 84 elegíveis, 252 chamadas/modelo.

Os pilotos de Grok 4.7 e Opus 5.5 completaram duas questões cada com usage em
todas as respostas. Ambos acertaram uma das duas questões; esse piloto curto
valida transporte/parser, não estima desempenho. O primeiro lote completo foi
iniciado com esses dois sucessores nas duas edições: 996 chamadas canônicas,
três execuções por questão, concorrência 3. Opus usa a mesma rota OpenRouter,
requestModel e effort `high` já publicados na ENAMED 2026. Grok mantém seus
parâmetros publicados. Não há execução de versões anteriores para backfill.

Auditoria e retomada: `results/<edição>/<modelo>.raw.jsonl` e
`*.eval.requests.jsonl`; pilotos separados em `*.smoke.*.jsonl`. O script
operacional ignorado `scripts/data/raw/run-wave-1.mjs` registra o hash do dataset
antes de cada job e interrompe o lote se um job falhar, preservando os raws.

- [Índice INEP 2025](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/revalida/provas-e-gabaritos/2025)
- [Índice INEP 2026](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/revalida/provas-e-gabaritos/2026)
- [Caderno 1 de 2025/2](https://download.inep.gov.br/revalida/provas_e_gabaritos/2025_2_caderno_1_preliminar.pdf)
- [Definitivo de 2025/2](https://download.inep.gov.br/revalida/provas_e_gabaritos/2025_2_gabarito_caderno_1.pdf)
- [Caderno 1 de 2026/1](https://download.inep.gov.br/revalida/provas_e_gabaritos/2026_1_caderno_1_.pdf)
- [Definitivo de 2026/1](https://download.inep.gov.br/revalida/provas_e_gabaritos/2026_1_gabarito_definitivo_caderno1.pdf)

O texto digital do gabarito de 2026/1 está corrompido. OCR forçado produziu
letras legíveis, mas errou alguns números. As duas páginas foram conferidas
visualmente e transcritas; nenhum número de questão foi inferido do OCR.

## Modelos e volume

**Decisão do mantenedor (03/11/2026): priorizar sucessores nas novas edições,
sem buscar completude histórica.** Quando um modelo substituir outro no
leaderboard, avaliar o sucessor; manter resultados históricos do anterior
sem renomeá-los nem atribuí-los ao novo modelo. Preservar tiers e variantes
especializadas que respondem a perguntas diferentes. Confirmar substituições
explicitamente, sem inferir apenas pelo número da versão ou data de lançamento.

Exemplos dentro do registry atual: Opus 5.5 em vez dos Opus anteriores,
Fable 5.1 em vez de Fable 5, GPT-5.6 Sol em vez dos GPT-5 anteriores e
Grok 4.7 em vez de Grok 4.5. A seleção final também deve considerar os
candidatos da PRE-540, sem incluí-los automaticamente antes da validação.

Os artefatos existentes contêm 42 IDs de modelos, não 42 linhas de leaderboard:
Laya é um controle de protocolo deliberadamente excluído do registry.
Há 26 modelos com resultados de Revalida 2025/1. O inventário abaixo é
referência histórica, **não uma fila de execução para as novas edições**:

- Anthropic: `claude-opus-4-5`, `claude-opus-4-6`, `claude-opus-4-7`, `claude-opus-4-8`.
- OpenAI: `gpt-5.1`, `gpt-5.2`, `gpt-5.4`.
- Google: `gemini-2.5-pro`, `google/gemini-3.1-pro-preview`.
- DeepSeek: `deepseek/deepseek-chat-v3-0324`, `deepseek/deepseek-chat-v3.1`, `deepseek/deepseek-r1`.
- Meta: `meta-llama/llama-3.3-70b-instruct`, `meta-llama/llama-4-maverick`, `meta-llama/llama-4-scout`.
- Mistral: `mistralai/mistral-large-2411`, `mistralai/mistral-large-2512`.
- Qwen: `qwen/qwen3-235b-a22b-2507`, `qwen/qwen3.5-122b-a10b`, `qwen/qwen3.6-plus`, `mlx-community/Qwen2.5-14B-Instruct-bf16`.
- Maritaca: `sabia-3`, `sabia-4`, `sabia-4-thinking`.
- HUGO: `hugo/protocolos-clinicos-br-cpt-4gen-14b`, `hugo/protocolos-clinicos-br-rl-4gen-14b`.

Não rodar versões substituídas apenas para preencher a matriz de resultados.
A disponibilidade atual dos endpoints precisa de preflight. Novos modelos da
PRE-540 precisam de decisão explícita de roster e validação do protocolo.

Cada modelo exige `3 × (questões elegíveis de 2025/2 + questões elegíveis
de 2026/1)` chamadas. Antes da revisão de imagens, tabelas e anulações,
o teto de volume é 600 chamadas por modelo. O total depende do roster atual
selecionado, não dos 26 modelos históricos.
Isso não é um teto monetário: retries e tokens de raciocínio variam.

## Orçamento

### Piloto medido e primeiro lote de novembro

Consumo observado no piloto, com estimativa à tarifa padrão do catálogo
oficial OpenRouter consultado em 03/11/2026 (sem descontos de cache):

| Modelo   | Entrada / saída no piloto | Estimativa do piloto (2 chamadas) | Projeção para 498 chamadas |
| -------- | ------------------------- | --------------------------------- | -------------------------- |
| Grok 4.7 | 2.940 / 2.481 tokens      | US$ 0,020766                      | US$ 5,170734               |
| Opus 5.5 | 776 / 1.126 tokens        | US$ 0,025624                      | US$ 6,380376               |

Projeção do lote: **US$ 11,55111**, baseada em apenas duas questões por modelo.
Não é teto de gasto nem fatura; tokenização e raciocínio variam por questão.
As oito chamadas de estruturação somaram 329.076 tokens de entrada e 81.873 de
saída: referência de **US$ 0,738441** à tarifa Haiku 4.5 de US$ 1/5 por MTok.
Essas despesas de preparação não entram no score dos modelos avaliados.

### Referência histórica, não orçamento deste lote

O harness atual não registra `usage`; os raws não permitem reconstruir
tokens faturados, sobretudo raciocínio oculto. Não existe estimativa defensável
para o conjunto completo a partir desses logs.

Os custos medidos de agosto estão registrados em
[`plano-enamed-2026.md`](./plano-enamed-2026.md), para 246 chamadas por modelo.
Escalando linearmente para o cenário de 600 chamadas por modelo:

| Modelo             | Projeção para as duas edições |
| ------------------ | ----------------------------: |
| GPT-5.6 Sol        |                      US$ 1,63 |
| DeepSeek V4 Pro    |                      US$ 1,66 |
| Grok 4.5           |                      US$ 3,07 |
| Qwen 3.7 Max       |                      US$ 5,76 |
| Kimi K3            |                      US$ 6,41 |
| Total desses cinco |                     US$ 18,54 |

É uma extrapolação histórica, não cotação atual nem limite de cobrança.
Pressupõe custo médio por chamada semelhante e preços inalterados.
Não cobre o roster atual completo, novos candidatos, extração via Claude,
retries ou computação local. Não transferir o custo de Grok 4.5 para Grok 4.7.
O total de US$ 18,54 não é orçamento do roster aprovado: inclui Grok 4.5,
que foi substituído. Medir o sucessor em vez de executar o antigo por custo conhecido.

## Próximos passos

1. Concluído: conferência visual dos definitivos e marcação de anulações.
2. Concluído: estruturação de 100 questões por prova, revisão de texto,
   imagens/tabelas e classificação por especialidade.
3. Concluído: datas de aplicação e cortes confirmados em fontes oficiais.
   Não aceitar o default do ingestor que usa a data de execução como
   `publishedAt`. Campos oficiais desconhecidos devem ficar ausentes.
4. Concluído: JSONs, README e testes de integridade. Os dados ficam na branch
   até aprovação de commit e PR; não há edições vazias.
5. Primeiro lote: Grok 4.7 e Opus 5.5. Para os próximos, selecionar o roster por família/tier, aplicando substituições e
   mantendo controles especializados relevantes. Registrar a seleção e os
   modelos substituídos antes das execuções.
6. Concluído: captura de usage da PR #87 e pilotos de acesso/parser/consumo.
7. Concluído: três runs por questão e auditoria de cobertura, truncamentos,
   consumo, média e IC95%. Próximo passo: aprovação de commit e PR para os
   datasets, metadados editoriais e resultados auditáveis.

## Contexto

Worktree: `feat/revalida-2025-2-2026-1`. Chamadas pagas iniciadas após a
autorização explícita do mantenedor para começar a rodar os modelos.
Mudanças nos gabaritos existentes e backfill de outras edições ficam fora
deste escopo.
