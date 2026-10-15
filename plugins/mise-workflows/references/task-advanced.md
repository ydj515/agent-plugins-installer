# Task Advanced

## Watch Mode

- Prefer the runtime's native watch mode when it exists.
- Consider `mise watch` only for polyglot projects or when a shared watcher is needed. `mise watch` watches the task's `sources`.
- Pick how changes during a run are handled (`--on-busy-update`) from `do-nothing` (default), `queue`, `restart`, and `signal`. Dev servers usually use `restart` (`-r`).
- To watch generated files that `.gitignore` excludes, set `watch = { no_vcs_ignore = true }` on the task.

## Monorepo Tasks

Monorepo support is no longer experimental. Put this in the root config:

```toml
monorepo_root = true

[monorepo]
config_roots = ["packages/api", "packages/web", "services/*"]
```

- `experimental_monorepo_root` is deprecated and removed in 2027.12.0. Replace it with `monorepo_root`.
- Relying on automatic discovery without `config_roots` prints a deprecation warning. List the roots explicitly. Globs may match only one level (`services/*`).
- Task names carry a path from the root, such as `//packages/api:build`. `:build` means the nearest config root that encloses the current directory.
- Use `:build` instead of bare names in new configuration. Bare names resolve to the same config root but show the intent less clearly.
- Run several projects at once with the `...` and `*` wildcards: `mise run '//...:test'`. Quote the pattern to stop shell expansion.
- To allow missing projects: `depends = [{ task = "//...:test", optional = true }]`.
- Trusting the root also trusts the configs below it.

## Parallel / Sequential

- Run independent tasks together with `mise run a ::: b`
- Use `depends` for ordering and artifact dependencies
- Use `wait_for` to only wait for tasks that are already scheduled
- Limit concurrency with `-j/--jobs` or the `jobs` setting
- `raw = true` turns off output capture and redaction and blocks other commands while it runs, so use it only where needed
- Use `interactive = true` when the whole task must run without other tasks

## Timeout

- Per task: `timeout = "10m"`. It applies separately to each command in `run`.
- Whole run: `mise run --timeout` or the `task.timeout` setting. When both apply, the shorter one wins.

## Shell / Env / Tools

- Override `shell` per task only for Windows support or a special shell
- A task's `env` and `tools` apply only to that task and do not propagate to dependencies
- To pass variables to one dependency: `depends = ["NODE_ENV=test setup"]` or `{ task = "build", env = { ... } }`
- Manage global env in `[env]` and task-local values in `[tasks.<name>.env]`
- `mise install --include-task-tools` installs task tools ahead of time (CI caches, image builds)

## Artifact Cache (experimental)

- With `experimental = true`, `cache = { enabled = true }` stores a successful run's outputs and logs and restores them when the inputs match.
- List environment variables that affect the cache key in `cache.env`, and commands whose output does in `cache.command_inputs`.
- A remote cache can share results between machines. Confirm the experimental status and security boundary before adopting it as a team standard.

## Templates

Define repeated tasks in `[task_templates]` and inherit them with `extends`. Flags and file tasks can inherit templates too.

## Debugging

- `mise tasks validate`: checks dependency cycles, references to missing tasks, `usage` parse errors, invalid `timeout` values, and glob errors. It exits 1 on errors, so it can run in CI
- `mise tasks` / `mise tasks --all`
- `mise tasks deps`: the graph of `depends`, `depends_post`, and `wait_for`
- `mise run -n <task>`: dry run
- `mise tasks info <task>`
- When a task calls a separate shell script, also run the script directly
