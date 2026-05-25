---
name: mise-policy
description: Apply shared organizational policy for mise selectors, release age gates, prerelease handling, and rule severity. Use when Codex needs to enforce cross-project policy such as `latest` bans, minimum release age, selector floors, or shared rule severity across multiple ecosystem references.
---

# Mise Policy

## Use This Skill

Use this skill to define or apply shared organizational policy across multiple `mise` profiles.

Use it when you need to:

- ban `latest` from tracked config
- set release age gates
- require version candidates to come from `mise ls-remote` or `mise latest`
- decide when something is `warning` versus `policy-error`
- coordinate selector floor enforcement with ecosystem-specific references

Do not use this skill to define Java vendor syntax, Gradle floor details, or framework-specific conventions.

## Start Here

1. Read `../../references/policy-core.md`.
2. Read `../../references/version-policy.md`.
3. Read `references/policy-core.md` for ownership boundaries.
4. Read `references/version-policy.md` for the local review checklist.

## Workflow

1. Decide whether the rule is shared policy or ecosystem-specific policy.
2. Keep shared policy reusable across multiple profiles.
3. Push vendor and tool-specific floor rules down into ecosystem reference documents.
4. Route enforcement output to `mise-review`.

## Example Requests

- "공통 version policy를 정리해줘."
- "이 규칙이 warning인지 policy-error인지 정해줘."
- "`latest`를 금지하는 shared rule을 만들고 싶어."
