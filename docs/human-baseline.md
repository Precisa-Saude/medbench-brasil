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
- `passRate` — taxa de aprovação (proporção)
- `totalInscritos` — quando disponível

Distribuições granulares (média, desvio, histograma) não são publicadas rotineiramente pela INEP. Quando julgarmos necessário, submetemos pedido via Lei de Acesso à Informação.
