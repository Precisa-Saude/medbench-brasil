# ADR 0004 — Modelos de decisão: protocolo equivalente

**Data**: 2026-09-29
**Status**: Proposto

## Contexto

O roster do medbench é hoje inteiramente de modelos generativos: recebem um
system prompt, produzem texto, e o harness extrai a letra com `parseLetter`.

Os **modelos de decisão** (também chamados System One) funcionam de outro
jeito: recebem um estado não estruturado mais uma pergunta tipada, e devolvem
uma resposta tipada com probabilidade por opção, em uma passada, sem gerar
texto. Entram no roster três:

| Modelo | Origem             | Pesos                  | Acesso                                           |
| ------ | ------------------ | ---------------------- | ------------------------------------------------ |
| Jev    | TypeSafe AI        | fechados               | API hospedada, early access                      |
| Kev    | Jared Palmer       | Apache-2.0 (base Qwen) | local ou Modal, API System One                   |
| Laya   | Convai Innovations | Apache-2.0             | checkpoint `convaiinnovations/laya-multilingual` |

O protocolo canônico do [ADR 0002](./0002-integridade-do-benchmark.md) foi
escrito para modelos generativos. Duas das seis regras não têm como ser
cumpridas ao pé da letra por um modelo de decisão:

- **Regra 1** (system prompt literal e fixo): não há campo de system prompt.
  A instrução vive dentro da definição da pergunta tipada.
- **Regra 6** (modelos locais em modo completion puro): não existe modo
  completion — o modelo não gera tokens.

As regras 2, 3, 4 e 5 continuam aplicáveis sem alteração.

> Nota: a PRE-458 cita "regra 2" para o system prompt e "regra 3" para uma
> questão por requisição. A numeração do ADR 0002 é outra: system prompt é a
> regra 1 e single-turn é a regra 2. Este ADR usa a numeração do ADR 0002.

## Decisão

### 1. Mapeamento do protocolo

| Conceito do ADR 0002                   | Equivalente no modelo de decisão                                                |
| -------------------------------------- | ------------------------------------------------------------------------------- |
| System prompt literal e fixo (regra 1) | String de instrução fixa da pergunta, registrada verbatim                       |
| Prompt do usuário                      | `state` = enunciado da questão, **verbatim**                                    |
| Alternativas A–D                       | Pergunta do tipo `choice`, opções chaveadas A–D com o texto de cada alternativa |
| Resposta do modelo                     | `argmax` do vetor de probabilidades                                             |

O enunciado vai como `state` sem reformatação. As quatro alternativas vão como
as opções da pergunta `choice`, na ordem A, B, C, D — a mesma ordem que o
modelo generativo vê, para que posição não vire variável entre protocolos.

A string de instrução tem o mesmo papel do system prompt: é fixa, é a mesma
para todos os modelos de decisão, e é registrada verbatim em cada artefato.
Alterá-la exige novo ADR, exatamente como alterar o system prompt.

### 2. Regras que permanecem

- **Regra 2** — uma questão por requisição, sem histórico entre questões.
- **Regra 3** — zero tools, RAG ou scaffolding.
- **Regra 4** — três execuções independentes por modelo.
- **Regra 5** — todos os parâmetros registrados em `results/`.

### 3. Determinismo

Modelo de decisão em uma passada tende a ser determinístico: três execuções
podem devolver exatamente o mesmo vetor. Quando isso acontece, o resultado é
reportado como **determinístico**, e não com um IC 95% artificial de largura
zero apresentado como se fosse medida de variabilidade.

Isso não relaxa a regra 4: as três execuções continuam sendo feitas, porque é
o que detecta não-determinismo quando ele existe — e a #71 mostrou que
`temperature: 0` não garante reprodutibilidade quando o serving é quantizado.

### 4. Versão fixada, nunca alias

O modelo é sempre chamado por **snapshot datado**, nunca por alias móvel.
Para o Jev no OpenRouter:

| Forma           | Id                                     | Uso                       |
| --------------- | -------------------------------------- | ------------------------- |
| Alias móvel     | `~typesafe/jev-latest` (com til)       | **Proibido** no benchmark |
| Snapshot fixado | `typesafe/jev-1.13-20260917` (sem til) | O que vai no registry     |

Um alias transforma o escore num alvo móvel: o mesmo `modelId` passa a medir
outro modelo quando o fornecedor promove uma versão, e nada no artefato
registra a troca. É a mesma falha de reprodutibilidade descrita na
[#71](https://github.com/Precisa-Saude/medbench-brasil/issues/71), onde um id
estável era servido por upstream e quantização variáveis.

A resposta do endpoint devolve um campo `model`, mas ele **só serve de
conferência no Jev**: o OpenRouter resolve o alias e responde com o snapshot
datado (`~typesafe/jev-latest` → `typesafe/jev-1.13-20260917`).

No Kev é diferente — o servidor **ecoa de volta a string que você mandou**, sem
validar. Verificado enviando `jaredpalmer/kev-4b`, `kev-4b` e `kev-latest` para
o mesmo servidor: os três foram aceitos e devolvidos como vieram. A identidade
real do Kev vem do argumento `--run` na subida do servidor, não da resposta, e
por isso precisa ser registrada por fora — o campo `model` do artefato é um
rótulo que nós escolhemos, não uma confirmação do que rodou.

### 5. Formato verificado na API

Conferido contra o endpoint real em 29/09/2026, não inferido do ticket:

```
POST https://openrouter.ai/api/alpha/decisions
{ "model": "typesafe/jev-1.13-20260917",
  "state": "<enunciado verbatim>",
  "questions": { "resposta": {
      "type": "choice",
      "instructions": "<string fixa>",
      "criteria": { "A": "...", "B": "...", "C": "...", "D": "..." } } } }
```

Duas diferenças em relação ao que a PRE-458 descreve, que valem registro:

- as alternativas vão em **`criteria`**, não em `options` — mandar `options`
  passa na validação de schema e falha no upstream com "Choice question must
  have at least one choice";
- modelos de decisão são **recusados** em `/chat/completions` com erro
  explícito apontando para `/api/alpha/decisions`. Não há caminho de texto.

A resposta traz `choice`, o vetor `probabilities` por opção e `confidence`,
além de `usage` com custo por chamada.

### 6. O que é persistido

Além dos campos que todo artefato já tem:

- **vetor completo de probabilidades** por questão, não só o argmax — sem ele
  não há como recalcular calibração nem refazer o score depois;
- **string de instrução** verbatim;
- **identificação da versão**: version string (Jev), nome e hash do checkpoint
  (Kev e Laya);
- **flag `truncated`** por questão, com contagem por edição;
- `temperature` e `max_tokens` registrados como **não aplicáveis**, não como
  ausentes — a distinção entre "não se aplica" e "não registramos" importa
  para auditoria.

### 7. Calibração reportada como medida

A calibração (Brier) é reportada como medida, sem correção. Especificamente,
não se ajusta temperatura nem se faz qualquer fit sobre edição de prova —
isso contaminaria a medição com dados do próprio teste.

### 8. Corte de treino

Vale a regra do `AGENTS.md` sem exceção: `trainingCutoff` só sai de artefato
publicado pelo fornecedor. **Não se infere corte do modelo base** (Qwen no
Kev, ModernBERT/mmBERT no Laya) — o fine-tune posterior pode ter visto dados
mais novos. Sem artefato publicado, os dois campos ficam `undefined` e o
modelo é classificado como `unknown`.

### 9. Apresentação

As entradas ganham flag de modelo de decisão no registry. Aparecem na mesma
tabela do leaderboard, sinalizadas, para que o leitor não conclua que foram
medidas sob o mesmo protocolo dos modelos generativos.

Entrar no leaderboard, porém, não é automático: o artefato em `results/` só
vira linha na tabela quando ganha entrada em `site/src/data/model-registry/`.
A separação é deliberada — medir e publicar são decisões distintas, e a
seção 10 registra o primeiro caso em que elas divergiram.

### 10. Laya entra como controle, não como linha do leaderboard

O Laya foi medido na ENAMED 2026 e **não** recebe entrada no registry. A
medição fica no repositório; a linha no leaderboard, não.

O que foi medido: precisão 24,7% (63/255), IC95 19,8–30,3%, Macro-F1 19,4%.
O acaso em quatro alternativas é 25% e está dentro do intervalo.

A medição é limpa, e isso foi verificado antes da decisão. Os 255 vetores de
probabilidade somam 1,0, o argmax bate com a alternativa registrada, não
houve erro de transporte e nenhuma questão truncou: a entrada real — enunciado
mais pergunta mais alternativas — chega no máximo a 391 tokens, contra o teto
de 1024 do checkpoint, então `max_len=8192` não mudaria nada. O número
descreve o modelo, não a configuração.

Mesmo assim não vira linha, por três motivos:

- **Não há alegação do fornecedor a verificar.** O model card posiciona o
  Laya para roteamento, guardrails, moderação e classificação — os exemplos
  próprios são triagem de ticket e detecção de pedido de reembolso. Em
  nenhum momento a Convai afirma conhecimento médico ou raciocínio de prova.
  Resultado nulo vale publicação quando contradiz uma alegação; aqui não há
  o que contradizer.
- **O piso já era conhecido por aritmética.** Saber 25% de antemão e medir
  24,7% depois não muda o que o leitor sabe.
- **A linha seria lida como o que ela não é.** 24,7% ao lado de 94% sugere
  "o Laya é ruim", quando o medido é "um classificador de roteamento de 322M
  não sabe medicina" — coisa que ninguém disputava.

O valor da medição é outro, e esse fica: **o Laya é o controle de protocolo
do ADR.** Mesmo harness, mesmo contrato System One, mesma prova, mesma
pergunta tipada — um modelo de decisão pontua no acaso e outro (Kev-4B) faz
72,9%. Isso descarta a hipótese de que o protocolo, e não o modelo, produz o
resultado do Kev. É a evidência que sustenta a seção 1 deste ADR, e ela só
existe porque a rodada do Laya foi feita.

A decisão se inverte se a Convai — ou alguém com audiência — passar a
afirmar capacidade clínica ou de conhecimento para o Laya. Nesse caso existe
alegação a verificar, a publicação passa a ser devida e o dado já está
medido.

## Consequências

- O roster passa a comparar duas famílias de protocolo na mesma tabela. A
  flag é o que impede que isso seja lido como comparação direta.
- O vetor de probabilidades habilita análise de calibração que os modelos
  generativos não permitem — nenhum provider generativo do roster expõe
  logprobs por alternativa sob este protocolo.
- A precisão próxima do acaso do Laya se confirmou (24,7%, IC95 19,8–30,3%).
  Não é falha de execução nem piso publicável: é o controle que separa o
  efeito do protocolo do efeito do modelo, como registra a seção 10.
- `parseLetter` não participa deste caminho: não há texto para parsear. Os
  modos de falha de parsing que afetam modelos generativos não se aplicam.

## Alternativas descartadas

- **Adaptar o system prompt ao formato de pergunta tipada** — o system prompt
  do ADR 0002 é literal e fixo por decisão; reescrevê-lo para um subconjunto
  do roster quebraria a comparabilidade que ele existe para garantir.
- **Usar só o argmax e descartar as probabilidades** — mais simples, mas
  jogaria fora o único sinal que torna calibração possível, e tornaria o
  rescore offline incapaz de recuperar qualquer coisa.
- **Deixar os modelos de decisão fora do leaderboard, em página própria** —
  evitaria a confusão de protocolo, mas esconderia justamente a comparação
  que motiva a PRE-458.
