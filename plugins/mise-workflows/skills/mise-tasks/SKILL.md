---
name: mise-tasks
description: Design, review, or refactor mise task definitions, task arguments, file tasks, and monorepo task composition. Use when Codex needs to create or update `[tasks]` entries, convert shell scripts into structured mise tasks, or validate task argument and dependency patterns.
---

# Mise Tasks

## Use This Skill

Use this skill to design or review `mise` task structure.

Use it when you need to:

- create or refactor `[tasks]`
- write richer task `description` fields for discoverability
- normalize task arguments and `usage`
- define file task headers that survive formatters
- keep monorepo dependencies explicit and readable
- design release DAGs or watch-mode entrypoints

Do not use this skill for tool selector policy or language runtime rules.

## Start Here

1. Read `../../references/tasks-core.md`.
2. Read `../../references/task-arguments.md` and `../../references/task-patterns.md`.
3. Read `references/tasks-core.md` for the execution checklist.
4. Read `references/anti-patterns.md` before changing legacy task argument flows.
5. If the repository is a monorepo or has release automation, read the advanced/release references.

## Workflow

1. Inspect `mise.toml`, file tasks, and any project scripts.
2. Split tasks by responsibility instead of accumulating giant shell strings.
3. Add or improve `description` so intent, inputs, and outputs are explicit.
4. Prefer modern argument handling and explicit dependency syntax.
5. Coordinate with `mise-profiles` when task conventions vary by project type.
6. Route environment loading strategy back to `mise-env` when secrets or local overrides are involved.

## Example Requests

- "이 프로젝트의 mise task를 정리해줘."
- "file task comment가 안전한지 봐줘."
- "monorepo task dependency를 더 명시적으로 만들고 싶어."
- "release task DAG를 `mise` 기준으로 재구성해줘."
