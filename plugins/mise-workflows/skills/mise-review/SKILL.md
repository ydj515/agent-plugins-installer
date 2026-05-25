---
name: mise-review
description: Review and lint mise configuration files against shared workflow rules, ecosystem-specific rules, and project policy. Use when Codex needs to inspect `mise.toml`, `mise.*.toml`, file tasks, `.gitignore`, or version files and report rule violations in JSON and human-readable formats.
---

# Mise Review

## Use This Skill

Use this skill to run a structured review over `mise`-related files and produce consistent diagnostics.

Use it when you need to:

- inspect `mise.toml`, `mise.*.toml`, file tasks, `.gitignore`, or version files
- produce JSON diagnostics
- produce human-readable terminal diagnostics
- flag version candidates that are not aligned with `mise ls-remote` / shared policy
- route follow-up fixes to the right core skill and ecosystem reference

Do not use this skill as the primary place to restate every runtime or framework rule in depth.

## Start Here

1. Read `../../references/rules.md`.
2. Read `../../references/profile-catalog.md`.
3. Read `references/rules.md` for the report contract.
4. Read root references for env/task topics if the review touches those areas.
5. Run `scripts/validate_mise_toml.py` rather than inventing ad-hoc output.

## Review Flow

1. Gather `mise.toml`, local overrides, file tasks, `.gitignore`, and related version files.
2. Run `scripts/validate_mise_toml.py`.
3. Group diagnostics by rule family and owner skill.
4. Route follow-up work to core skills and the relevant ecosystem references.

## Example Requests

- "이 `mise.toml`을 리뷰해줘."
- "JSON 형식으로 rule violation을 보고해줘."
- "어느 skill을 읽고 고쳐야 할지 같이 알려줘."
