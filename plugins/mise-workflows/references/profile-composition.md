# Profile Composition

## Composition Principles

- A profile is a router for tool declarations and skill combinations.
- Core skills provide the workflow; ecosystem references provide the detailed selector, runtime, and build conventions.
- A profile is not a store of language-specific rules.
- A profile only combines shared policy with ecosystem rules.
- Profile names and their required skills are owned by `profile-catalog.md`.
- Starter `mise.toml` samples are owned by `profile-examples.md` and the individual example documents.

## Selection Procedure

1. Look at the repository's language and build tool signals.
2. Pick the single closest profile first.
3. Read the related references.
4. Read optional references only when the repository actually matches them.
5. In a monorepo, settle root hub and spoke responsibilities before applying a profile.
6. If no named profile fits cleanly, combine core skills and ecosystem references directly.

## Selection Signals

### `python-uv-app`

- Typical signals:
  - `pyproject.toml`
  - `uv.lock`
  - An application entry point
  - A local `.venv` and `uv sync` flow
- Read:
  - `references/ecosystems/python-runtime.md`
  - `references/ecosystems/python-uv.md`
  - `references/examples/python-uv-app.md`

### `python-uv-lib`

- Typical signals:
  - `pyproject.toml`
  - Build backend configuration
  - Publish or release tasks
  - A workflow centered on package builds or distribution artifacts
- Read:
  - `references/ecosystems/python-runtime.md`
  - `references/ecosystems/python-uv.md`
  - `references/examples/python-uv-lib.md`

### `java-gradle-app`

- Typical signals:
  - `build.gradle` or `build.gradle.kts`
  - `gradlew`
  - A general Java build/test/package workflow
- Read:
  - `references/ecosystems/java-runtime.md`
  - `references/ecosystems/java-gradle.md`
  - `references/examples/java-gradle-app.md`

### `java-spring-service`

- Typical signals:
  - `build.gradle*`
  - `gradlew`
  - `spring-boot`
  - `@SpringBootApplication`
  - `application.yml` or `application.properties`
- Read:
  - `references/ecosystems/java-runtime.md`
  - `references/ecosystems/java-gradle.md`
  - `references/ecosystems/spring-service.md` when needed
  - `references/examples/java-spring-service.md`

## Quick Mapping

- `build.gradle` + Spring traces -> `java-spring-service`
- `pyproject.toml` + uv workflow -> `python-uv-app` or `python-uv-lib`
- `pyproject.toml` + workspace root + `uv.lock` -> `python-uv-*` + `monorepo-workspace.md`

For a concrete starting point, read `profile-examples.md` and the individual example documents.
