---
name: mise-tasks
description: Design, review, or refactor mise task definitions, task arguments, file tasks, and monorepo task composition. Use when Codex needs to create or update `[tasks]` entries, convert shell scripts into structured mise tasks, enforce the description/usage/run task rule, or validate task argument, caching, and dependency patterns.
---

# Mise Tasks

## Use This Skill

Use this skill to design or review `mise` task structure.

Use it when you need to:

- create or refactor `[tasks]`
- give every task a `description`, a `usage` spec with `about`, and a `run` command
- normalize task arguments with `usage` and migrate away from deprecated Tera `arg()`, `option()`, `flag()`
- skip unchanged work with `sources`, `outputs` or `skip_if`, and bound runtime with `timeout`
- define file task headers that survive formatters
- keep monorepo dependencies explicit with `//path:task` names
- design release DAGs or watch-mode entrypoints

Do not use this skill for tool selector policy or language runtime rules.

## Task Definition Rule

Every task must set `description`, `usage`, and `run`. Put `about "mise run <task>: <what it does>"` in `usage` even when the task takes no arguments.

```toml
[tasks.test]
description = "Run the unit test suite."
usage = '''
about "mise run test: run unit tests, optionally filtered by name"
flag "--filter <pattern>" help="Only run tests matching the pattern"
'''
run = 'uv run pytest ${usage_filter:+-k "$usage_filter"}'
```

## Tool Execution Rule

`mise run` activates the `[tools]` versions on PATH. Do not wrap commands in `mise exec` when they use the same version as `[tools]`; write `npm test`, not `mise exec node@24 -- npm test`. Use `mise exec <tool>@<version> --` only when a task needs a different version than `[tools]`, such as a version matrix task. A prefix like `node@24` can resolve to a different installed 24.x and bypass the pinned `[tools]` version.

## Start Here

1. Read `../../references/tasks-core.md`.
2. Read `../../references/task-arguments.md` and `../../references/task-patterns.md`.
3. Read `references/tasks-checklist.md` for the execution checklist.
4. Read `references/task-anti-patterns.md` before changing legacy task argument flows.
5. If the repository is a monorepo, read `../../references/monorepo-workspace.md` and `../../references/task-advanced.md`.
6. If the repository has release automation, read `../../references/release-workflow-patterns.md`.

## Workflow

1. Inspect `mise.toml`, file tasks, and any project scripts.
2. Split tasks by responsibility instead of accumulating giant shell strings.
3. Apply the task definition rule to every task, including hidden helpers.
4. Remove `mise exec` wrappers that repeat the `[tools]` version; keep them only for tasks that need another version.
5. Prefer `usage` arguments, explicit dependency syntax, and `sources`, `outputs` where inputs are files.
6. Coordinate with `mise-profiles` when task conventions vary by project type.
7. Route environment loading strategy back to `mise-env` when secrets or local overrides are involved.
8. Verify with `mise tasks validate` and the `mise-review` validator.

## Example Requests

- "Clean up this project's mise tasks."
- "Fill in description, usage, and run for every task."
- "Check whether the file task comments are safe."
- "Switch monorepo task dependencies to the `//path:task` form."
- "Rebuild the release task DAG around `mise`."
