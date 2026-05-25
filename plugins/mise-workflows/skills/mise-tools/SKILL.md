---
name: mise-tools
description: Author, review, or refactor a project's mise `[tools]` section, tool selectors, backends, and lock strategy. Use when Codex needs to create or update tool declarations in `mise.toml`, choose between core tools and registry backends, or normalize version selectors before ecosystem-specific reference rules apply.
---

# Mise Tools

## Use This Skill

Use this skill to design or review the shared structure of a project's `[tools]` section.

Use it when you need to:

- choose the right tool identifiers
- declare runtimes, build tools, and package managers in one consistent scheme
- prefer core tools over legacy backends
- normalize selectors before language-specific rules apply
- decide how `mise.toml` and `mise.lock` should divide responsibility

Do not use this skill for `[env]`, `[tasks]`, language vendor policy, or framework-specific behavior.

## Start Here

1. Read `../../references/tools-core.md`.
2. Read `../../references/version-policy.md`.
3. Read `references/tools-core.md` for the execution checklist.
4. Read `references/tool-catalog.md` to confirm ownership boundaries.
5. Confirm actual candidate versions with `mise ls-remote` or `mise latest` before finalizing selectors.

## Workflow

1. Inspect `mise.toml`, version files, and current lock strategy.
2. Normalize tool names and backend choices.
3. Confirm that runtime/build/package manager declarations match the selected profile.
4. Keep selectors compatible with `mise-policy` and `mise-profiles`.
5. Load the relevant root ecosystem reference before finalizing ecosystem-specific selector decisions.

## Route To Ecosystem References

- Java runtime and vendor: `../../references/ecosystems/java-runtime.md`
- Gradle build selection: `../../references/ecosystems/java-gradle.md`
- Python runtime: `../../references/ecosystems/python-runtime.md`
- uv workflow: `../../references/ecosystems/python-uv.md`
- Spring service conventions: `../../references/ecosystems/spring-service.md`

## Example Requests

- "이 프로젝트의 `[tools]`를 정리해줘."
- "core tool로 바꿀 수 있는 backend가 있는지 봐줘."
- "selector와 lock 전략을 같이 검토해줘."
