---
name: mise-profiles
description: Choose, review, or refactor project profiles that map mise tools to ecosystem-specific reference sets. Use when Codex needs to classify a repository as a Python, Java, Gradle, uv, or Spring workflow and decide which root references and selector rules should apply.
---

# Mise Profiles

## Use This Skill

Use this skill to classify a repository into the closest documented `mise` workflow profile, or decide that the repository should be handled by a custom combination of core skills and ecosystem references.

Use it when you need to:

- decide which profile best matches the repository
- map required tools to the right ecosystem references
- keep routing logic separate from runtime syntax and framework minutiae
- explain why a repository needs one skill combination rather than another
- separate root hub responsibilities from spoke-specific rules in a monorepo

Do not use this skill to define vendor syntax, build selector details, or validator output format.

## Start Here

1. Read `../../references/profile-catalog.md`.
2. Read `../../references/profile-composition.md`.
3. Read `../../references/profile-examples.md` when you need a concrete starting `mise.toml`.
4. Read `../../references/hub-spoke-architecture.md` if the repository is a monorepo.
5. Read `references/profile-catalog.md` for quick local lookup.
6. Read `references/profile-composition.md` before changing skill routing.

## Workflow

1. Inspect language, build tool, and package manager signals.
2. In a monorepo, decide hub/spoke ownership before selecting the profile.
3. Pick the closest documented profile first.
4. If no named profile fits cleanly, compose the needed core skills and ecosystem references without forcing the repository into an awkward profile bucket.
5. Load required ecosystem references.
6. Add optional framework references only when the repository actually matches them.

## Example Requests

- "이 저장소에 어떤 mise profile이 맞는지 골라줘."
- "Spring service면 어떤 skill 조합이 필요한지 보여줘."
- "profile routing을 다시 정리해줘."
- "profile별 예제 `mise.toml`을 보여줘."
