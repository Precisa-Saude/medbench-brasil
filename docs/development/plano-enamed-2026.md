# Plano — ENAMED 2026: a primeira medição limpa

> Plano topical. O plano geral do projeto está em `PLAN.md`.

## Objetivo

Avaliar o roster completo na **ENAMED 2026**, a primeira edição que post-data o
corte de treino de todos os modelos de fronteira. Hoje nenhum deles tem medição
limpa: a ENAMED 2025 foi publicada em 2025-10-26 e todo modelo lançado depois
disso cai em `contaminated` ou `unknown`.

## Por que importa

Dos 8 modelos adicionados em ago/2026, **nenhum é limpo** na ENAMED 2025:

| Modelo           | Cutoff declarado | Status na ENAMED 2025 |
| ---------------- | ---------------- | --------------------- |
| Claude Opus 5    | 2026-05-01       | contaminado           |
| GPT-5.6 Sol      | 2026-02-16       | contaminado           |
| Grok 4.5         | 2026-02-01       | contaminado           |
| Claude Sonnet 5  | 2026-01-01       | contaminado           |
| Gemini 3.6 Flash | não publicado    | unknown               |
| Qwen 3.7 Max     | não publicado    | unknown               |
| DeepSeek V4 Pro  | não publicado    | unknown               |
| Kimi K3          | não publicado    | unknown               |

`unknown` **não é limpo** — significa apenas que o fornecedor não publica o
corte, e não dá para descartar memorização. Logo o 99,2% do GPT-5.6 Sol lê-se
como "no máximo 99,2%, numa prova que ele pode ter visto".

Todos os cortes declarados (o mais recente é maio/2026) precedem 13/09/2026 →
**na ENAMED 2026 o roster inteiro vira medição limpa de uma vez**. É a
propriedade de "benchmark vivo" descrita em `docs/contamination.md`.

## Cronograma oficial (edital INEP de 29/05/2026)

| Marco                                 | Data           |
| ------------------------------------- | -------------- |
| Aplicação da prova                    | **13/09/2026** |
| Gabarito preliminar                   | 15/09/2026     |
| Prazo de recursos                     | 15–16/09/2026  |
| **Gabarito definitivo (pós-recurso)** | **04/12/2026** |
| Resultado final                       | 04/12/2026     |

Formato: 100 questões objetivas, 5h. A nota alimenta o ENARE 2026/2027.

## A tensão de timing

O `AGENTS.md` manda o gabarito pós-recurso prevalecer — mas ele só sai em
**04/12**, quase três meses depois da prova. Em contrapartida a janela limpa é
estreita: assim que as questões circulam na internet, entram no corpus dos
próximos modelos.

**Abordagem acordada:** rodar em setembro, assim que sair o gabarito preliminar
(15/09), e reprocessar com o definitivo em dezembro. O `rescore --from-raw` é
grátis e determinístico — reaproveita os raws, sem novas chamadas de API.

## Passos

1. **Após 13/09** — ingerir a prova do portal oficial do INEP (fonte única, ver
   `AGENTS.md`). Marcar anuladas / com imagem / com tabela.
2. **Após 15/09** — carregar o gabarito preliminar e criar a edição
   `enamed-2026` com `publishedAt: 2026-09-13`.
3. **Rodar o roster** com o `--cutoff` de cada modelo. Quem tem corte anterior a
   13/09/2026 deve sair como `likely-clean`.
4. **Publicar sinalizando gabarito provisório** até 04/12.
5. **Após 04/12** — trocar pelo definitivo e, por modelo:
   ```bash
   medbench rescore --from-raw --edition enamed-2026 --model <id> [--cutoff <data>]
   ```
   Conferir com `scripts/diff-accuracy-ic95.mjs` se alguma mudança sai do IC95.

## Custo medido (ago/2026)

Eval completo = 246 chamadas (82 questões × 3 runs):

| Modelo          | Custo    | Tokens de saída/chamada |
| --------------- | -------- | ----------------------- |
| GPT-5.6 Sol     | US$ 0,67 | ~50                     |
| DeepSeek V4 Pro | US$ 0,68 | ~2.899                  |
| Grok 4.5        | US$ 1,26 | ~650                    |
| Qwen 3.7 Max    | US$ 2,36 | ~1.973                  |
| Kimi K3         | US$ 2,63 | n/d                     |

O volume de tokens de raciocínio varia ~60x entre modelos e **não** é previsível
pelo preço de tabela — o GPT-5.6 Sol é o mais caro por token e o mais barato por
eval. Sempre medir com `smoke` antes de estimar o custo de um modelo novo.

## Pendências relacionadas

- **`gpt-5.4` na `revalida-2025-1` está subestimado**: o artefato publicado foi
  gerado com um parser anterior ao fix do commit `a3728c5`. Re-parsear os raws
  existentes dá 96,5% em vez dos 89,0% publicados. Corrigir muda número já
  publicado — decisão do mantenedor, em PR própria.
- **Demais edições**: os 8 modelos novos só rodaram na ENAMED 2025. Revalida
  2024-1, 2024-2 e 2025-1 seguem pendentes para eles.
