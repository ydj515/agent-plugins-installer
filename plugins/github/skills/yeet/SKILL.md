---
name: "yeet"
description: "Publish local changes to GitHub by confirming scope, committing intentionally, pushing the branch, and opening a draft PR with git and gh CLI."
---

# GitHub Publish Changes

Use this skill only when the user explicitly wants the full publish flow from the local checkout.

## Workflow

1. Confirm the intended scope with `git status -sb`.
2. Create or choose the branch strategy.
3. Stage only the intended files.
4. Commit tersely.
5. Run the most relevant checks that are available.
6. Push with tracking.
7. Open a draft PR with `gh pr create --draft`.
8. Summarize the branch, commit, PR target, and validation result.

## Guardrails

- Never stage unrelated user changes silently.
- Never push without confirming scope when the worktree is mixed.
- Default to draft PR unless the user explicitly asks for ready-for-review.
- If the repository is not connected to an accessible GitHub remote, stop and explain the blocker.
