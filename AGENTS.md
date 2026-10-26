# Repository Guidelines

## Shared Development Standards

Use the original guides under `.dev-standards/standards/` selectively.
Read only files that exist and match the current task:

- Read `.dev-standards/standards/base.md` before modifying code.
- Before starting change work or choosing a branch, read `.dev-standards/standards/workflows/branch.md`.
- For isolated or parallel work, worktree setup, or cleanup, read `.dev-standards/standards/workflows/worktree.md`.
- If new guides are synchronized under `.dev-standards/standards/` before this index is refreshed, inspect the relevant category directory selectively.

Match guides to the affected module; do not load unrelated languages or frameworks.
Do not read every guide or the merged `.dev-standards/styleguide.md` by default.
Repository-specific instructions in this file take precedence over shared guides.

## Project Structure & Module Organization

Check the repository tree and module manifests to locate source code, tests, and
assets. Keep changes within the responsible module and follow existing boundaries.

## Build, Test, and Development Commands

Use build, test, and local development commands documented in the README,
package scripts, or build configuration. Explain each command's purpose before
running it; do not invent commands.

- For development runtime, `mise.toml`, task, or environment changes, read `.dev-standards/standards/runtime/mise.md`.

## Coding Style & Naming Conventions

Follow existing indentation, language conventions, and naming patterns in the
affected module. Use its configured formatter and linter with the relevant shared guides.

## Testing Guidelines

Use the repository's test frameworks and test naming conventions. Run checks
appropriate to the change and follow configured coverage requirements. Report
actual results and any checks you could not run.

## Commit & Pull Request Guidelines

- When drafting or revising a commit message, read `.dev-standards/standards/workflows/commit.md`.
- When drafting or revising a PR title or description, read `.dev-standards/standards/workflows/pr.md`.
