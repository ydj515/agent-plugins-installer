---
name: github
description: Triage GitHub repositories, pull requests, and issues through local git context and the GitHub CLI. Use when the user wants GitHub help and the task does not yet need a narrower specialist workflow.
---

# GitHub

Use this skill as the umbrella entrypoint for general GitHub work in Gemini CLI.

Core rules:

- prefer local `git` for repository and branch context
- prefer `gh` for PR, issue, review, and Actions data
- route quickly to the narrower skill when the task becomes review follow-up, CI debugging, or publish flow

## Workflow

1. Resolve the repository context.
   - If the user gives a repo, PR, issue number, or URL, use it.
   - If the user says "this branch" or "current PR", inspect local git state first.
2. Classify the request.
   - repository or PR triage
   - review comment follow-up
   - CI debugging
   - publish local changes
3. Route when needed.
   - review comments: `../gh-address-comments/SKILL.md`
   - failing Actions checks: `../gh-fix-ci/SKILL.md`
   - branch, commit, push, PR creation: `../yeet/SKILL.md`
4. Summarize what was inspected and what the next likely action should be.

## Guardrails

- Do not assume any hosted connector is available.
- If `gh` auth is missing, ask the user to run `gh auth login`.
- If the repository is ambiguous after local inspection, ask for the repo identifier instead of guessing.
