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

Toda entrada em `site/src/data/models.ts` deve declarar `trainingCutoff` e `trainingCutoffSource`. A fonte é **obrigatoriamente** um artefato publicado pelo fornecedor: docs de API, model card no Hugging Face, technical report no arXiv ou release notes. Citação verbatim no comentário acima da entrada.

Quando o fornecedor não publica o corte, os dois campos ficam `undefined` — o modelo é classificado como `unknown` em `contaminationSplit`. **Não estimamos**: um cutoff inventado vira base para gráficos e decisões, e é mais honesto não classificar do que produzir uma tela contaminated/clean sobre um dado que não existe. Ver `docs/contamination.md`.

Ao mudar um `trainingCutoff`, é obrigatório rodar `medbench rescore --from-raw --edition <id> --model <id> [--cutoff <nova-data>]` para cada edição do modelo, regenerando o `contaminationSplit` persistido em `results/`.

## Git

- Sempre criar PR, nunca push direto em `main`
- Nunca usar `--no-verify` ou pular hooks
- Commits em pt-BR, Conventional Commits, escopos válidos listados em `CONVENTIONS.md`

## Revisão de PR — obrigatório responder e resolver

**Sempre** que houver comentários de revisão em uma PR em que você está trabalhando (humanos OU bots como o Claude Review), você DEVE:

1. **Ler todos os comentários** antes de seguir para próxima tarefa — use `gh api repos/OWNER/REPO/pulls/<N>/comments --jq '.[] | {id, path, line, body}'` para listar inline comments.
2. **Para cada comentário**:
   - **Se implementar a sugestão**: responda citando o commit que aplica a mudança (ex.: "Endereçado em `abc123`: <breve explicação>") e marque o thread como resolvido.
   - **Se discordar ou pular**: responda explicando a razão técnica (ex.: "`parseArgs` já normaliza bare flags para `'true'`, então o check é seguro"). Resolva o thread mesmo assim se o conselho não vale a pena agir.
   - **Se precisar da decisão do usuário**: responda pedindo esclarecimento explicitamente, NÃO resolva o thread, e escale ao usuário.
3. **Responder via REST**: `gh api -X POST repos/OWNER/REPO/pulls/<N>/comments/<COMMENT_ID>/replies -f body="<texto>"`.
4. **Resolver via GraphQL**: `gh api graphql -f query='mutation { resolveReviewThread(input: { threadId: "<THREAD_ID>" }) { thread { isResolved } } }'`. Para achar `threadId`, use `gh api graphql -f query='{ repository(owner: "<o>", name: "<r>") { pullRequest(number: <n>) { reviewThreads(first: 50) { nodes { id isResolved comments(first: 1) { nodes { databaseId } } } } } } }'`.
5. **Commits de fix em resposta a review** devem citar `Refs: #<PR>` no footer e, quando possível, referenciar IDs de comentários específicos.

Silêncio em revisão não é neutro — é dívida. Se o thread fica aberto, o próximo revisor precisa redescobrir o contexto. Sempre feche o loop.

## Worktrees para sessões paralelas — obrigatório

**CRÍTICO**: quando mais de uma sessão do Claude pode estar ativa neste repositório, você DEVE usar um `git worktree` dedicado para sua feature. Compartilhar a mesma working tree entre sessões paralelas já corrompeu o estado do repo uma vez (commits na branch errada, arquivos de outra sessão entrando em `git add`) e não pode acontecer de novo.

Use `scripts/worktree.sh` para gerenciar worktrees com alocação automática de porta do Vite — múltiplos worktrees podem rodar o dev server do site simultaneamente sem conflito de porta.

### Estrutura de diretórios

```
~/Github/
├── medbench-brasil/                      # branch principal (site=4321)
├── medbench-brasil-feat-novo-chart/      # feat/novo-chart (site=4331)
├── medbench-brasil-fix-leaderboard/      # fix/leaderboard (site=4341)
```

### Comandos do script

```bash
# Setup: cria worktree, instala deps, builda pacotes do workspace, aloca porta
./scripts/worktree.sh setup feat/novo-chart

# Iniciar dev server (auto-detecta branch pelo cwd)
cd ../medbench-brasil-feat-novo-chart
./scripts/worktree.sh dev

# Parar dev server sem remover o worktree
./scripts/worktree.sh stop feat/novo-chart

# Tail do log do site
./scripts/worktree.sh logs feat/novo-chart

# Listar todos os worktrees com portas e status
./scripts/worktree.sh list

# Teardown: para o dev server, remove o worktree, apaga a branch, libera a porta
./scripts/worktree.sh teardown feat/novo-chart
./scripts/worktree.sh teardown --keep-branch feat/novo-chart   # preserva branch
```

### Como funciona a alocação de portas

- **Worktree principal**: sempre usa `site=4321` (padrão do `vite.config.ts`)
- **Feature worktrees**: começam em `site=4331`, incrementando de 10 em 10
- **Registry**: `/tmp/medbench-worktree-ports.json`
- **Sem colisões**: cada worktree recebe uma porta única, permitindo rodar múltiplos simultâneamente
- **Requer `jq`**: instale com `brew install jq`

### Antes de iniciar qualquer trabalho de feature

1. Rode `./scripts/worktree.sh list` e `git branch --show-current`. Anuncie na resposta qual worktree/branch você está usando.
2. Se já existir um worktree para a feature, entre nele com `cd`. Não crie duplicata.
3. Se não existir, rode `./scripts/worktree.sh setup <branch>`.
4. **Nunca** rode `git checkout <branch>` no worktree principal para "trocar para a branch de feature" — isso troca a HEAD da working tree que outra sessão pode estar usando. Use worktrees separados por feature.

### Durante o trabalho

- Antes de `git add`, confirme `git branch --show-current`. Se a branch mudou desde seu último commit, PARE — outra sessão mexeu na working tree. Não commite.
- `git status` frequente. Arquivos modificados que você não tocou nesta sessão são provavelmente de outra sessão; **não** os inclua em commits (`git add <arquivo>` explícito por caminho, nunca `git add -A` ou `git add .`).
- `git reflog` quando algo parecer fora do lugar — é a fonte de verdade para reconstruir trocas de HEAD silenciosas.

### Rodando o dev server a partir do Claude Code

`worktree.sh dev` roda o Vite em foreground. Se chamado como um Bash tool call normal, será morto no timeout do comando. Para manter o dev server ativo, rode com `nohup` + `run_in_background: true` (troque `feat/novo-chart` pela sua branch):

```bash
BRANCH="feat/novo-chart"
DIR_SUFFIX="${BRANCH//\//-}"
cd "/Users/rafael/Github/medbench-brasil-$DIR_SUFFIX"
SITE_PORT=$(jq -r --arg b "$BRANCH" '.[$b].site' /tmp/medbench-worktree-ports.json)
LOG="/tmp/medbench-site-$DIR_SUFFIX.log"
nohup pnpm --filter @medbench-brasil/site dev -- --port "$SITE_PORT" > "$LOG" 2>&1 &
```

Verifique com `sleep 5 && curl -sI http://localhost:$SITE_PORT | head -1`. Para parar: `./scripts/worktree.sh stop feat/novo-chart`.

### Limpeza

Após o merge da PR, rode sempre `./scripts/worktree.sh teardown <branch>` — para o dev server, remove o worktree, apaga a branch local, libera a porta do registry e limpa o log. Não faça cleanup manual.

### Resumo em uma frase

Um worktree por feature via `scripts/worktree.sh`, sempre; nunca trabalhe direto na working tree principal se houver chance de outra sessão estar viva.
