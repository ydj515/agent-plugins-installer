# Release Workflow Patterns

## Purpose

This document collects the shared patterns for designing a release DAG with `mise` tasks.

## Recommended DAG

1. `release:preflight`
2. `release:build`
3. `release:smoke`
4. `release:publish`
5. `release:full`

The key point is that publish must depend explicitly on the build artifact. The names contain `:`, so quote the TOML keys.

```toml
[tasks."release:preflight"]
description = "Validate the working tree, credentials, and test readiness."
usage = '''
about "mise run release:preflight: validate the working tree, credentials, and test readiness"
'''
run = "./scripts/release-preflight.sh"

[tasks."release:build"]
description = "Build releasable artifacts."
usage = '''
about "mise run release:build: build releasable artifacts"
'''
depends = ["release:preflight"]
sources = ["src/**", "pyproject.toml"]
outputs = ["dist"]
run = "./scripts/release-build.sh"

[tasks."release:smoke"]
description = "Install the built artifacts and check basic behavior."
usage = '''
about "mise run release:smoke: install the built artifacts and check basic behavior"
'''
depends = ["release:build"]
run = "./scripts/release-smoke.sh"

[tasks."release:publish"]
description = "Publish only verified artifacts."
usage = '''
about "mise run release:publish: publish only verified artifacts"
'''
depends = ["release:smoke"]
confirm = "Publish the verified artifacts?"
timeout = "15m"
run = "./scripts/release-publish.sh"

[tasks."release:full"]
description = "Run the whole release workflow."
usage = '''
about "mise run release:full: run the whole release workflow"
'''
depends = ["release:publish"]
run = "echo release complete"
```

- `confirm` asks for interactive confirmation. If CI runs it, decide a `--yes` policy separately.
- Pass publish credentials only to the publish task, through `secrets` (experimental) or CI secrets.

## Selective Reruns

To retry only publish without rebuilding, add a guard task that checks:

- that the artifacts exist
- whether the version was bumped
- the release credentials

With accurate `sources` and `outputs`, build is skipped automatically unless its inputs change.

## Common Problems

- The publish task does not depend on build
- The orchestrator prints instructions instead of running the DAG
- Wheels, jars, and binaries are scattered across paths, making validation hard
- A missing tool dependency makes the release fail late
- Task names with `:` are used as unquoted TOML keys and fail to parse

## Review Questions

- Does publish directly guarantee the build artifact?
- Do both a selective rerun and a full orchestrator exist?
- Are the external tools release needs declared in `[tools]` or the task's `tools` and recorded in `mise.lock`?
