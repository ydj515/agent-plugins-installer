# Python UV

## Role

- Covers the uv selector, venv activation, lock workflow, and package build/publish flow.
- Python runtime selection is read together with a separate document.
- The difference between apps and libraries is shown concretely in the example documents.

## Principles

- Decide the uv selector floor within shared policy and the profile context.
- Read the Python runtime floor together with `references/ecosystems/python-runtime.md`.
- Explain `pyproject.toml` and `uv.lock` (application dependencies) separately from `mise.lock` (tool versions).
- In a workspace, treat `.venv` and dev dependencies from the root.

## Venv Activation

uv projects use `python.uv_venv_auto` instead of `_.python.venv`.

```toml
[tools]
python = "3.14"
uv = "0.13"

[settings]
python.uv_venv_auto = "create|source"

[env]
UV_PYTHON = { value = "{{ tools.python.path }}", tools = true }
```

- `"create|source"`: when the `.venv` next to the nearest `uv.lock` is missing, uv creates it, then mise activates it.
- `"source"`: only activates. Without a venv, mise warns that you should run `uv sync`.
- Without a `uv.lock`, the setting does nothing.
- Setting `UV_PYTHON` to mise's interpreter path makes uv use the Python mise selected instead of one it downloaded itself.
- `python.uv_venv_auto = true` is deprecated (removed in 2027.7.0). `true` exported only the version number in `UV_PYTHON`, so replace it with the pattern above.
- `UV_PROJECT_ENVIRONMENT` changes the venv path.

## Default Policy

- Recommended selector for new projects: `0.13`
- uv is still 0.x and behavior can change between minors, so write the minor
- Candidate as of 2026-10-16: `mise latest uv@0.13` → `0.13.1`
- The registry's `uv` uses the `aqua:astral-sh/uv` backend

## CLI Tools Installed with uv

To manage Python CLIs such as ruff or black as tools rather than project dependencies, use the `pypi:` backend (`pipx:` is an alias). Use the registry short name first when one exists (`ruff`). From lockfile format 2, the dependency graph of `pypi:` tools is pinned in a `uv.lock` sidecar (uv 0.12.10 or newer).

## Review Questions

- Does the profile actually require uv?
- Does the selector candidate match `mise ls-remote uv` or `mise latest uv@<selector>` output?
- Are `_.python.venv` and `python.uv_venv_auto` not used together?
- Did you distinguish an app/dev workflow from a build/publish workflow?

## Read Together With

- Python runtime policy: `references/ecosystems/python-runtime.md`
- Python app starter: `references/examples/python-uv-app.md`
- Python lib starter: `references/examples/python-uv-lib.md`
