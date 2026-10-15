# Java Gradle

## Role

- Covers the Gradle selector floor and the wrapper boundary.
- Adds build tool decisions on top of the Java runtime rules.
- Spring service conventions live in a separate document.

## Principles

- Decide the Gradle selector floor within shared policy and the profile context.
- The project's build entry point is the Gradle wrapper (`gradlew`). The Gradle version the wrapper defines is the real build version.
- The `gradle` tool in `mise` is for creating and updating the wrapper (`gradle wrapper`) and aligning the development environment. Keep the two versions close.
- Do not lump runtime selectors and build selectors under the same rules.
- The registry's `gradle` uses the `aqua:gradle/gradle-distributions` backend.

## Default Policy

- Recommended selector for new projects: `9.8` (Gradle 9 line)
- Existing Gradle 8 projects: keep `8.14` and move up after checking the Gradle 9 migration items
- Gradle 9 runs Gradle itself on JVM 17 or newer. Check it together with the Java runtime selector
- Candidates as of 2026-10-16: `mise latest gradle@9` → `9.8.1`, `mise latest gradle@8` → `8.14.6`

## Review Questions

- Does the profile actually require Gradle?
- Is the selector not below the currently supported floor?
- Are the wrapper version (`gradle/wrapper/gradle-wrapper.properties`) and the `mise.toml` selector on the same major?
- Did you read the Java runtime rules in `references/ecosystems/java-runtime.md` as well?

## Composition

- Java runtime rules: `references/ecosystems/java-runtime.md`
- Gradle selector and wrapper decisions: this document
- Spring service conventions: `references/ecosystems/spring-service.md`

## Read Together With

- Java runtime policy: `references/ecosystems/java-runtime.md`
- Spring service conventions: `references/ecosystems/spring-service.md`
- Java app starter: `references/examples/java-gradle-app.md`
