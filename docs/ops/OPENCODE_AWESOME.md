# Awesome OpenCode references for Entretien Prestige

This repo keeps a local snapshot of the Awesome OpenCode registry to make it easy to discover plugins, themes, agents, projects, and resources without leaving the repo.

Snapshot
- File: `docs/ops/opencode-awesome-registry.json`
- Source: `C:UsersadamDownloadsawesome-opencode-mainawesome-opencode-maindistegistry.json`
- Notes: Snapshot is sanitized to ASCII (em dash replaced with "-").

How to query
- `node scripts/opencode/registry-summary.mjs --counts`
- `node scripts/opencode/registry-summary.mjs --type plugins --query env --limit 20`
- `node scripts/opencode/registry-summary.mjs --type resources --query debug`
- `node scripts/opencode/registry-summary.mjs --json --type plugins --query context`

Recommended optional extensions (not installed)
- Envsitter Guard: https://github.com/boxpositron/envsitter-guard
- Dynamic Context Pruning: https://github.com/Tarquinen/opencode-dynamic-context-pruning
- CC Safety Net: https://github.com/kenryu42/claude-code-safety-net
- Shell Strategy: https://github.com/JRedeker/opencode-shell-strategy
- Opencode Ignore: https://github.com/lgladysz/opencode-ignore
- Opencode Notify: https://github.com/kdcokenny/opencode-notify
- Opencode Quota: https://github.com/slkiser/opencode-quota
- Tokenscope: https://github.com/ramtinJ95/opencode-tokenscope
- Opencode Sessions: https://github.com/malhashemi/opencode-sessions
- Opencode Skills: https://github.com/malhashemi/opencode-skills
- Opencode Worktree: https://github.com/kdcokenny/opencode-worktree
- Opencode Snippets: https://github.com/JosXa/opencode-snippets

Resources
- Debug Log to Text File: https://github.com/awesome-opencode/awesome-opencode/discussions/19
- GoTTY: https://github.com/sorenisanerd/gotty
- Opencode Config Starter: https://github.com/jjmartres/opencode

Notes
- These are optional external installs; do not enable without approval.

