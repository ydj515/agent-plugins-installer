# Env Patterns

## Purpose

This document collects the implementation patterns that recur when using `mise` `[env]` in real projects.

## Single Source of Truth

- Use `[env]` as the single entry point for non-secret settings where possible.
- Application code always has defaults and works without `mise`.
- `mise` is the configuration injection layer; the application is the layer that consumes the values.

## Python Virtualenvs

Pick exactly one of the two mechanisms.

| Mechanism | Use for | Location |
| --- | --- | --- |
| `_.python.venv` | Projects that do not use uv | `[env]` |
| `python.uv_venv_auto` | uv projects with a `uv.lock` | `[settings]` |

Projects without uv:

```toml
[env]
_.python.venv = { path = ".venv", create = true }
```

uv projects:

```toml
[settings]
python.uv_venv_auto = "create|source"
```

- `"source"` only activates the venv uv created; `"create|source"` also creates it when missing.
- `python.uv_venv_auto = true` warns since 2026.7.0 and is removed in 2027.7.0.
- The Python `virtualenv` tool option is deprecated too. Move it to `_.python.venv`.

## Special Directives

- `_.file`: loads `.env`, `.json`, `.yaml`, or `.toml` files. Missing files are skipped without an error.
- `_.path`: extends PATH with directories such as `bin` and `node_modules/.bin`.
- `_.source`: sources a bash script to compute the environment.
- `_.python.venv`: creates and activates a Python virtualenv.

Example:

```toml
[env]
_.file = [".env", { path = ".env.local", redact = true }]
_.path = ["bin", "node_modules/.bin"]
_.source = { path = "./scripts/dev-env.sh", redact = true }
```

## Tera v2 Templates

mise renders templates with Tera v2.

- Expressions: `{{ ... }}`
- Statements: `{% ... %}`
- Comments: `{# ... #}`

Common values:

- `config_root`: the project directory. It stays fixed when you run from a subdirectory
- `cwd`: the directory mise runs in
- `env.VAR`
- `tools.<name>.version`, `tools.<name>.path` (requires `tools = true`)
- `xdg_cache_home`, `xdg_config_home`

Common functions and filters:

- `read_file(path=...)`: relative paths resolve from the directory of the config that holds the template
- `env.NAME | default(value="...")`: prefer this over `get_env()`. `get_env()` cannot see `[env]` values
- `hash_file`, `snakecase`, `trim`, `trim_start(pat=...)`, `absolute`, `basename`

Changes from Tera v1 to v2:

- `trim_start_matches` → `trim_start`, `trim_end_matches` → `trim_end`
- `as_str` → `str`, `escape` → `escape_html`
- `slice(...)` → `items[0:2]`, `map(attribute=...)` → `[item.name for item in items]`
- v2 fails on undefined variables. Guard them with the `default` filter
- v1 helpers warn since 2026.10.0 and are removed in 2027.4.0

Prefer `read_file` for static file values. `exec()` runs on every render, so use it only when needed and with `cache_key` and `cache_duration`.

## Required / Default / Redact / tools = true

```toml
redactions = ["*_TOKEN", "*_KEY", "PASSWORD"]

[env]
NODE_ENV = { default = "development" }
DATABASE_URL = { required = true }
API_KEY = { required = "Request a key from the internal secret store and set it in mise.local.toml" }
_.file = { path = ".env.secrets", redact = true }
GEM_BIN = { value = "{{ env.GEM_HOME }}/bin", tools = true }
```

- `redactions` is a top-level key placed above `[env]`. Inside `[env]` it is treated as an ordinary variable.
- `required` stops `mise exec`, `mise run`, and `mise env` when the value is missing. An activated shell only warns.
- `default` does not overwrite an existing value.
- `redact` reduces exposure in task output and CI logs. `raw = true` tasks are not masked.
- Use `tools = true` only when a value must be computed after tools are installed.

## Application Default Pattern

Python:

```python
import os

timeout_seconds = int(os.environ.get("APP_TIMEOUT_SECONDS", "30"))
```

Bash:

```bash
timeout_seconds="${APP_TIMEOUT_SECONDS:-30}"
```

The point is that the same code path works without `mise`.

## Config Environments

- With `MISE_ENV=dev`, `mise.dev.toml` and `mise.dev.local.toml` are loaded as well.
- An environment lockfile (`mise.dev.lock`) holds only the tools that environment's config declares.
- The default environment can live in `.miserc.toml`. `.miserc.toml` needs no trust but cannot use `exec()` or `read_file()`.

## When to Hand Off to Tasks

Hand off to `mise-tasks` when you see these signals:

- Several steps run in order
- The workflow must be rerunnable
- build/test/release should be expressed as a DAG
- File tracking or watch mode is needed

## Review Questions

- Does `[env]` act as the single entry point for non-secret settings?
- Does the code run without `mise` thanks to defaults?
- Is exactly one of `_.python.venv` and `python.uv_venv_auto` chosen?
- Is `redactions` at the top level?
- Are there no Tera v1 helpers or undefined variable references left?
- Is there a simpler template expression than `exec()`?
