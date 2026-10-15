---
name: mise-lock
description: Create, review, or maintain `mise.lock` lockfiles for reproducible tool installs. Use when Codex needs to enable lockfiles, choose which lockfile a config writes to (env, local, global, monorepo root), add platform entries, enforce locked mode, bump locked versions safely, switch registry backends, or resolve checksum mismatches and lockfile merge conflicts.
---

# Mise Lock

## Use This Skill

Use this skill to set up or review how a project pins tool versions with `mise.lock`.

Use it when you need to:

- enable lockfiles with `[settings] lockfile = true` or create one with `mise lock`
- decide which lockfile each config uses (`mise.<env>.lock`, `mise.local.lock`, monorepo root)
- add entries for every platform that installs the tools (`mise lock --platform ...`)
- enforce locked installs with `--locked`, `MISE_LOCKED=1`, or `[tool_config] locked = true`
- bump locked versions with `mise lock --bump` and review the diff
- run automated bumps safely with `MISE_SAFE=1`
- switch a tool to a new registry backend with `mise backends switch`
- resolve checksum mismatches and lockfile merge conflicts without deleting checksums

Do not use this skill for choosing version requests (`mise-tools`) or CI wiring (`mise-ci`).

## Start Here

1. Read `../../references/lockfile.md`.
2. Read `../../references/version-policy.md` for how release age interacts with locked versions.
3. Read `references/lock-checklist.md` for the execution checklist.
4. If the repository is a monorepo, read `../../references/monorepo-workspace.md`.

## Workflow

1. Inspect `mise.toml`, `mise.*.toml`, existing `mise*.lock` files, `.mise/locks` 디렉터리, and `.gitignore`.
2. Confirm the tools to lock are declared in `mise.toml`, not only in `.tool-versions`.
3. Enable or create the lockfile and add every platform used by developers, CI, and images.
4. Ignore local lockfiles and their sidecars; commit shared lockfiles and sidecars.
5. Decide whether locked mode belongs in CI only or in `[tool_config]`.
6. Hand the CI install and cache flow to `mise-ci`.

## Example Requests

- "이 저장소에 `mise.lock`을 도입해줘."
- "CI가 쓰는 linux 플랫폼 entry를 lockfile에 추가해줘."
- "lockfile bump를 자동화하는 안전한 방법을 알려줘."
- "checksum mismatch가 났는데 어떻게 처리해야 해?"
