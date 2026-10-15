# java-gradle-app

## When to Use

- General Java applications
- Repositories that use `build.gradle` or `build.gradle.kts`
- When `mise` should own the runtime and the Gradle wrapper should be the project entry point

## Selectors

- Java runtime: `zulu-25`
- Gradle: `9.8`

The exact candidates on 2026-10-16 were:

- `mise latest java@zulu-25` -> `zulu-25.36.205.0`
- `mise latest gradle@9.8` -> `9.8.1`

Existing Java 21 / Gradle 8 projects keep `zulu-21` / `8.14` and move up step by step.

## Example `mise.toml`

```toml
[tools]
java = "zulu-25"
gradle = "9.8"

[settings]
lockfile = true

[env]
JAVA_TOOL_OPTIONS = "-Dfile.encoding=UTF-8"

[tasks.build]
description = "Compile and package the Java application with the repository wrapper."
usage = '''
about "mise run build: compile and package the Java application with the repository wrapper"
'''
run = "./gradlew build"

[tasks.test]
description = "Run the Gradle test task using the repository wrapper."
usage = '''
about "mise run test: run the Gradle test task using the repository wrapper"
'''
run = "./gradlew test"

[tasks.check]
description = "Run the standard verification lifecycle before packaging."
usage = '''
about "mise run check: run the standard verification lifecycle before packaging"
'''
depends = ["test"]
run = "./gradlew check"

[tasks.wrapper]
description = "Regenerate the Gradle wrapper with the mise-managed Gradle version."
usage = '''
about "mise run wrapper: regenerate the Gradle wrapper with the mise-managed Gradle version"
'''
run = "gradle wrapper"
```

## Notes

- Team policy bans vendorless selectors such as `java = "25"`. Since mise 2026.10.5 the default vendor changed, so the same value can resolve to a different build.
- The wrapper decides the real build version. The `gradle` in `mise.toml` is for updating the wrapper and aligning the development environment.
- Execution tasks prefer the wrapper so they follow the repository-local Gradle contract.
- Commit `mise.lock`.
