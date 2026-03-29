# GitHub Extension

This Gemini CLI extension bundles GitHub-oriented Agent Skills for repository triage, pull request review follow-up, CI inspection, and publish workflows.

Preferred workflow:

- use local `git` for repository context and branch state
- use GitHub CLI `gh` for pull requests, reviews, checks, and Actions logs
- keep changes scoped to the current repository unless the user explicitly asks for another repo

If `gh` authentication is missing, ask the user to run `gh auth login` before continuing.

