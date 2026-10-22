#!/bin/bash
# Cloud sessions (Claude Code on the web) start without node_modules; install them once.
# Local sessions are left alone. --ignore-scripts skips the Supabase CLI binary download,
# which lint, typecheck and build do not need.
[ "$CLAUDE_CODE_REMOTE" = "true" ] || exit 0
cd "$CLAUDE_PROJECT_DIR" || exit 0
[ -d node_modules ] && exit 0
echo "Installing packages for this cloud session (npm ci --ignore-scripts)..." >&2
npm ci --ignore-scripts --no-audit --no-fund >&2 || echo "npm ci failed; run it manually before building." >&2
exit 0
