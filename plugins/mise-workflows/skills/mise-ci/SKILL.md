---
name: mise-ci
description: Wire mise into CI pipelines and container builds so they install the same locked toolchain as developers. Use when Codex needs to add or review `jdx/mise-action`, GitLab CI or other CI jobs that run mise, cache tool downloads safely, handle untrusted branches with safe mode, pass GitHub tokens for tool installs, install tools in Dockerfiles, or run project checks with `mise doctor project` and `mise tasks validate`.
---

# Mise CI

## Use This Skill

Use this skill to design or review how CI and container builds use `mise`.

Use it when you need to:

- add `jdx/mise-action@v5` or review an existing GitHub Actions workflow
- make CI install with `mise install --locked` and call a single task entrypoint such as `mise run ci`
- cache the download store instead of installed tools when a lockfile exists
- run jobs that read untrusted branches with `MISE_SAFE=1`
- commit a localized `bin/mise` wrapper for CI providers without an official integration
- pass a GitHub token so tool installs avoid API rate limits
- copy `mise.toml` and `mise.lock` into Docker builds before `mise install`
- add `mise tasks validate`, the `mise-review` validator, and `mise doctor project` as early checks

Do not use this skill to choose tool versions (`mise-tools`) or to design the lockfile itself (`mise-lock`).

## Start Here

1. Read `../../references/ci-integration.md`.
2. Read `../../references/lockfile.md`.
3. Read `references/ci-checklist.md` for the execution checklist.
4. If tokens are involved, read `../../references/github-tokens.md`.
5. If secrets reach CI jobs, read `../../references/secrets.md`.

## Workflow

1. Inspect existing CI workflow files, Dockerfiles, `mise.toml`, and `mise.lock`.
2. Move tool versions out of workflow files into `mise.toml`.
3. Make the job install with `--locked` and run one `mise run` entrypoint.
4. Choose a cache strategy that does not trust restored installs from untrusted refs.
5. Decide which jobs need safe mode and which need tokens.
6. Add validation steps (`mise tasks validate`, `mise-review` validator, `mise doctor project`).

## Example Requests

- "Make GitHub Actions install tools with mise."
- "Make the CI cache safe based on the lockfile."
- "Stop mise config from running code on fork PRs."
- "Clean up the steps that install mise tools in the Dockerfile."
