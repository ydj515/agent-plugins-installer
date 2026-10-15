# Spring Service

## Role

- Collects the service-oriented conventions the Spring service profile needs.
- Combines with the Java runtime and Gradle build rules instead of replacing them.

## Principles

- Apply Spring service decisions only when the repository shows real signals.
- Keep local database credentials and secrets out of tracked config, in `mise.local.toml`, SOPS files, or redacted file loading.
- Declare required connection settings with `{ required = "..." }` so a missing value fails fast. Put it on the task that needs it when other tasks such as tests do not.
- Keep `bootRun` separate from the package lifecycle so dev and release flows stay readable.
- If a local database or broker is needed, consider a docker compose task or experimental `daemons`, and adopt experimental features only after team agreement.

## Composition

- Java runtime: `references/ecosystems/java-runtime.md`
- Gradle build: `references/ecosystems/java-gradle.md`
- Shared policy: `references/policy-core.md`
- Secret handling: `references/secrets.md`

## Review Questions

- Does the repository have real signals such as `spring-boot`, `@SpringBootApplication`, or `application.yml`?
- Were the runtime and build selector decisions settled in the Java and Gradle documents first?
- Did you add only service-specific env and tasks without mixing in generic runtime/build rules?
- Does the Spring Boot version support the chosen Java major?

## Read Together With

- Java runtime policy: `references/ecosystems/java-runtime.md`
- Gradle build policy: `references/ecosystems/java-gradle.md`
- Spring starter example: `references/examples/java-spring-service.md`
