# medbench-brasil

[![Licença: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Leaderboard contínuo e reproduzível de desempenho de LLMs em provas médicas brasileiras. A contraparte, no nível do modelo de linguagem, do [fhir-brasil](https://fhir-brasil.dev.br) — que resolve interoperabilidade de dados. Enquanto o fhir-brasil prova que é possível construir infraestrutura de saúde em padrão aberto, o **medbench-brasil** mede, com rigor e transparência, o que os modelos de IA realmente sabem (e não sabem) sobre medicina no contexto brasileiro, em português.

Disponível em [medbench-brasil.ia.br](https://medbench-brasil.ia.br).

---

## Motivação

Não existe hoje um leaderboard público, vivo e continuamente atualizado para desempenho de LLMs em provas médicas brasileiras. Os estudos existentes (Severino et al., HealthQA-BR, HCFMUSP, ENAMED PROPOR 2026) são publicações estáticas, pontuais, sem análise de contaminação de treino e com linhas de base humanas metodologicamente frágeis.

O **medbench-brasil** preenche essa lacuna:

- **Dataset estruturado** das provas do Revalida (INEP), com gabarito oficial e classificação por especialidade
- **Harness de avaliação** reproduzível — API e modelos locais, sem uso de ferramentas, prompt mínimo, três execuções por modelo
- **Análise de contaminação** — toda edição é classificada como provavelmente limpa ou provavelmente contaminada para cada modelo avaliado, e os resultados são reportados nos dois recortes
- **Linhas de base humanas corretas** — nota de corte, média humana estimada (retrocalculada a partir da taxa de aprovação) e escores dos modelos, sempre em três linhas
- **Site público** em pt-BR com leaderboard, detalhe por modelo, detalhe por edição e metodologia completa

---

## Pacotes

| Pacote                                                  | Descrição                                                             |
| ------------------------------------------------------- | --------------------------------------------------------------------- |
| [`@precisa-saude/medbench-dataset`](packages/dataset/)  | Questões do Revalida estruturadas em JSON, com tipagem e loader       |
| [`@precisa-saude/medbench-harness`](packages/eval-harness/) | Pipeline de avaliação: providers, runner, scorer, CLI                |

O site (`site/`) consome os dois pacotes em tempo de build — deploy estático no Cloudflare Pages.

---

## Como começar

Pré-requisitos: Node ≥ 20, pnpm ≥ 9.

```bash
pnpm install
pnpm turbo build
pnpm turbo test lint typecheck
```

Rodar o site localmente:

```bash
pnpm --filter @medbench-brasil/site dev
```

Rodar uma avaliação (exemplo):

```bash
pnpm --filter @precisa-saude/medbench-harness eval \
  --model claude-sonnet-4-6 \
  --edition 2025-1 \
  --runs 3
```

---

## Escopo v1

- Dataset: Revalida 2020 a 2025/1 (pós-gap, mais limpo)
- Modelos: Claude, GPT, Gemini, Sabiá, Qwen, Llama, DeepSeek, Mistral
- Site: leaderboard, detalhe por modelo, detalhe por edição, metodologia, download do dataset

Roadmap no `docs/development/PLAN.md`.

---

## Contribuindo

Veja [CONTRIBUTING.md](CONTRIBUTING.md) e [CONVENTIONS.md](CONVENTIONS.md). Contribuições de dados (novas edições, correções de gabarito) devem citar a fonte oficial INEP. Contribuições de novos modelos devem incluir a data de corte de treino documentada.

## Aviso

O medbench-brasil é um instrumento de avaliação e pesquisa. Não constitui aconselhamento médico e não deve ser usado para decisões clínicas. Ver [DISCLAIMER.md](DISCLAIMER.md).

## Licença

[Apache-2.0](LICENSE).
