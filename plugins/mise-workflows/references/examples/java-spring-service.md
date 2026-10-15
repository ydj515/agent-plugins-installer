# java-spring-service

## When to Use

- Spring Boot services
- Repositories with `build.gradle*`, `gradlew`, `application.yml`, or `@SpringBootApplication` signals
- When service-oriented env and tasks are needed on top of the Java/Gradle rules

## Selectors

- Java runtime: `zulu-25`
- Gradle: `9.8`

The exact candidates on 2026-10-16 were:

- `mise latest java@zulu-25` -> `zulu-25.36.205.0`
- `mise latest gradle@9.8` -> `9.8.1`

Keep `zulu-21` if your Spring Boot version does not support Java 25.

## Example `mise.toml`

```toml
[tools]
java = "zulu-25"
gradle = "9.8"

[settings]
lockfile = true

[env]
SPRING_PROFILES_ACTIVE = { default = "local" }
SERVER_PORT = "8080"

[tasks.boot]
description = "Start the Spring Boot service with the repository wrapper."
usage = '''
about "mise run boot: start the Spring Boot service with the repository wrapper"
'''
env.SPRING_DATASOURCE_URL = { required = "Set the local database URL in mise.local.toml" }
run = "./gradlew bootRun"

[tasks.test]
description = "Run the service test suite."
usage = '''
about "mise run test: run the service test suite"
'''
run = "./gradlew test"

[tasks.package]
description = "Build a deployable jar after verification succeeds."
usage = '''
about "mise run package: build a deployable jar after verification succeeds"
'''
depends = ["test"]
sources = ["build.gradle*", "settings.gradle*", "src/main/**"]
outputs = ["build/libs"]
run = "./gradlew bootJar"
```

`mise.local.toml` (not committed):

```toml
[env]
SPRING_DATASOURCE_URL = "jdbc:postgresql://localhost:5432/app"
SPRING_DATASOURCE_PASSWORD = { value = "local-only", redact = true }
```

## Notes

- `required` sits only in the `boot` task's `env`, so `test` and CI, which do not need connection settings, are unaffected. No separate `_verify-env` helper task is needed.
- Keep local database credentials and secrets out of tracked config, in `mise.local.toml`, SOPS files, or redacted file loading.
- Keep `bootRun` separate from the package lifecycle so dev and release flows stay readable.
- For Spring-specific rules see `references/ecosystems/spring-service.md`; for runtime and build rules see `references/ecosystems/java-runtime.md` and `references/ecosystems/java-gradle.md`.
