# python-uv-app

## When to Use

- General Python applications
- Repositories that manage `pyproject.toml` and `uv.lock` together
- When automatic local `.venv` creation and a `uv sync` workflow are needed

## Selectors

- Python runtime: `3.14`
- uv: `0.13`

The exact candidates on 2026-10-16 were:

- `mise latest python@3.14` -> `3.14.8`
- `mise latest uv@0.13` -> `0.13.1`

## Example `mise.toml`

```toml
min_version = "2026.7.0"

[tools]
python = "3.14"
uv = "0.13"

[settings]
lockfile = true
python.uv_venv_auto = "create|source"

[env]
UV_PYTHON = { value = "{{ tools.python.path }}", tools = true }
APP_ENV = { default = "development" }
APP_PORT = "8000"

[tasks.install]
description = "Sync Python dependencies into the project virtual environment."
usage = '''
about "mise run install: sync Python dependencies into the project virtual environment"
'''
sources = ["pyproject.toml", "uv.lock"]
outputs = [".venv/pyvenv.cfg"]
run = "uv sync --frozen"

[tasks.lint]
description = "Run static analysis and formatting checks."
usage = '''
about "mise run lint: run static analysis and formatting checks"
'''
depends = ["install"]
run = "uv run ruff check . && uv run ruff format --check ."

[tasks.test]
description = "Run the automated test suite in the local uv environment."
usage = '''
about "mise run test: run the automated test suite in the local uv environment"
'''
depends = ["install"]
run = "uv run pytest"

[tasks.dev]
description = "Run the application in local development mode."
usage = '''
about "mise run dev: run the application in local development mode"
'''
depends = ["install"]
run = "uv run python -m app"

[tasks.ci]
description = "Run the full verification pipeline used by CI."
usage = '''
about "mise run ci: run the full verification pipeline used by CI"
'''
depends = ["lint", "test"]
run = "echo ci passed"
```

## Notes

- Set `min_version` to a release that supports the `python.uv_venv_auto = "create|source"` form.
- Do not add `_.python.venv` as well. uv projects manage the venv with `python.uv_venv_auto` alone.
- Requests stay human-readable ranges and patch resolution is left to `mise.lock`. Commit `mise.lock`.
- `uv sync --frozen` requires `uv.lock` in the repository.
- `install` is skipped through `sources` and `outputs` when dependencies have not changed.
- For package publishing repositories, review `python-uv-lib` and the release task patterns as well.
