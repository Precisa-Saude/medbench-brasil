# Specific instructions — medbench-brasil

> This file holds ONLY the rules specific to this repository. The
> shared rules across the precisa-saude ecosystem (tone, git,
> hooks, reviews, worktrees, source verification, test coverage, code
> conventions) live in `@precisa-saude/agent-instructions`.
>
> **Read the shared base online:**
> https://github.com/Precisa-Saude/tooling/blob/main/packages/agent-instructions/AGENTS.md
>
> Claude Code loads both files (shared base + this one) via imports in
> `CLAUDE.md`. Update the base with:
> `pnpm update @precisa-saude/agent-instructions`.

## Overview

Public benchmark of medical LLMs in Portuguese, using ENAMED and ENARE
(INEP) questions. Static site in `site/`, harness in
`packages/eval-harness`, dataset in `packages/dataset`.

## Benchmark integrity — non-negotiable

When modifying the evaluation harness (`packages/eval-harness/`), preserve
these guarantees rigorously:

1. No tools, connectors, or search capabilities in API calls
2. Minimal, literal system prompt: `"Responda a seguinte questão de
múltipla escolha selecionando a letra correta (A, B, C ou D)."`
3. One question per HTTP request — no history, no few-shot, no context
   from other questions
4. Three runs per model; report mean and 95% CI
5. Log every API parameter in `results/` (model, temperature,
   max_tokens, system prompt verbatim)
6. Local models run in pure completion mode, no tool scaffolding

Any change that loosens these requires an ADR in
`docs/development/adr/` and maintainer approval.

## Source of truth for exam data

- Single, exclusive source: official INEP portal
- Post-appeal answer keys (changes marked in blue) always take
  precedence over preliminary keys
- Questions with images, tables, or annulled status must be flagged but
  not removed from the JSON — exclusion is the scorer's decision

## Training cutoffs (contamination)

Every entry in `site/src/data/models.ts` must declare `trainingCutoff`
and `trainingCutoffSource`. The source is **mandatory**: an artifact
the vendor published — API docs, Hugging Face model card, arXiv
technical report, or release notes. Verbatim citation in a comment
above the entry.

When the vendor doesn't publish the cutoff, both fields stay
`undefined` and the model is classified as `unknown` in
`contaminationSplit`.

When changing a `trainingCutoff`, rerun
`medbench rescore --from-raw --edition <id> --model <id> [--cutoff <new-date>]`
for each edition of the model, regenerating the persisted
`contaminationSplit` in `results/`.

## Worktree — specific values

Worktree flow and commands are in the shared base. The canonical config
lives in `package.json` under `"worktree"`. For quick reference:

| Field         | Value                                     |
| ------------- | ----------------------------------------- |
| Port registry | `/tmp/medbench-worktree-ports.json`       |
| Main port     | `site=4321` (default in `vite.config.ts`) |
| Feature base  | `site=4331`, increment 10                 |
| pnpm filter   | `@medbench-brasil/site`                   |

Launch a dev server in a feature worktree:

```bash
pnpm exec precisa-worktree dev --detach   # from inside the worktree
```
