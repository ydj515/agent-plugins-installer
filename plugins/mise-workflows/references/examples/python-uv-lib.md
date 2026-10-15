# python-uv-lib

## When to Use

- Python libraries or repositories centered on package distribution
- When a `pyproject.toml` build backend and a `uv` workflow are managed together
- When the build, package, and publish checks matter more than local development tasks

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

[tasks.install]
description = "Sync library dependencies and developer tools."
usage = '''
about "mise run install: sync library dependencies and developer tools"
'''
sources = ["pyproject.toml", "uv.lock"]
outputs = [".venv/pyvenv.cfg"]
run = "uv sync --frozen --all-extras"

[tasks.test]
description = "Run the test suite before building distribution artifacts."
usage = '''
about "mise run test: run the test suite before building distribution artifacts"
'''
depends = ["install"]
run = "uv run pytest"

[tasks.build]
description = "Build source and wheel distributions."
usage = '''
about "mise run build: build source and wheel distributions"
'''
depends = ["test"]
sources = ["pyproject.toml", "src/**"]
outputs = ["dist"]
run = "uv build"

[tasks.check-package]
description = "Verify generated distribution metadata."
usage = '''
about "mise run check-package: verify generated distribution metadata"
'''
depends = ["build"]
run = "uv run twine check dist/*"
```

## Notes

- Prioritize build artifact quality and publish readiness over an application entry point.
- Put `twine` in a dev dependency group. To use it only as a tool, declare `"pypi:twine"` in `[tools]`.
- Split the actual publish into a separate task that follows credential handling and release policy. Pass publish credentials only to the publish task.
- If a general app workflow is central, start from the `python-uv-app` example.
