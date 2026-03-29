---
name: gh-address-comments
description: Address actionable GitHub pull request review feedback. Use when the user wants to inspect unresolved review threads, requested changes, or inline review comments on a PR, then implement selected fixes through local git plus gh CLI.
---

# GitHub PR Comment Handler

Use this skill when the user wants to work through requested changes on a GitHub pull request.

## Workflow

1. Resolve the PR.
   - Use an explicit repo and PR number or URL when provided.
   - For the current branch, use local git context plus `gh pr view --json number,url`.
2. Inspect review context with thread-aware reads.
   - Use the bundled `scripts/fetch_comments.py` workflow whenever unresolved review threads, inline locations, or resolution state matter.
   - Use `gh api graphql` and `gh pr view` as the primary data sources.
3. Cluster actionable review threads.
   - Group comments by file or behavior area.
   - Separate actionable requests from informational comments or already resolved threads.
4. Confirm scope before editing.
   - If the user did not ask to fix everything, ask which threads to address.
5. Implement the selected fixes locally.
6. Summarize what was addressed, what remains, and what checks support the change.

## Guardrails

- Do not reply on GitHub or resolve threads unless the user explicitly asks.
- If `gh` auth is missing or rate-limited, stop and tell the user what needs to be fixed.
- If comments conflict or are ambiguous, surface the tradeoff instead of guessing.
