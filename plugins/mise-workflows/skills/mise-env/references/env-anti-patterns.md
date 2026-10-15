# Env Anti-Patterns

- Putting secrets or user-local paths directly in tracked config
- Adding `mise.local.toml` or `mise.local.lock` without `.gitignore` entries
- Putting `redactions` inside `[env]`
- Using `redact = true` together with raw-output tasks
- Declaring the deprecated `python.uv_venv_auto = true`, or declaring it alongside `_.python.venv`
- Using Tera v1 helpers (`trim_start_matches`, `as_str`) in new templates
- Setting `MISE_*` variables in `[env]` and expecting mise's behavior to change
- Coupling the entry point tightly to `mise`, as in `mise exec -- script.py`
- Relying only on shell activation in non-interactive jobs
- Overusing `exec()` for static values such as reading a token file
