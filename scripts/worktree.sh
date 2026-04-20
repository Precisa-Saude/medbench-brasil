#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PARENT_DIR="$(dirname "$REPO_ROOT")"
PORT_REGISTRY="/tmp/medbench-worktree-ports.json"
PORT_LOCKDIR="/tmp/medbench-worktree-ports.lock.d"
SITE_PORT_BASE=4321
SITE_PORT_OFFSET=10
PORT_INCREMENT=10

# --- Helpers ---

ensure_registry() {
  if [[ ! -f "$PORT_REGISTRY" ]]; then
    echo '{}' > "$PORT_REGISTRY"
  fi
}

require_jq() {
  if ! command -v jq &>/dev/null; then
    echo "Erro: jq é necessário. Instale com: brew install jq"
    exit 1
  fi
}

# Lock de registry via mkdir — portátil (POSIX-atômico) e não depende de
# flock, que não vem por padrão no macOS. Serializa sessões concorrentes
# de setup/teardown para evitar race conditions no port registry.
#
# O trap EXIT é definido uma única vez no final deste arquivo (busca por
# `trap.*EXIT`) e é idempotente: remove o lockdir apenas se existir. Isso
# evita a janela em que toggling do trap por acquire/release deixaria
# um lock órfão caso um sinal chegasse entre release e o próximo acquire.
acquire_registry_lock() {
  local tries=0 max_tries=100
  while ! mkdir "$PORT_LOCKDIR" 2>/dev/null; do
    tries=$((tries + 1))
    if (( tries > max_tries )); then
      echo "Erro: timeout (~10s) esperando lock em $PORT_LOCKDIR" >&2
      echo "       se nenhuma outra sessão estiver rodando, rode: rmdir $PORT_LOCKDIR" >&2
      exit 1
    fi
    sleep 0.1
  done
}

release_registry_lock() {
  rmdir "$PORT_LOCKDIR" 2>/dev/null || true
}

branch_to_dir() {
  # Converte branch para um nome de diretório seguro: feat/foo -> feat-foo
  echo "medbench-brasil-${1//\//-}"
}

worktree_path() {
  echo "$PARENT_DIR/$(branch_to_dir "$1")"
}

log_file() {
  echo "/tmp/medbench-site-${1//\//-}.log"
}

allocate_port() {
  local branch="$1"
  ensure_registry
  # Lock precisa cobrir a leitura de `existing` também — sem isso, dois
  # processos podem ambos ler "sem entrada para branch X" antes de qualquer
  # um acquirar, abrindo um TOCTOU. Fecha a janela segurando o lock sobre
  # todo o read-modify-write.
  acquire_registry_lock

  local existing
  existing=$(jq -r --arg b "$branch" '.[$b].site // empty' "$PORT_REGISTRY" 2>/dev/null)
  if [[ -n "$existing" ]]; then
    release_registry_lock
    return
  fi

  # Coleta slots já usados (ignorando valores não-numéricos) e procura
  # o menor inteiro >= 1 livre — assim slots reciclam após teardown,
  # em vez de crescerem indefinidamente.
  local used_slots next_slot=1
  used_slots=$(jq -r 'to_entries[] | .value.slot' "$PORT_REGISTRY" 2>/dev/null \
    | grep -E '^[0-9]+$' | sort -n | uniq)
  if [[ -n "$used_slots" ]]; then
    while printf '%s\n' "$used_slots" | grep -qx "$next_slot"; do
      next_slot=$((next_slot + 1))
    done
  fi

  local site_port=$((SITE_PORT_BASE + SITE_PORT_OFFSET + (next_slot - 1) * PORT_INCREMENT))

  jq --arg branch "$branch" \
     --argjson slot "$next_slot" \
     --argjson site "$site_port" \
     '. + {($branch): {slot: $slot, site: $site}}' \
     "$PORT_REGISTRY" > "${PORT_REGISTRY}.tmp" && mv "${PORT_REGISTRY}.tmp" "$PORT_REGISTRY"

  release_registry_lock
}

get_site_port() {
  jq -r --arg b "$1" '.[$b].site // empty' "$PORT_REGISTRY" 2>/dev/null
}

free_port() {
  local branch="$1"
  ensure_registry
  acquire_registry_lock
  jq --arg b "$branch" 'del(.[$b])' "$PORT_REGISTRY" > "${PORT_REGISTRY}.tmp" \
    && mv "${PORT_REGISTRY}.tmp" "$PORT_REGISTRY"
  release_registry_lock
}

detect_branch() {
  if [[ -n "${1:-}" ]]; then
    echo "$1"
    return
  fi
  # Auto-detecção só faz sentido dentro de um worktree linkado (dir com
  # sufixo `medbench-brasil-*`). No main repo (basename == "medbench-brasil")
  # retornamos vazio para forçar o chamador a passar a branch — senão
  # `git branch --show-current` devolveria `main`, que quase nunca é o
  # que o usuário quis em `stop`/`dev`/`logs`.
  local dirname
  dirname=$(basename "$(pwd)")
  if [[ "$dirname" == medbench-brasil-* ]]; then
    git branch --show-current 2>/dev/null || echo ""
  else
    echo ""
  fi
}

# Port utilities — preferem lsof (macOS), caem para ss/fuser quando
# indisponíveis (Linux sem lsof instalado por padrão).
_listeners_on_port() {
  local port="$1"
  if command -v lsof &>/dev/null; then
    lsof -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null || true
  elif command -v ss &>/dev/null; then
    ss -tlnp 2>/dev/null | awk -v p=":$port" '$4 ~ p {print $NF}' \
      | grep -oE 'pid=[0-9]+' | cut -d= -f2 || true
  elif command -v fuser &>/dev/null; then
    fuser -n tcp "$port" 2>/dev/null | tr -s ' ' '\n' | grep -E '^[0-9]+$' || true
  else
    echo "Aviso: lsof/ss/fuser não encontrados — impossível inspecionar porta $port" >&2
    return 0
  fi
}

is_port_in_use() {
  [[ -n "$(_listeners_on_port "$1")" ]]
}

kill_port() {
  local port="$1"
  local pids
  pids=$(_listeners_on_port "$port")
  if [[ -n "$pids" ]]; then
    echo "$pids" | xargs kill 2>/dev/null || true
    sleep 1
    pids=$(_listeners_on_port "$port")
    if [[ -n "$pids" ]]; then
      echo "$pids" | xargs kill -9 2>/dev/null || true
    fi
  fi
}

# --- Comandos ---

cmd_setup() {
  local branch="${1:?Uso: worktree.sh setup <branch>}"
  local wt_dir
  wt_dir=$(worktree_path "$branch")

  if [[ -d "$wt_dir" ]]; then
    echo "Worktree já existe: $wt_dir"
    echo "Para rodar: ./scripts/worktree.sh dev $branch"
    exit 1
  fi

  require_jq

  echo "==> Criando worktree para '$branch' em $wt_dir..."
  git -C "$REPO_ROOT" fetch origin main
  git -C "$REPO_ROOT" worktree add -b "$branch" "$wt_dir" origin/main

  allocate_port "$branch"
  local site_port
  site_port=$(get_site_port "$branch")

  cd "$wt_dir"

  echo "==> Instalando dependências (pnpm install)..."
  pnpm install

  echo "==> Buildando pacotes do workspace..."
  pnpm turbo run build --filter='./packages/*'

  echo ""
  echo "Worktree pronto: $wt_dir"
  echo "  Branch: $branch"
  echo "  Site:   http://localhost:$site_port  (logs: $(log_file "$branch"))"
  echo ""
  echo "Para iniciar o dev server:"
  echo "  cd $wt_dir && ./scripts/worktree.sh dev $branch"
}

cmd_dev() {
  local branch
  branch=$(detect_branch "${1:-}")

  if [[ -z "$branch" ]]; then
    echo "Erro: não foi possível detectar a branch. Rode de dentro do worktree ou passe o nome da branch."
    echo "Uso: worktree.sh dev [branch]"
    exit 1
  fi

  require_jq
  ensure_registry

  local site_port wt_dir
  site_port=$(get_site_port "$branch")
  wt_dir=$(worktree_path "$branch")

  if [[ -z "$site_port" ]]; then
    echo "Erro: nenhuma porta alocada para '$branch'. Rode setup primeiro."
    exit 1
  fi

  if [[ ! -d "$wt_dir" ]]; then
    echo "Erro: worktree não encontrado em $wt_dir"
    exit 1
  fi

  if is_port_in_use "$site_port"; then
    echo "Aviso: porta $site_port já em uso. Matar processo? [y/N]"
    read -r answer
    if [[ "$answer" == "y" || "$answer" == "Y" ]]; then
      kill_port "$site_port"
    else
      echo "Abortado."
      exit 1
    fi
  fi

  local logfile
  logfile=$(log_file "$branch")

  echo "Iniciando site dev server para '$branch'..."
  echo "  Site: http://localhost:$site_port  (logs: $logfile)"
  echo ""

  cd "$wt_dir"

  # Sem o trap, Ctrl-C interrompe apenas o `tee` e deixa pnpm/vite órfãos
  # (a shell faz pipe cada lado num processo separado). pkill -P mata os
  # filhos deste shell ao receber INT/TERM.
  trap 'pkill -P $$ 2>/dev/null || true; exit 130' INT TERM
  pnpm --filter @medbench-brasil/site dev -- --port "$site_port" 2>&1 | tee "$logfile"
}

cmd_stop() {
  local branch
  branch=$(detect_branch "${1:-}")

  if [[ -z "$branch" ]]; then
    echo "Erro: não foi possível detectar a branch."
    echo "Uso: worktree.sh stop [branch]"
    exit 1
  fi

  require_jq
  ensure_registry

  local site_port
  site_port=$(get_site_port "$branch")

  if [[ -z "$site_port" ]]; then
    echo "Nenhuma porta registrada para '$branch'."
    exit 1
  fi

  if is_port_in_use "$site_port"; then
    echo "Matando site dev server na porta $site_port..."
    kill_port "$site_port"
  else
    echo "Site dev server não está rodando (porta $site_port livre)."
  fi
}

cmd_teardown() {
  local keep_branch=false
  local branch=""

  for arg in "$@"; do
    case "$arg" in
      --keep-branch) keep_branch=true ;;
      *) branch="$arg" ;;
    esac
  done

  if [[ -z "$branch" ]]; then
    echo "Uso: worktree.sh teardown [--keep-branch] <branch>"
    exit 1
  fi

  local wt_dir
  wt_dir=$(worktree_path "$branch")

  require_jq
  ensure_registry

  local site_port
  site_port=$(get_site_port "$branch" 2>/dev/null || echo "")

  if [[ -n "$site_port" ]] && is_port_in_use "$site_port"; then
    echo "Parando site dev server na porta $site_port..."
    kill_port "$site_port"
  fi

  if [[ -d "$wt_dir" ]]; then
    echo "Removendo worktree: $wt_dir"
    cd "$REPO_ROOT"
    git worktree remove "$wt_dir" --force
  fi

  if [[ "$keep_branch" == true ]]; then
    echo "Preservando branch local: $branch"
  elif git -C "$REPO_ROOT" show-ref --verify --quiet "refs/heads/$branch"; then
    # show-ref --verify faz match exato do ref — mais seguro que
    # branch --list | grep (substring-match em `feat/foo` × `feat/foobar`).
    echo "Apagando branch local: $branch"
    git -C "$REPO_ROOT" branch -d "$branch" 2>/dev/null || \
      git -C "$REPO_ROOT" branch -D "$branch"
  fi

  free_port "$branch"

  local logfile
  logfile=$(log_file "$branch")
  if [[ -f "$logfile" ]]; then
    rm -f "$logfile"
  fi

  echo "Teardown concluído para '$branch'."
}

cmd_logs() {
  local branch
  branch=$(detect_branch "${1:-}")

  if [[ -z "$branch" ]]; then
    echo "Erro: não foi possível detectar a branch."
    echo "Uso: worktree.sh logs [branch]"
    exit 1
  fi

  local logfile
  logfile=$(log_file "$branch")

  if [[ ! -f "$logfile" ]]; then
    echo "Arquivo de log não encontrado: $logfile"
    echo "Inicie o dev server primeiro: worktree.sh dev $branch"
    exit 1
  fi

  tail -f "$logfile"
}

cmd_list() {
  require_jq
  ensure_registry

  echo "Worktrees do medbench-brasil:"
  echo ""
  printf "  %-40s %-10s %-10s\n" "BRANCH" "SITE" "STATUS"
  printf "  %-40s %-10s %-10s\n" "------" "----" "------"

  local main_status="parado"
  if is_port_in_use "$SITE_PORT_BASE"; then
    main_status="rodando"
  fi
  printf "  %-40s %-10s %-10s\n" "main (default)" "$SITE_PORT_BASE" "$main_status"

  local branches
  branches=$(jq -r 'keys[]' "$PORT_REGISTRY" 2>/dev/null)

  for branch in $branches; do
    local site_port status wt_dir
    site_port=$(get_site_port "$branch")
    wt_dir=$(worktree_path "$branch")

    status="parado"
    if is_port_in_use "$site_port"; then
      status="rodando"
    fi

    if [[ ! -d "$wt_dir" ]]; then
      status="ausente"
    fi

    printf "  %-40s %-10s %-10s\n" "$branch" "$site_port" "$status"
  done

  echo ""
  echo "Registry: $PORT_REGISTRY"
}

cmd_help() {
  cat <<'HELP'
Uso: worktree.sh <comando> [branch]

Comandos:
  setup <branch>    Cria worktree em ../medbench-brasil-<branch>, instala deps,
                    builda pacotes do workspace, aloca porta para o site
  dev [branch]      Inicia o dev server do site na porta alocada
                    (auto-detecta branch pelo cwd)
  stop [branch]     Mata o dev server do site de um worktree
  teardown <branch> Para o dev server, remove o worktree, apaga a branch,
                    libera a porta. Use --keep-branch para preservar a branch.
  logs [branch]     Tail do log do site para um worktree
  list              Lista todos os worktrees com portas e status
  help              Mostra esta ajuda

Alocação de portas:
  Worktree main sempre usa site=4321.
  Cada novo worktree recebe uma porta única começando em 4331,
  incrementando de 10 em 10.

Exemplos:
  ./scripts/worktree.sh setup feat-novo-chart
  cd ../medbench-brasil-feat-novo-chart
  ./scripts/worktree.sh dev
  ./scripts/worktree.sh list
  ./scripts/worktree.sh teardown feat-novo-chart               # após merge
  ./scripts/worktree.sh teardown --keep-branch feat-novo-chart # preserva branch
HELP
}

# Trap global — cobre qualquer caminho de saída, inclusive sinais
# entre chamadas consecutivas de acquire/release. Idempotente.
trap '[[ -d "$PORT_LOCKDIR" ]] && rmdir "$PORT_LOCKDIR" 2>/dev/null || true' EXIT

# --- Main ---

command="${1:-help}"
shift || true

case "$command" in
  setup)    cmd_setup "$@" ;;
  dev)      cmd_dev "$@" ;;
  stop)     cmd_stop "$@" ;;
  teardown) cmd_teardown "$@" ;;
  logs)     cmd_logs "$@" ;;
  list)     cmd_list "$@" ;;
  help|-h|--help) cmd_help ;;
  *)
    echo "Comando desconhecido: $command"
    cmd_help
    exit 1
    ;;
esac
