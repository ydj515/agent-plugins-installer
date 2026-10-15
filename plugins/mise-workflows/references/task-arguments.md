# Task Arguments

## Principles

- Define task arguments with a `usage` spec.
- Tera `arg()`, `option()`, and `flag()` are deprecated and removed in mise 2027.5.0. Do not use them in new code.
- When cleaning up existing tasks, set `task.disable_spec_from_run_scripts = true` (or `MISE_TASK_DISABLE_SPEC_FROM_RUN_SCRIPTS=1`) so mise reads only `usage`, and check what is missing.
- The argument definition and the way the script reads it must match.

## Example

```toml
[tasks.deploy]
description = "Deploy a version to the given environment."
usage = '''
about "mise run deploy <environment>: deploy the given version to an environment"
arg "<environment>" help="Target environment" {
  choices "dev" "staging" "prod"
}
flag "--version <version>" help="Explicit version"
flag "--dry-run" help="Validate without deploying"
'''
run = "./scripts/deploy.sh"
```

Each argument and flag reaches the script as a `usage_<name>` environment variable. A `-` in the name becomes `_` (`--dry-run` → `usage_dry_run`).

```bash
#!/usr/bin/env bash
set -euo pipefail

environment="${usage_environment?}"
version="${usage_version:-}"
dry_run="${usage_dry_run:-false}"

if [ "$dry_run" = "true" ]; then
  echo "dry run for $environment"
fi
```

## Variable Access Rules

| Expression | Use for |
| --- | --- |
| `${usage_x?}` | Required arguments, or arguments and flags with a `default` |
| `${usage_x:-false}` | Boolean flags without a `default` |
| `${usage_x:-}` | Optional arguments without a `default` |
| `${usage_x:?}` | Values that must not be empty |

- Compare booleans with `= "true"`.
- mise clears `usage_*` variables inherited from the calling environment. Do not rely on values from a parent process.

## Using Arguments in Templates

- `run`, `sources`, `outputs`, and `depends` can reference arguments as `{{ usage.name }}`.
- To pass an argument to a dependency: `depends = [{ task = "build", args = ["{{ usage.app }}"] }]`. Both tasks need a `usage` spec.

## Recommended Patterns

- Every task's `usage` starts with `about "mise run <task>: <what it does>"`. Keep `about` even when there are no arguments (the Task Definition Rule in `tasks-core.md`).
- Use `choices` when the options are clear.
- Keep long usage in a TOML literal multiline string (`'''`).
- Remember that help text is context for agents as well as people.

## Patterns to Avoid

- Reimplementing positional argument parsing by hand inside the shell
- Having different required/optional rules in usage and in the script
- Burying the argument contract inside `run = "bash -c '...'"`
- Mixing the `usage` map with deprecated Tera helpers in one task
