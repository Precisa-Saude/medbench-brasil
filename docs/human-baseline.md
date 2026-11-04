# Linha de base humana

## Por que a nota de corte sozinha é ruim

Estudos anteriores (Severino et al., 2025) usaram a nota de corte do Revalida (entre 60% e 67% por edição) como "média humana". Isso é metodologicamente frágil: a taxa de aprovação do Revalida fica na casa de 15–20%. Se só 1 em cada 5 candidatos atinge a nota de corte, a **média real dos candidatos está bem abaixo** dela.

Comparar um modelo contra a nota de corte mede se ele passaria na prova, não se ele tem desempenho acima ou abaixo de um humano médio que presta o exame.

## Abordagem de três linhas

Em cada gráfico por edição, mostramos três linhas:

1. **Nota de corte** — publicada no edital oficial da INEP para cada edição
2. **Média humana estimada** — retrocalculada a partir da taxa de aprovação, assumindo distribuição aproximadamente normal
3. **Escore do modelo** — com banda de incerteza derivada do IC 95% das três execuções

## Retrocálculo da média humana

Dado:

- `c` = nota de corte (ex.: 0,65)
- `p` = taxa de aprovação (ex.: 0,18)

Buscamos o z-score tal que `P(Z > z) = p`. Com `σ` estimado de edições com distribuição divulgada (tipicamente 0,08–0,10 em escala 0–1), resolvemos para `μ`:

```
μ ≈ c − z · σ
```

**Exemplo**: `c = 0,65`, `p = 0,18` → `z ≈ 0,92`. Com `σ = 0,10`, `μ ≈ 0,56`. Portanto a média humana estimada fica em torno de **56%**, bem abaixo da nota de corte de 65%.

## Dados por edição

Para cada edição, registramos em `packages/dataset/data/revalida/<AAAA-N>.json`:

- `cutoffScore` — nota de corte (proporção)
- `passRate` — aprovados / presentes na primeira etapa (proporção)
- `passRateSource` — fonte efetivamente consultada
- `passRateSnapshot` — contagens, denominador, etapa, timestamp e evidência preservada
- `totalInscritos` — quando disponível

Distribuições granulares (média, desvio, histograma) não são publicadas rotineiramente pela INEP. Quando julgarmos necessário, submetemos pedido via Lei de Acesso à Informação.

## Denominador e snapshot do Revalida

A linha de candidatos compara o desempenho de quem fez a prova. Por isso,
o denominador canônico é o número de **presentes na primeira etapa**, não
o de inscritos. O numerador é a aprovação na mesma etapa. Aprovação final
após habilidades clínicas não é intercambiável com esse indicador.

O [Painel Revalida do INEP](https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/inep-data/painel-revalida)
declara que os dados são dinâmicos, sujeitos a ações judiciais. O snapshot
preservado de 04/11/2026 retorna:

| Edição | Inscritos | Presentes na 1ª etapa | Aprovados na 1ª etapa | Taxa entre presentes |
| ------ | --------: | --------------------: | --------------------: | -------------------: |
| 2024/1 |    10.049 |                 9.532 |                 2.550 |             26,7520% |
| 2024/2 |    10.821 |                10.335 |                 2.509 |             24,2767% |
| 2025/1 |    17.118 |                15.949 |                 4.499 |             28,2087% |

As taxas são armazenadas como a razão completa, sem arredondamento prévio.
Esses números substituem 25,35%, 23,18% e 26,28%, que vinham de fonte
secundária. Não representam necessariamente o resultado na data original
do exame: são o estado do painel nesse snapshot.

Consultas e respostas agregadas, a configuração dos visuais e os hashes estão
em `packages/dataset/data/provenance/revalida-pass-rates/2026-11-04/`.
O gráfico histórico foi consultado sem modificar sua seleção de medidas,
filtrado para `1° Etapa`. Para cada edição, a contagem de presentes foi
conferida com o cartão correspondente e a de aprovados com o visual de
aprovação. Aprovados + reprovados coincide com presentes nos três recortes.
Isso evita interpretar o alias histórico de uma medida como aprovação final.

O timestamp da resposta preservada é `2026-11-04T15:43:29.267Z`. Ele não deve
ser confundido com a data de carga reportada no gráfico (`17/07/2026`) nem
com `LastRefreshTime` do modelo Power BI (`26/08/2026`). Todos estão no
manifesto. Respostas podem vir de cache, então o timestamp da resposta não
comprova atualização dos dados naquele instante.

O extrator reproduzível usa apenas o link público exposto pelo INEP, sem
login, sem leitura de dados individuais e sem uma chave de API privada:

```bash
node scripts/data/snapshot-revalida-pass-rates.mjs /caminho/novo-snapshot
```

Ele recusa sobrescrever um snapshot existente e não atualiza datasets.
Uma coleta futura exige revisão dos novos totais antes de mudar `passRate`.
No site, as referências exibem a data do snapshot junto ao link do painel.

Essa correção desloca apenas a média humana **estimada** nos gráficos. Não
altera questões, gabaritos, notas de corte, acurácia ou IC95% dos modelos.
O desvio assumido pelo site permanece 0,11; as contagens oficiais não tornam
esse retrocálculo uma média observada.

Com as notas de corte e o desvio inalterados, as referências estimadas passam
de 54,01% para 54,49% (2024/1), 49,71% para 50,10% (2024/2) e 51,69% para
52,33% (2025/1). A mudança é de cerca de +0,48, +0,39 e +0,64 ponto percentual,
respectivamente.
