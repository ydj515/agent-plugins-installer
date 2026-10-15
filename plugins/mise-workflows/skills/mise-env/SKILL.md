---
name: mise-env
description: Design, review, or refactor a project's mise `[env]` configuration, local overrides, secrets, and template usage. Use when Codex needs to create or update environment variables in `mise.toml`, migrate deprecated env syntax (`env_file`, `env.mise.*`, Tera v1 helpers, `python.uv_venv_auto = true`), choose a secrets approach, or verify local config and `.gitignore` behavior.
---

# Mise Env

## Use This Skill

Use this skill to design or review the shared `[env]` layer of a `mise` configuration.

Use it when you need to:

- treat `[env]` as the single source of truth for non-secret project config
- migrate deprecated env syntax to `env._.*` directives and Tera v2 templates
- separate tracked env from local-only overrides and config environments (`MISE_ENV`)
- decide how `required`, `default`, `redact`, `tools`, `_.file`, `_.source`, and `_.path` should behave
- choose between `mise.local.toml`, SOPS, age, and fnox task secrets
- pick one Python venv mechanism (`_.python.venv` or `python.uv_venv_auto`)
- verify `.gitignore` and local config handling

Do not use this skill for tool selection, task composition, or runtime-specific vendor rules.

## Start Here

1. Read `../../references/env-core.md`.
2. Read `../../references/policy-core.md`.
3. Read `../../references/env-patterns.md` for directive, template, and venv patterns.
4. Read `references/env-checklist.md` for the local execution checklist.
5. Read `references/env-anti-patterns.md` before editing tracked local config behavior.
6. If secrets are involved, read `../../references/secrets.md`.
7. If the repository is a monorepo, read `../../references/hub-spoke-architecture.md`.
8. If multi-account GitHub auth or mise's own GitHub token is involved, read `../../references/github-tokens.md`.

## Workflow

1. Inspect `mise.toml`, `mise.local.toml`, `mise.<env>.toml`, and `.gitignore`.
2. Normalize deprecated env syntax into `env._.*` directives and move `redactions` to the top level.
3. Replace Tera v1 helpers and guard undefined variables with `default`.
4. Decide whether scripts still need fallback defaults to work without `mise`.
5. Keep secret exposure and local override behavior aligned with shared policy.
6. Hand off repeatable multi-step workflow design to `mise-tasks`.
7. Delegate runtime-specific env interpretation to ecosystem references only when necessary.

## Example Requests

- "Clean up this repository's `[env]` setup."
- "Keep local config out of version control."
- "Find deprecated env patterns or Tera v1 syntax."
- "Auto-activate `.venv` through `mise` in a uv project."
- "Choose between SOPS and fnox for secrets."
