---
name: mise-review
description: Review and lint mise configuration files against shared workflow rules, ecosystem-specific rules, and project policy. Use when Codex needs to inspect `mise.toml`, `mise.*.toml`, conf.d fragments, file tasks, `.gitignore`, `mise.lock`, or version files and report rule violations in JSON and human-readable formats.
---

# Mise Review

## Use This Skill

Use this skill to run a structured review over `mise`-related files and produce consistent diagnostics.

Use it when you need to:

- inspect `mise.toml`, `mise.*.toml`, conf.d fragments, file tasks, `.gitignore`, `mise.lock`, or version files
- produce JSON diagnostics
- produce human-readable terminal diagnostics
- flag deprecated syntax with its removal version
- flag version requests that are not aligned with `mise ls-remote` / shared policy
- enforce the task definition rule (`description`, `usage` with `about`, `run`)
- route follow-up fixes to the right core skill and ecosystem reference

Do not use this skill as the primary place to restate every runtime or framework rule in depth.

## Start Here

1. Read `../../references/rules.md`.
2. Read `../../references/profile-catalog.md`.
3. Read `references/review-contract.md` for the report contract.
4. If the review touches env topics, read `../../references/env-core.md` and `../../references/env-patterns.md`.
5. If the review touches task topics, read `../../references/tasks-core.md`, `../../references/task-arguments.md`, and `../../references/task-patterns.md`.
6. If the review touches lockfiles or CI, read `../../references/lockfile.md` and `../../references/ci-integration.md`.
7. Run `scripts/validate_mise_toml.py` rather than inventing ad-hoc output.

## Review Flow

1. Gather `mise.toml`, local overrides, conf.d fragments, file tasks, `.gitignore`, `mise.lock`, and related version files.
2. Run `python3 scripts/validate_mise_toml.py --format json <repo>`.
3. Run `mise tasks validate` when mise is installed and the config is trusted.
4. Group diagnostics by rule family and owner skill.
5. Route follow-up work to core skills and the relevant ecosystem references.

## Example Requests

- "Review this `mise.toml`."
- "Report rule violations as JSON."
- "Find deprecated mise syntax."
- "Tell me which skill to read to fix each issue."
