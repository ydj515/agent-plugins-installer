# Task Patterns

## Hidden Helper Tasks

Split repeated validation and destructive guards into hidden helper tasks.

```toml
[tasks._check-env]
hide = true
description = "Validate required environment variables."
usage = '''
about "mise run _check-env: fail when API_KEY is missing"
'''
run = '[ -n "$API_KEY" ] || { echo "Missing API_KEY"; exit 1; }'
```

If you only need to check that a value exists, `[env] API_KEY = { required = "..." }` is shorter. Use helper tasks to check combinations of values or external state.

## Incremental Builds

When inputs and outputs are files, skip reruns with `sources` and `outputs`.

```toml
[tasks.build]
description = "Compile the CLI when sources change."
usage = '''
about "mise run build: compile the CLI, skipped when sources are unchanged"
'''
sources = ["Cargo.toml", "src/**/*.rs", "!src/**/*_test.rs"]
outputs = ["target/debug/mycli"]
run = "cargo build"
```

- Entries that start with `!` are excluded. A later entry can include a file again.
- The config file and script that define the task always count as sources.
- `mise run --force` ignores the freshness check.

## Skipping Based on External State

```toml
[tasks.setup]
description = "Initialize the workspace once."
usage = '''
about "mise run setup: initialize the workspace unless it already exists"
'''
skip_if = "examplectl workspace show"
run = "examplectl workspace init"
```

- When the `skip_if` command exits 0, the task is skipped and counted as successful.
- Its output is discarded and it gets no stdin, so do not use commands that prompt.
- Check conditions that should fail the task in `run`, not in `skip_if`.

## Cleanup

```toml
[tasks.integration-test]
description = "Run integration tests against local services."
usage = '''
about "mise run integration-test: start services, run integration tests, then stop services"
'''
depends = ["services:up"]
depends_post = ["services:down"]
timeout = "15m"
run = "./scripts/integration-test.sh"
```

`depends_post` runs after the task starts, whether it succeeds or fails.

## CI / Quality Pipeline

- `lint` and `typecheck` can run in parallel.
- `test` reads best after the quality gates.
- `build`, which produces artifacts, comes after that.
- In CI, provide a single entry point such as `mise run ci`, and have the workflow file call only that task.

## Development Server

- If the framework has its own watch mode, wrap the framework command as is.
- Make a `mise` task the dev server entry point only when a shared wrapper is needed.
- Supporting services such as a database or queue can be grouped with experimental `daemons` and the task's `daemons` property. Confirm the experimental status before adopting it as a team standard.

## Long-Running Remote Workflows

Do not orchestrate long flows such as SSH sessions, batch queues, or remote GPU jobs with `depends` alone.

- Use an external queue or job runner when persistence is needed
- Keep `mise` tasks as submit/status/cancel entry points
- Give each entry point a `timeout`

## Review Questions

- Are hidden helpers and user-facing tasks separated?
- Do CI, build, and release flows read in terms of artifacts?
- Did `sources`, `outputs`, or `skip_if` cut needless reruns?
- Is no long-running workflow tied to the lifetime of a shell session?
