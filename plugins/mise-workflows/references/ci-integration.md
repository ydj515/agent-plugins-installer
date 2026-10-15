# CI Integration

## Purpose

This document describes how CI and container builds reproduce the same toolchain with `mise`. For operating the lockfile itself, see `lockfile.md`.

## Principles

- Keep tool versions in the repository's `mise.toml` and `mise.lock`, not in workflow files.
- CI installs with `mise install --locked`.
- CI calls a single task entry point such as `mise run ci`, and the steps live in `[tasks]`.
- Never restore caches written by untrusted refs.

## GitHub Actions

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: jdx/mise-action@v5
      - run: mise run ci
```

- When the repository has a `mise.lock`, the action adds `--locked` automatically.
- Pin mise with the `version` input, and select a subproject with the `working_directory` input.
- The action registers redacted values as GitHub masks.
- The action uses the workflow token only while installing and does not export it to later steps. Pass a token yourself when later steps call the GitHub API heavily.
- `mise generate github-action --write --task=ci` creates a starter workflow. Review the triggers and action versions before committing it.

## Cache Strategy

A cache of installed tools is trusted as is. With a lockfile, caching the download store is safer, because mise checks each file against the lockfile checksum.

```yaml
steps:
  - uses: actions/checkout@v7
  - uses: actions/cache@v6
    with:
      path: ~/.cache/mise/downloads-cas
      key: mise-downloads-${{ runner.os }}-${{ hashFiles('mise.lock') }}
  - uses: jdx/mise-action@v5
    with:
      cache: false
```

If you keep caching installed tools, record a manifest in trusted metadata outside the cache and compare it after restoring.

## GitLab CI and Other CI

- On GitLab, use a committed wrapper or the official image, and put `mise.lock` in `cache:key:files`.
- On other CI providers, commit the `bin/mise` wrapper created by `mise generate install-script --localize --write`. The wrapper downloads and verifies a pinned mise release and keeps tools and caches under `.mise/`. Add `.mise/` to `.gitignore`.
- On any CI, run `mise install --locked` again after restoring a cache to install anything missing. The job must also succeed with an empty cache.

## Docker

- COPY `mise.toml` and `mise.lock` (and the `.mise/locks` directory when needed) before `mise install`.
- Official Docker images exist and can serve as a base image.

## Untrusted Branches

- When mise detects a CI environment, it trusts every config unless paranoid mode is on. Tasks, hooks, and `[env]` from the checked-out branch run as is.
- When a job holding secrets reads branches you did not write (fork PRs, lockfile bump bots), run it with `MISE_SAFE=1`. Tasks, `exec()`, plugin installs, hooks, and project env and settings are blocked.
- Safe mode is meant for resolution commands such as `mise lock`, `mise ls`, `mise env`, and `mise outdated`. `mise install` can run source build scripts, so decide on it separately.

## Project Diagnostics

Declare conditions that tool versions alone cannot cover (native libraries, database connections, and so on) in `[doctor.checks]` and run them with `mise doctor project`.

```toml
[doctor.checks.openssl]
description = "OpenSSL development files are discoverable"
run = "pkg-config --exists openssl"
hint = "Install the OpenSSL development package for this OS."
timeout = "5s"
os = ["linux", "macos"]
```

- Checks never run on their own. Call them explicitly early in CI or in onboarding instructions.
- One failing check does not stop the others.

## Review Questions

- Are tool versions free of hardcoding in workflow files?
- Does CI install with `--locked`?
- Are caches saved only from trusted refs, and is the download store cached where possible?
- Do fork PR and bot jobs read config in safe mode?
- Are `mise tasks validate` and the `mise-review` validator part of CI validation?
