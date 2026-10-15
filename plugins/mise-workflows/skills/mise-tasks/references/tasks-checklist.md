# Tasks Execution Checklist

## Read First

- `../../../references/tasks-core.md`
- `../../../references/anti-patterns.md`
- `../../../references/task-arguments.md`
- When needed, `../../../references/task-advanced.md`
- For release flows, `../../../references/release-workflow-patterns.md`

## Authoring Order

1. Keep each task's responsibility small.
2. Give every task `description`, `usage` (with `about "mise run <task>: <what it does>"`), and `run`.
3. Remove `mise exec <tool>@<version> --` from commands that use the `[tools]` version. Keep it only in tasks that need another version.
4. If the task takes arguments, add `arg` and `flag` to `usage` and read them in the script as `usage_*` variables.
5. When inputs and outputs are files, consider `sources` and `outputs`; for external state, consider `skip_if`.
6. Set `timeout` on external calls and integration tests.
7. Check that file task headers are formatter-safe (`#MISE`, `#USAGE`).
8. Make monorepo dependencies explicit with `//path:task` or `:task`.
9. Decide whether long-running workflows need an external orchestrator.
10. Verify with `mise tasks validate` and the `mise-review` validator.
