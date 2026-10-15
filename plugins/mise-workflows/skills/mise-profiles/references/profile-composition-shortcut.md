# Profile Composition Shortcut

## Core Principles

- A profile is a router.
- Root ecosystem references own the detailed rules.
- `mise-policy` owns shared policy.
- Selection signals live in the root `references/profile-composition.md`.
- Starter samples live in the root `references/profile-examples.md` and `references/examples/`.

## Quick Mapping

- `pyproject.toml` + app/dev workflow -> `python-uv-app`
- `pyproject.toml` + build/publish workflow -> `python-uv-lib`
- `build.gradle*` + wrapper -> `java-gradle-app`
- `build.gradle*` + Spring signal -> `java-spring-service`
