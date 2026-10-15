# Profile Catalog

## Starter Profile Catalog

This document collects the starter profiles documented today.

- This list is not exhaustive.
- Repositories outside this list can still be handled by combining core skills and ecosystem references.
- Only combinations that recur are promoted to named profiles.
- Profile rules that the validator infers directly are added for the representative combinations first.
- Repository signals and selection criteria are owned by `profile-composition.md`.
- Starter `mise.toml` samples are owned by `profile-examples.md` and `references/examples/`.

### `python-uv-app`

- Purpose: general Python applications
- Required tools: `python`, `uv`
- Related references: `references/ecosystems/python-runtime.md`, `references/ecosystems/python-uv.md`

### `python-uv-lib`

- Purpose: Python repositories centered on libraries or package distribution
- Nature: a specialization of `python-uv-app`, used when the distribution/publish workflow matters more
- Required tools: `python`, `uv`
- Related references: `references/ecosystems/python-runtime.md`, `references/ecosystems/python-uv.md`

### `java-gradle-app`

- Purpose: general Java applications
- Required tools: `java`, `gradle`
- Related references: `references/ecosystems/java-runtime.md`, `references/ecosystems/java-gradle.md`

### `java-spring-service`

- Purpose: Spring-based services
- Required tools: `java`, `gradle`
- Related references: `references/ecosystems/java-runtime.md`, `references/ecosystems/java-gradle.md`
- Optional references: `references/ecosystems/spring-service.md`
