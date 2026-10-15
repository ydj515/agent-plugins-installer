# Python Runtime

## Role

- Covers the Python runtime selector floor and version file strategy.
- Covers consistency between `.python-version` and the tracked `mise.toml`.
- Does not own the uv lock and publish workflow.

## Principles

- Decide the Python selector floor from the profile and shared policy together.
- Pick one source of truth between `.python-version` and the tracked `mise.toml`. In the same directory, `mise.toml` wins.
- `.python-version` is read only after adding `python` to `idiomatic_version_file_enable_tools`.
- In a workspace, settle the root `.venv` and hoisted dev dependency strategy first.
- Read package manager conventions together with `references/ecosystems/python-uv.md`.
- mise downloads precompiled python-build-standalone builds by default. Use source builds (`python.compile`) only for a specific reason.

## Default Policy

- Recommended selector for new projects: `3.14`
- Minimum floor: `3.13`. 3.12 and older receive only security fixes, so do not adopt them for new work
- Adopt a new minor (for example, 3.15) after confirming support in key dependencies
- Candidates as of 2026-10-16: `mise latest python@3.14` → `3.14.8`, `mise latest python@3.13` → `3.13.16`, `mise latest python@3` → `3.15.0`

## Review Questions

- Does the selector candidate match `mise ls-remote python` output?
- Is the selector not below the profile floor?
- Do the version file strategy and `mise.toml` agree?
- Are workspace root and package subdirectory responsibilities separated?

## Read Together With

- uv selector and lock workflow: `references/ecosystems/python-uv.md`
- Python app starter: `references/examples/python-uv-app.md`
- Python lib starter: `references/examples/python-uv-lib.md`
