# Secrets

## Purpose

This document describes how to choose a way to handle secrets in a `mise` project. The rule that plain-text secrets never go into tracked config is the same as in `env-core.md`.

## Choosing an Approach

| Approach | When | Exposure |
| --- | --- | --- |
| `mise.local.toml` | Personal development values that never enter the repository | Activated shell, tasks, `mise env` |
| SOPS file | Commit secrets encrypted in a separate file | Decrypted on config load and exposed to the shell and tasks |
| age values | Keep a few encrypted variables directly in `mise.toml` | Redacted by default |
| fnox (experimental) | Secret managers such as 1Password or AWS Secrets Manager | Passed only to tasks that declare `secrets` |

## SOPS / age

- Commit the ciphertext and share decryption identities outside the repository.
- Values read through SOPS are ordinary `[env]` values, so add `redact = true`.
- `MISE_SOPS_AGE_KEY` and `MISE_SOPS_AGE_KEY_FILE` are the exception that mise reads from `[env]`. Declare them before the files they decrypt.

## fnox Task Secrets (experimental)

```toml
min_version = "2026.10.4"

[settings]
experimental = true

[secrets.fnox]

[tasks.deploy]
description = "Deploy with credentials scoped to this task."
usage = '''
about "mise run deploy: deploy with credentials scoped to this task"
'''
secrets = ["DEPLOY_KEY", "DATABASE_URL"]
run = "./scripts/deploy.sh"
```

- Values reach only the declaring task and are masked in its output. Dependencies, the shell, hooks, and `mise env` do not receive them.
- A task's `env` can compose values with `{{ secrets.NAME }}`.
- A task that declares `secrets` requires trust.
- This feature is experimental. Pin `min_version` and review the changelog before adopting it as a team standard.

## Redaction and CI Masking

- Single value: `redact = true`
- Name patterns: top-level `redactions = ["*_TOKEN", "*_KEY"]`
- Exempt from a pattern: `redact = false` on the variable
- `jdx/mise-action` registers redacted values as GitHub Actions masks. Steps that read secrets outside the action must register `::add-mask::` themselves from `mise env --redacted --json`.
- `raw = true` tasks do not capture output, so they are not masked.

## Review Questions

- Is there no plain-text secret or raw token in tracked config?
- Is secret exposure no wider than needed (whole shell vs a single task)?
- Are decryption keys kept out of the repository?
- Do values that need redaction have `redact` or a matching `redactions` pattern?
