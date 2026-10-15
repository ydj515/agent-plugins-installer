# Monorepo Workspace

## Purpose

This document describes how to run `mise` together with workspace tools in `uv` workspaces and multi-package repositories.

## mise Monorepo Setup

```toml
monorepo_root = true

[monorepo]
config_roots = ["packages/*"]
lockfile = true
```

- mise loads only the directories listed in `config_roots`. Recursive globs (`**`), absolute paths, and `..` are ignored.
- With `lockfile = true`, subproject tools are collected in the root lockfile. See `lockfile.md`.
- `mise install --monorepo` and `mise ls --monorepo` require `config_roots`.

## Python uv Workspace

- Create `.venv` once at the workspace root where possible. `python.uv_venv_auto` finds the nearest `uv.lock`, so the `.venv` next to the root `uv.lock` is used.
- Hoisting dev dependencies to the root `pyproject.toml` is easier to manage.
- Child packages share the runtime policy and manage only their own package metadata.

## Root-Centered Layout

The root usually holds:

- The shared `mise.toml` and `mise.lock`
- The workspace root `pyproject.toml`
- The shared `uv.lock`
- The shared dev dependency group

Child packages usually hold:

- A per-package `pyproject.toml`
- Per-package tasks or extra env

## Connecting to Monorepo Tasks

- Root tasks handle bootstrap, lint-all, test-all, and release orchestration. A wildcard such as `mise run '//...:test'` runs every project.
- Child tasks handle package-local build/test/run.
- To run only changed projects, consider the `--affected` options.
- Read `task-advanced.md` for the detailed task rules.

## Review Questions

- Is it clear whether `.venv` is shared at the workspace root or split per package?
- Are dev dependencies free of duplication?
- Are root and package responsibilities separated?
- Are `config_roots` and the lockfile policy explicit?
