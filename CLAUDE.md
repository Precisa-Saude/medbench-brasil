# Instruções para Claude neste repositório

## Idioma

Todos os artefatos versionados neste repositório são escritos em **pt-BR**: commits, README, docs, CONTRIBUTING, CHANGELOG, comentários voltados ao leitor e texto do site. Identificadores técnicos (nomes de tipos, funções, scripts, pacotes) permanecem em inglês técnico. Arquivos padrão da comunidade (`LICENSE`, `SECURITY.md`, `CITATION.cff`) mantêm o formato upstream.

## Integridade do benchmark — inegociável

Ao modificar o harness de avaliação (`packages/eval-harness/`), preserve rigorosamente estas garantias:

1. Nenhuma ferramenta, conector ou capacidade de busca nas chamadas de API
2. System prompt mínimo e literal: `"Responda a seguinte questão de múltipla escolha selecionando a letra correta (A, B, C ou D)."`
3. Uma questão por requisição HTTP — sem histórico, sem few-shot, sem contexto de outras questões
4. Três execuções por modelo; relatar média e IC 95%
5. Registrar todos os parâmetros de API em `results/` (model, temperature, max_tokens, system prompt verbatim)
6. Modelos locais rodam em modo completion puro, sem scaffolding de ferramentas

Qualquer mudança que afrouxe esses pontos exige ADR em `docs/development/adr/` e aprovação do mantenedor.

## Dados de prova

- Fonte única e exclusiva: portal oficial INEP
- Gabaritos pós-recurso (alterações marcadas em azul) sempre prevalecem sobre gabarito preliminar
- Questões com imagem, tabela ou anuladas devem ser marcadas mas não excluídas do JSON — a exclusão é decisão do scorer
- Nunca inventar valores; se um gabarito está ilegível, abra uma issue e aguarde

## Cortes de treino (contamination)

Toda definição de provider em `packages/eval-harness/src/providers/` deve declarar `trainingCutoff` — fonte obrigatoriamente a documentação oficial do fornecedor. Se o fornecedor não publicar o corte, usar a melhor estimativa pública e documentar a fonte no código.

## Git

- Sempre criar PR, nunca push direto em `main`
- Nunca usar `--no-verify` ou pular hooks
- Commits em pt-BR, Conventional Commits, escopos válidos listados em `CONVENTIONS.md`

## Worktrees para sessões paralelas — obrigatório

**CRÍTICO**: quando mais de uma sessão do Claude pode estar ativa neste repositório, você DEVE usar um `git worktree` dedicado para sua feature. Compartilhar a mesma working tree entre sessões paralelas já corrompeu o estado do repo uma vez (commits na branch errada, arquivos de outra sessão entrando em `git add`) e não pode acontecer de novo.

### Antes de iniciar qualquer trabalho de feature

1. Rode `git worktree list` e `git branch --show-current` antes do primeiro edit. Anuncie na resposta qual worktree/branch você está usando.
2. Se já existir um worktree para a feature (ex.: `../medbench-brasil-feat-enamed`), entre nele com `cd`. Não crie duplicata.
3. Se não existir, crie um novo worktree dedicado à feature:

   ```bash
   git worktree add ../medbench-brasil-feat-<nome> -b feat/<nome> origin/main
   cd ../medbench-brasil-feat-<nome>
   pnpm install   # worktrees não compartilham node_modules por padrão
   ```

4. **Nunca** rode `git checkout <branch>` no worktree principal para "trocar para a branch de feature" — isso troca a HEAD da working tree que outra sessão pode estar usando. Use worktrees separados por feature.

### Durante o trabalho

- Antes de `git add`, confirme `git branch --show-current`. Se a branch mudou desde seu último commit, PARE — outra sessão mexeu na working tree. Não commite.
- `git status` frequente. Arquivos modificados que você não tocou nesta sessão são provavelmente de outra sessão; **não** os inclua em commits (`git add <arquivo>` explícito por caminho, nunca `git add -A` ou `git add .`).
- `git reflog` quando algo parecer fora do lugar — é a fonte de verdade para reconstruir trocas de HEAD silenciosas.

### Limpeza

Após o merge da PR:

```bash
cd /Users/rafael/Github/medbench-brasil   # de volta ao worktree principal
git worktree remove ../medbench-brasil-feat-<nome>
git branch -d feat/<nome>
```

### Resumo em uma frase

Um worktree por feature, sempre; nunca trabalhe direto na working tree principal se houver chance de outra sessão estar viva.
