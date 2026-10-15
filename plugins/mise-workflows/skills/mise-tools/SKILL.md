---
name: mise-tools
description: Author, review, or refactor a project's mise `[tools]` section, version requests, backends, and tool options. Use when Codex needs to create or update tool declarations in `mise.toml`, choose between registry short names and explicit backends (packslip, aqua, github, pypi, npm), migrate deprecated `ubi:` or `asdf:` usage, or normalize version requests before ecosystem-specific reference rules apply.
---

# Mise Tools

## Use This Skill

Use this skill to design or review the shared structure of a project's `[tools]` section.

Use it when you need to:

- choose the right tool identifiers and backends
- declare runtimes, build tools, package managers, and CLI tools in one consistent scheme
- migrate `ubi:` (removed in 2027.1.0) and default `asdf:` usage to maintained backends
- normalize version requests (prefix, `prefix:`, `path:`, `sub-`) and remove npm-style ranges
- set per-tool options such as `minimum_release_age`
- decide how `mise.toml` and `mise.lock` should divide responsibility (details in `mise-lock`)

Do not use this skill for `[env]`, `[tasks]`, language vendor policy, or framework-specific behavior.

## Start Here

1. Read `../../references/tools-core.md`.
2. Read `../../references/version-policy.md`.
3. Read `references/tools-checklist.md` for the execution checklist.
4. Read `references/tool-catalog.md` to confirm ownership boundaries.
5. Confirm actual candidate versions with `mise ls-remote` or `mise latest` before finalizing requests.
6. Check the chosen backend with `mise tool <name> --backend` and `mise registry <name>`.

## Workflow

1. Inspect `mise.toml`, version files, and current lock strategy.
2. Normalize tool names and backend choices.
3. Confirm that runtime/build/package manager declarations match the selected profile.
4. Keep requests compatible with `mise-policy` and `mise-profiles`.
5. Load the relevant root ecosystem reference before finalizing ecosystem-specific request decisions.
6. Hand lockfile creation and CI install flow to `mise-lock` and `mise-ci`.

## Route To Ecosystem References

- Java runtime and vendor: `../../references/ecosystems/java-runtime.md`
- Gradle build selection: `../../references/ecosystems/java-gradle.md`
- Python runtime: `../../references/ecosystems/python-runtime.md`
- uv workflow: `../../references/ecosystems/python-uv.md`
- Spring service conventions: `../../references/ecosystems/spring-service.md`

## Example Requests

- "이 프로젝트의 `[tools]`를 정리해줘."
- "`ubi:`나 `asdf:` backend를 다른 backend로 옮겨줘."
- "selector와 lock 전략을 같이 검토해줘."
