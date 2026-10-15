---
name: mise-policy
description: Apply shared organizational policy for mise version requests, minimum release age, prerelease handling, trust and safe mode, and rule severity. Use when Codex needs to enforce cross-project policy such as `latest` bans, `minimum_release_age` gates and exclusions, selector floors, or shared rule severity across multiple ecosystem references.
---

# Mise Policy

## Use This Skill

Use this skill to define or apply shared organizational policy across multiple `mise` profiles.

Use it when you need to:

- ban `latest` and npm-style ranges from tracked config
- tune `minimum_release_age` (mise default 24h), per-tool overrides, and `minimum_release_age_excludes`
- migrate deprecated `install_before` to `minimum_release_age`
- require version candidates to come from `mise ls-remote` or `mise latest`
- decide when to use safe mode (`MISE_SAFE=1`) or paranoid mode for untrusted config
- decide when something is `info`, `warning`, `policy-error`, or `error`
- coordinate selector floor enforcement with ecosystem-specific references

Do not use this skill to define Java vendor syntax, Gradle floor details, or framework-specific conventions.

## Start Here

1. Read `../../references/policy-core.md`.
2. Read `../../references/version-policy.md`.
3. Read `references/policy-checklist.md` for ownership boundaries.
4. Read `references/version-checklist.md` for the local review checklist.

## Workflow

1. Decide whether the rule is shared policy or ecosystem-specific policy.
2. Keep shared policy reusable across multiple profiles.
3. Push vendor and tool-specific floor rules down into ecosystem reference documents.
4. Record the reason for every release age relaxation or exclusion.
5. Route enforcement output to `mise-review`.

## Example Requests

- "Write up the shared version policy."
- "Decide whether this rule is a warning or a policy-error."
- "Raise `minimum_release_age` to 7 days and exempt only security tools."
- "Create a shared rule that bans `latest`."
