# Policy Core

## Purpose

This document defines the shared organizational policy that applies across `mise-workflows`. Language-specific selector floors are owned by each ecosystem reference.

## Shared Policy

- Never store `latest` directly in a tracked `mise.toml`
- No prereleases without an explicit exception
- Apply the `minimum_release_age` gate when adopting new versions (mise defaults to 24 hours; strengthen the organization default when needed)
- Confirm selector candidates resolve with `mise ls-remote` or `mise latest`
- Team repositories commit `mise.lock`, and CI installs with `mise install --locked`
- Classify review results as `error`, `policy-error`, `warning`, or `info`

## Trust and Execution Safety

- Config with `[env]`, `[hooks]`, `[settings]`, tool options, `include`, or template syntax requires trust.
- Automation that reads config from untrusted branches (for example, a lockfile bump bot) runs with `MISE_SAFE=1`. Safe mode blocks tasks, `exec()`, hooks, and `_.source`.
- Consider paranoid mode for personal environments that need tight control. It asks for trust again whenever a config's contents change.
- Trusting a monorepo root also trusts the configs below it. Review the whole repository before trusting the root.

## Boundary Between Policy and Official Rules

- Deprecated or scheduled for removal in the official docs: at least `warning`; already removed or broken: `error`
- Selector floors or vendor rules enforced by organizational agreement: `policy-error`
- Recommendations that are not enforced: `info`
- Keep framework conventions in profiles or ecosystem references where possible

## Ownership

- Shared version guards: `mise-policy`
- Profile composition rules: `mise-profiles`
- Lockfile operations: `mise-lock`
- CI integration: `mise-ci`
- Language, build, and package manager specifics: ecosystem references
