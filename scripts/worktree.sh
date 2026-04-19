#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PARENT_DIR="$(dirname "$REPO_ROOT")"
PORT_REGISTRY="/tmp/medbench-worktree-ports.json"
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

  local existing
  existing=$(jq -r --arg b "$branch" '.[$b].site // empty' "$PORT_REGISTRY" 2>/dev/null)
  if [[ -n "$existing" ]]; then
    return
  fi

  local max_slot=0
  while IFS= read -r slot; do
    if [[ -n "$slot" && "$slot" -gt "$max_slot" ]]; then
      max_slot="$slot"
    fi
  done < <(jq -r 'to_entries[] | .value.slot' "$PORT_REGISTRY" 2>/dev/null)

  local next_slot=$((max_slot + 1))
  local site_port=$((SITE_PORT_BASE + SITE_PORT_OFFSET + (next_slot - 1) * PORT_INCREMENT))

  jq --arg branch "$branch" \
     --argjson slot "$next_slot" \
     --argjson site "$site_port" \
     '. + {($branch): {slot: $slot, site: $site}}' \
     "$PORT_REGISTRY" > "${PORT_REGISTRY}.tmp" && mv "${PORT_REGISTRY}.tmp" "$PORT_REGISTRY"
}

get_site_port() {
  jq -r --arg b "$1" '.[$b].site // empty' "$PORT_REGISTRY" 2>/dev/null
}

free_port() {
  local branch="$1"
  ensure_registry
  jq --arg b "$branch" 'del(.[$b])' "$PORT_REGISTRY" > "${PORT_REGISTRY}.tmp" \
    && mv "${PORT_REGISTRY}.tmp" "$PORT_REGISTRY"
}

detect_branch() {
  if [[ -n "${1:-}" ]]; then
    echo "$1"
    return
  fi
  local dirname
  dirname=$(basename "$(pwd)")
  if [[ "$dirname" == medbench-brasil-* ]]; then
    # Reverter - para / só funciona se nunca houver dashes no nome; por isso
    # sempre passamos a branch explicitamente em setup/teardown
    echo "${dirname#medbench-brasil-}"
  else
    echo ""
  fi
}

is_port_in_use() {
  lsof -iTCP:"$1" -sTCP:LISTEN &>/dev/null
}

kill_port() {
  local port="$1"
  local pids
  pids=$(lsof -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null || true)
  if [[ -n "$pids" ]]; then
    echo "$pids" | xargs kill 2>/dev/null || true
    sleep 1
    pids=$(lsof -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null || true)
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
  elif git -C "$REPO_ROOT" branch --list "$branch" | grep -q "$branch"; then
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
