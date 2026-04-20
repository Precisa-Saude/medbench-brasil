# medbench-brasil

[![Licença: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Leaderboard contínuo e reproduzível de desempenho de LLMs em provas médicas brasileiras. A contraparte, no nível do modelo de linguagem, do [fhir-brasil](https://fhir-brasil.dev.br) — que resolve interoperabilidade de dados. Enquanto o fhir-brasil prova que é possível construir infraestrutura de saúde em padrão aberto, o **medbench-brasil** mede, com rigor e transparência, o que os modelos de IA realmente sabem (e não sabem) sobre medicina no contexto brasileiro, em português.

Disponível em [medbench-brasil.ia.br](https://medbench-brasil.ia.br).

---

## Motivação

Há um corpo crescente de trabalhos acadêmicos avaliando LLMs em provas médicas brasileiras — Severino et al. (2025), D'Addario (HealthQA-BR, 2025) e Correia et al. (PROPOR 2026), entre outros. Essas publicações estabelecem resultados rigorosos em recortes e momentos específicos, e o medbench-brasil se apoia nelas como referência metodológica.

O que o medbench-brasil propõe é complementar: um **leaderboard vivo e continuamente atualizado** conforme novos modelos e novas edições de prova entram em disponibilidade pública, com ênfase em três aspectos operacionais:

- **Dataset estruturado** das provas do Revalida e do ENAMED (INEP), com gabarito oficial pós-recurso e classificação por especialidade
- **Harness de avaliação** reproduzível — API e modelos locais, sem uso de ferramentas, prompt mínimo, três execuções por modelo, log bruto (`raw.jsonl`) persistido para re-scoring determinístico
- **Análise de contaminação por edição × modelo** — cada par é classificado como provavelmente limpo ou provavelmente contaminado a partir do corte de treino declarado pelo fornecedor, e os resultados são reportados nos dois recortes
- **Linhas de base humanas diretas** — nota de corte e taxa oficial de aprovação por edição, com referências publicadas pelo INEP citadas abaixo de cada gráfico
- **Site público** em pt-BR com leaderboard, detalhe por modelo, detalhe por edição, metodologia e download do dataset

### Referências

- CORREIA, João Vitor Mariano; CASTRO, Pedro Henrique Alves de; GARCIA, Gabriel Lino; PAIOLA, Pedro Henrique; PAPA, João Paulo. **Class of LLMs: Benchmarking Large Language Models on the Brazilian National Medical Examination**. In: Proceedings of the 17th International Conference on Computational Processing of Portuguese (PROPOR 2026), vol. 2. Salvador, 2026. p. 101–111. Disponível em: <https://aclanthology.org/2026.propor-2.17/>.
- D'ADDARIO, Andrew Maranhão Ventura. **HealthQA-BR: A System-Wide Benchmark Reveals Critical Knowledge Gaps in Large Language Models**. arXiv:2506.21578, 16 jun. 2025. Disponível em: <https://doi.org/10.48550/arXiv.2506.21578>.
- SEVERINO, João Victor Bruneti et al. **Benchmarking open-source large language models on Portuguese Revalida multiple-choice questions**. BMJ Health & Care Informatics, v. 32, n. 1, e101195, fev. 2025. DOI: 10.1136/bmjhci-2024-101195. Disponível em: <https://pmc.ncbi.nlm.nih.gov/articles/PMC12082654/>.

---

## Pacotes

| Pacote                                                      | Descrição                                                                |
| ----------------------------------------------------------- | ------------------------------------------------------------------------ |
| [`@precisa-saude/medbench-dataset`](packages/dataset/)      | Questões de Revalida e ENAMED estruturadas em JSON, com tipagem e loader |
| [`@precisa-saude/medbench-harness`](packages/eval-harness/) | Pipeline de avaliação: providers, runner, scorer, CLI `medbench`         |

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
pnpm --filter ./site dev
```

Rodar uma avaliação (exemplo — ver `packages/eval-harness/src/cli.ts` para a lista completa de backends e flags):

```bash
node packages/eval-harness/dist/cli.js eval \
  --backend openrouter \
  --model google/gemini-3.1-pro-preview \
  --cutoff 2025-11-01 \
  --edition revalida-2025-1 \
  --runs 3
```

Backends suportados: `anthropic`, `openai`, `google`, `openrouter`, `together`, `maritaca`, `ollama`. O CLI também expõe o comando `smoke` (pré-flight com 8 questões) e o flag `--restart` para descartar retomadas.

Roadmap em `docs/development/PLAN.md`.

---

## Contribuindo

Veja [CONTRIBUTING.md](CONTRIBUTING.md) e [CONVENTIONS.md](CONVENTIONS.md). Contribuições de dados (novas edições de Revalida ou ENAMED, correções de gabarito) devem citar a fonte oficial INEP. Contribuições de novos modelos devem incluir a data de corte de treino documentada, conforme o fornecedor.

## Aviso

O medbench-brasil é um instrumento de avaliação e pesquisa. Não constitui aconselhamento médico e não deve ser usado para decisões clínicas. Ver [DISCLAIMER.md](DISCLAIMER.md).

## Licença

[Apache-2.0](LICENSE).
