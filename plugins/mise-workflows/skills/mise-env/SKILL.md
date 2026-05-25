---
name: mise-env
description: Design, review, or refactor a project's mise `[env]` configuration, local overrides, and secret-handling rules. Use when Codex needs to create or update environment variables in `mise.toml`, move deprecated env patterns to `env._.*`, or verify local config and `.gitignore` behavior.
---

# Mise Env

## Use This Skill

Use this skill to design or review the shared `[env]` layer of a `mise` configuration.

Use it when you need to:

- treat `[env]` as the single source of truth for non-secret project config
- migrate deprecated env patterns to `env._.*`
- separate tracked env from local-only overrides
- decide how `required`, `redact`, `file`, `source`, and `path` should behave
- set up Python venv auto-creation or workspace-aware env loading
- verify `.gitignore` and local config handling

Do not use this skill for tool selection, task composition, or runtime-specific vendor rules.

## Start Here

1. Read `../../references/env-core.md`.
2. Read `../../references/policy-core.md`.
3. Read `../../references/env-patterns.md` for directive, template, and venv patterns.
4. Read `references/env-core.md` for the local execution checklist.
5. Read `references/anti-patterns.md` before editing tracked local config behavior.
6. If monorepo or multi-account GitHub auth is involved, read the related root references.

## Workflow

1. Inspect `mise.toml`, `mise.local.toml`, and `.gitignore`.
2. Normalize deprecated top-level env keys into `env._.*` patterns.
3. Decide whether scripts still need fallback defaults to work without `mise`.
4. Keep secret exposure and local override behavior aligned with shared policy.
5. Hand off repeatable multi-step workflow design to `mise-tasks`.
6. Delegate runtime-specific env interpretation to sibling ecosystem skills only when necessary.

## Example Requests

- "이 저장소의 `[env]` 구성을 정리해줘."
- "local config가 추적되지 않게 만들고 싶어."
- "deprecated env 패턴이 있는지 찾아줘."
- "Python `.venv`를 `mise` 기준으로 자동 생성하게 해줘."
