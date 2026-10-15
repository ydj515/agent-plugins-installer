# Profile Examples

This document indexes the example `mise.toml` documents for the starter profiles.

- A combination missing here is not unsupported.
- Even without an example, you can design or review a `mise.toml` by combining core skills and ecosystem references.
- The goal is not to limit what is supported but to provide frequently used starting points.

## Examples

- [python-uv-app.md](./examples/python-uv-app.md): starter for general Python applications
- [python-uv-lib.md](./examples/python-uv-lib.md): starter for Python libraries centered on package build and publish
- [java-gradle-app.md](./examples/java-gradle-app.md): starter for general Java applications
- [java-spring-service.md](./examples/java-spring-service.md): starter for Spring services

## Version Selection

Examples use requests and leave exact resolution to `mise.lock`. The selector floor itself is not arbitrary; it is chosen from candidates that `mise` can actually resolve.

Representative candidates checked on 2026-10-16 (mise 2026.9.18, default 24-hour `minimum_release_age`):

- `mise latest python@3.14` -> `3.14.8`
- `mise latest uv@0.13` -> `0.13.1`
- `mise latest java@zulu-25` -> `zulu-25.36.205.0`
- `mise latest java@zulu-21` -> `zulu-21.52.203.0`
- `mise latest gradle@9` -> `9.8.1`
- `mise latest gradle@8` -> `8.14.6`

Example files use human-readable requests instead of these exact patches and leave reproducibility to `mise.lock`.

## Common Elements

- Every example assumes `[settings] lockfile = true` and a committed `mise.lock`.
- CI runs `mise install --locked` and then calls the `mise run ci` or `test` task. See `ci-integration.md`.
