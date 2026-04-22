#!/usr/bin/env bash
# Thin shim — the real implementation lives in @precisa-saude/worktree-cli.
# Keep this path for muscle memory; invoke the CLI directly if you prefer:
#   pnpm exec precisa-worktree <command> [args]
exec pnpm exec precisa-worktree "$@"
