# Java Runtime

## Role

- Covers Java runtime selectors and vendor policy.
- Covers consistency between idiomatic version files such as `.java-version` and `.sdkmanrc` and the tracked `mise.toml`.
- Does not own build tool rules or Spring service conventions.

## Principles

- Use vendor-qualified selectors for Java.
- Avoid vendorless `21` or `lts` unless policy allows them.
- Keep runtime selection separate from build tool selection.
- Do not assume `JAVA_HOME` is right implicitly; check the tool selector and version files together.

## Why the Vendor Must Be Explicit

- A request without a vendor follows the `java.shorthand_vendor` setting.
- That default changed from `openjdk` to `temurin` in mise 2026.10.5, so the same `java = "21"` resolves to a different build depending on the mise version.
- Lockfile entries recorded under `openjdk` no longer match the new default, and `mise install --locked` can fail.
- The official docs also recommend naming the vendor in shared config.

## Default Policy

- Team default vendor: `zulu`
- Recommended selector for new projects: `zulu-25` (Java 25 LTS)
- Existing Java 21 projects: keep `zulu-21`. Move to 25 after confirming framework and build tool support
- Vendorless `21`, `25`, or `lts` in tracked config are policy violation candidates
- When only a JRE is needed, name the variant explicitly, such as `temurin-jre-25`
- Candidates as of 2026-10-16: `mise latest java@zulu-25` → `zulu-25.36.205.0`, `mise latest java@zulu-21` → `zulu-21.52.203.0`

## Version Files

- `.java-version` and `.sdkmanrc` are read only after adding `java` to `idiomatic_version_file_enable_tools`.
- A `.java-version` that contains only `21` without a vendor follows `java.shorthand_vendor`. For shared files, keep `mise.toml` as the source of truth.
- Vendor identifiers in `.sdkmanrc` are mapped to mise names (`21.0.9-tem` → `temurin-21.0.9`).

## Review Questions

- Does the selector name the vendor, as in `zulu-25`?
- Does the selector candidate match `mise ls-remote java zulu-25` output?
- Does it agree with the `.java-version` or related idiomatic file strategy?
- If there is a build/test workflow, did you read it together with `references/ecosystems/java-gradle.md`?

## Read Together With

- Gradle selector and wrapper boundary: `references/ecosystems/java-gradle.md`
- Spring service conventions: `references/ecosystems/spring-service.md`
- Java starter example: `references/examples/java-gradle-app.md`
