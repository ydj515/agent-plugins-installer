# Env Core

## Purpose

This document defines the shared rules for designing `mise` `[env]` configuration and operating local overrides.

## Principles

- Treat `[env]` as the single source of truth for non-secret project configuration first.
- Application code always has defaults and works without `mise`.
- Use `env._.*` directives for loading files, extending PATH, and sourcing scripts.
- Keep local-only values in `mise.local.toml` or `mise.<env>.local.toml` and add them to `.gitignore`.
- Never put secrets or user-local paths in tracked config as plain text. For encryption or secret managers, see `references/secrets.md`.
- Keep the roles of `required`, `default`, `redact`, `tools`, and each directive separate.

## Value Forms

| Form | Example | Meaning |
| --- | --- | --- |
| value | `APP_PORT = "8000"` | Always set to this value |
| default | `NODE_ENV = { default = "development" }` | Keep an existing non-empty value |
| required | `DATABASE_URL = { required = "how to set it" }` | Another config or the environment must set it. Cannot be combined with `value` or `default` |
| sensitive | `API_KEY = { value = "...", redact = true }` | Masked in task output |
| after tools | `NODE_VERSION = { value = "{{ tools.node.version }}", tools = true }` | Evaluated after tools load |
| unset | `OLD_VAR = false` | Removes the variable |

- Values support both Tera v2 templates and shell-style expansion (`$VAR`, `${VAR:-default}`). Shell expansion is on by default (`env_shell_expand`).
- A value can reference only values defined above it in the same file, lower-precedence config, and the environment mise started with.
- `MISE_*` variables are read when mise starts, so setting them in `[env]` does not change that mise process. Set them in `[settings]` or the shell environment.

## Directives

- Load files: `_.file` (`.env`, `.json`, `.yaml`, `.toml`)
- Extend PATH: `_.path`. Do not use a `PATH` key in `[env]`; `mise exec` ignores it
- Source a shell script: `_.source` (Windows needs a POSIX bash)
- Python venv: `_.python.venv` (for uv projects, see `references/ecosystems/python-uv.md`)
- Directives run in the order written, and `_.python.venv` always runs last.

## Precedence

- `mise.local.toml` > `mise.toml`
- With `MISE_ENV=dev`: `mise.dev.local.toml` > `mise.local.toml` > `mise.dev.toml` > `mise.toml`
- Child directory config > parent directory config > global config

## Read Together With

- `env-patterns.md`
- `secrets.md`
- `hub-spoke-architecture.md`
- `monorepo-workspace.md`
- `github-tokens.md`

## Banned or Avoided Patterns

- Deprecated top-level `env_file`, `dotenv`, `env_path` (removed in 2027.4.0)
- Deprecated `env.mise.*` (removed in 2026.12.0), and `value`, `values` keys inside directive tables
- `redactions` inside `[env]`. `redactions` is a top-level key
- Adding local config or local lockfiles without `.gitignore` entries
- Coupling the entrypoint to `mise`, as in `mise exec -- script.py`

## Review Checklist

- Are local config (`mise.local.toml`, `mise.*.local.toml`) and local lockfiles (`mise.local.lock`, `mise.*.local.lock`) in `.gitignore`?
- Do `raw = true` tasks and `redact = true` not conflict? Raw tasks do not redact.
- Do scripts avoid assuming `mise` activation without environment variable defaults?
- Do `required` entries have help text where needed?
- In a monorepo, are root hub and spoke responsibilities separated?
