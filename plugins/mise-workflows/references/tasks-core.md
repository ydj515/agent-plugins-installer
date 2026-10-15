# Tasks Core

## Purpose

This document defines the shared rules for `mise` task design, file tasks, and monorepo task composition.

## Principles

- Name tasks so their purpose is obvious. Quote names that contain `:` in TOML: `[tasks."release:build"]`.
- Never leave `description` empty; people and agents both read it as context.
- Define arguments with a `usage` spec. Tera `arg()`, `option()`, and `flag()` are deprecated and removed in 2027.5.0.
- File tasks use formatter-safe headers (`#MISE`, `# MISE`, `# [MISE]`).
- Make monorepo dependencies explicit with `//path:task` or `:task`.
- Design long-running workflows so they do not depend on a shell session.

## Task Definition Rule (required)

Every task must set `description`, `usage`, and `run`. Tasks without arguments still put `about` in `usage`.

```toml
[tasks.test]
description = "Run the unit test suite."
usage = '''
about "mise run test: run unit tests, optionally filtered by name"
flag "--filter <pattern>" help="Only run tests matching the pattern"
'''
run = 'uv run pytest ${usage_filter:+-k "$usage_filter"}'
```

- `description`: the one-line purpose shown in `mise tasks`
- `about` in `usage`: how to run it, shown on the first line of `mise run <task> --help`. Write it as `"mise run <task>: <what it does>"`
- `arg` and `flag` in `usage`: add them only when the task takes arguments
- `run`: the actual command. Orchestrators that only combine other tasks also set `run`, either with `depends` (for example, printing a completion message) or as task steps such as `run = [{ task = "start" }]`
- Tasks that run a script file connect it through `run`, as in `run = "./scripts/x.sh"`. Tasks that use the `file` property may use `file` instead of `run`
- File tasks follow the same rule in their headers: `#MISE description="..."`, `#USAGE about "mise run <task>: ..."`, and the script body
- Hidden helper tasks (`hide = true`) follow the same rule
- Wrap `usage` in a TOML literal string (`'''`) so quotes inside the KDL need no escaping

The `mise-review` validator checks this rule as `MWT002` (policy-error).

## Tool Execution Rule (required)

`mise run` activates the `[tools]` versions on PATH when it runs a task. Do not use `mise exec` for commands that run with the same version as `[tools]`.

```toml
[tools]
node = "24.19.0"

[tasks.test]
description = "Run the automated test suite."
usage = '''
about "mise run test: run the automated test suite with the configured Node version"
'''
run = "npm test"

[tasks.test-node22]
description = "Run the automated test suite on Node 22."
usage = '''
about "mise run test-node22: run the automated test suite on Node 22"
'''
run = "mise exec node@22 -- npm test"
```

- When the version matches `[tools]`, write only the command, such as `npm test` or `node src/cli.js`.
- Use `mise exec <tool>@<version> --` only when a task needs a different version than `[tools]` (for example, a version matrix task).
- Repeating the same version as a prefix, as in `mise exec node@24 --`, can resolve to a different installed 24.x instead of the `24.19.0` pinned in `[tools]`. It bypasses the pin, so do not use it.
- If a single task needs a different version and it is not a matrix, also consider the task's `tools` property (`tools.node = "22"`). `mise lock` records versions declared through `tools` in the lockfile.

## Task Properties

| Group | Properties |
| --- | --- |
| Command | `run`, `run_windows`, `file`, `shell`, `dir`, `usage`, `extends` |
| Description and visibility | `description`, `alias`, `hide`, `confirm` |
| Ordering | `depends`, `depends_post`, `wait_for` |
| Environment and tools | `env`, `vars`, `tools`, `secrets` (experimental) |
| Skipping work | `skip_if`, `sources`, `outputs`, `cache` (experimental) |
| Execution | `timeout`, `raw`, `interactive` |
| Output | `output`, `quiet`, `silent` |

## Recommended Patterns

- Keep short flows in `[tasks]`
- Move repeated or long shell into separate scripts or file tasks
- For builds with clear input files, cut needless reruns with `sources` and `outputs`
- Decide state that files cannot express (whether an external tool is initialized) with `skip_if`
- Run cleanup with `depends_post`, regardless of success or failure
- Declare task-only tools with `tools` and include them in the lockfile with `mise lock`
- Split validation and guards into hidden helper tasks
- Set `timeout` on remote calls and integration tests that can run long
- Write release DAGs explicitly and guarantee build artifacts before publishing
- Share repeated task definitions with `[task_templates]` and `extends`

## Read Together With

- `task-arguments.md`
- `task-advanced.md`
- `task-patterns.md`
- `release-workflow-patterns.md`

## Patterns to Avoid

- Deprecated Tera argument helpers (`arg()`, `option()`, `flag()`)
- Bare dependency names scattered across a monorepo
- File task comments that formatters break
- A single task that mixes too many responsibilities
- Long-running remote workflows chained only through `depends`
- Overly broad `sources` globs that add file-check cost to every run

## Review Checklist

- Does every task have `description`, `usage` (with `about`), and `run`?
- Are commands that use the `[tools]` version free of unnecessary `mise exec`?
- Do tasks match the profile's conventions?
- Is argument handling unified on `usage`?
- Is long-running shell split into reusable scripts?
- Do release and publish tasks guarantee the build dependency and artifact validation?
- Do `sources` and `outputs` reflect the real inputs and outputs?
- Do tasks with external calls have a `timeout`?
