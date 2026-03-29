---
name: "gh-fix-ci"
description: "Use when a user asks to debug or fix failing GitHub PR checks that run in GitHub Actions. Use gh CLI for checks and log inspection before implementing any approved fix."
---

# GitHub Actions CI Fix

Use this skill when the task is specifically about failing GitHub Actions checks on a pull request.

## Workflow

1. Verify GitHub CLI authentication with `gh auth status`.
2. Resolve the PR from the user input or the current branch.
3. Inspect failing checks.
   - Preferred: run `scripts/inspect_pr_checks.py`
   - Fallback: `gh pr checks`, `gh run view`, and job log reads
4. Summarize the root cause before changing code.
5. Propose a focused fix plan and implement only after approval.
6. Re-run the most relevant local verification and summarize residual risk.

## Guardrails

- Treat non-GitHub Actions providers as report-only unless the user explicitly wants a separate path.
- Do not claim certainty when logs are missing.
- If `gh` is missing or unauthenticated, stop and explain the blocker.
