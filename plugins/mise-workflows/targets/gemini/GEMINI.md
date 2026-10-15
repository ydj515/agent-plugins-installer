# Mise Workflows For Gemini CLI

Use this extension to author, review, and standardize `mise.toml`-based project workflows.

This Gemini target does not duplicate the full plugin structure. Treat the plugin root as the canonical source of skills, references, examples, and validator logic.

## Canonical Resources

### Core skills

Load these from the plugin root when the task matches:

- `../../skills/mise-tools`
- `../../skills/mise-env`
- `../../skills/mise-tasks`
- `../../skills/mise-policy`
- `../../skills/mise-profiles`
- `../../skills/mise-review`
- `../../skills/mise-lock`
- `../../skills/mise-ci`

### Ecosystem references

Load these when the repository needs ecosystem-specific selector or workflow guidance:

- `../../references/ecosystems/java-runtime.md`
- `../../references/ecosystems/java-gradle.md`
- `../../references/ecosystems/python-runtime.md`
- `../../references/ecosystems/python-uv.md`
- `../../references/ecosystems/spring-service.md`

### Lockfile, CI, and secrets

- `../../references/lockfile.md`
- `../../references/ci-integration.md`
- `../../references/secrets.md`

### Profile documents

- `../../references/profile-catalog.md`
- `../../references/profile-composition.md`
- `../../references/profile-examples.md`
- `../../references/examples/python-uv-app.md`
- `../../references/examples/python-uv-lib.md`
- `../../references/examples/java-gradle-app.md`
- `../../references/examples/java-spring-service.md`

### Validator and rules

- Validator: `../../scripts/validate_mise_toml.py`
- Rule contract: `../../references/rules.md`

## Recommended Gemini Workflow

### 1. Profile selection

- Read `profile-catalog.md` for the named starter profiles.
- Read `profile-composition.md` for repository signals and mapping.
- If no named profile fits cleanly, combine core skills and ecosystem references directly.

### 2. Authoring or refactoring

- Start with `mise-tools`, `mise-env`, or `mise-tasks` depending on the user request.
- Read `version-policy.md` before finalizing selectors.
- Load the matching ecosystem reference only when runtime, build, package-manager, or framework rules matter.
- Give every task a `description`, a `usage` spec that starts with `about "mise run <task>: ..."`, and a `run` command.
- Use `mise-lock` for `mise.lock` and `mise-ci` for CI install and cache flow.

### 3. Review and diagnostics

- Use `mise-review` for structured review.
- Run `../../scripts/validate_mise_toml.py` instead of inventing ad-hoc rule output.
- Also run `mise tasks validate` when mise is installed and the config is trusted.
- Use `../../references/rules.md` to interpret rule families and owner boundaries.

## Scope Notes

- Named profiles are starter presets, not an exhaustive support boundary.
- Core skills own workflow.
- Ecosystem references own Java, Python, uv, Gradle, and Spring-specific detail.
- Examples are starter `mise.toml` patterns, not the only supported repository shapes.

## Good Fit Requests

- Review this repository's `mise.toml`.
- Choose a starter profile for this project.
- Refactor our `[tools]`, `[env]`, or `[tasks]` setup.
- Explain how Python/uv or Java/Gradle policy should be represented in `mise`.
- Add `mise.lock` and a locked CI install.
- Find deprecated mise syntax before it is removed.
