# Tools Core

## Purpose

This document defines the shared rules for designing or reviewing the `[tools]` section of a `mise` configuration. Language-specific vendor rules and framework exceptions live in the root `references/ecosystems/` documents. Lockfile operations are owned by `references/lockfile.md`.

## Principles

- Prefer registry short names (`node`, `python`, `uv`) when they exist. If a short name is a core tool, mise selects the `core` backend automatically.
- Use only version requests that `mise` can resolve directly.
- Pick version candidates only from `mise ls-remote <tool>` or `mise latest <tool@request>` output.
- Never store `latest` directly in a tracked `mise.toml`.
- Keep human-readable requests in `mise.toml` and manage exact resolution in `mise.lock`.
- When choosing a backend explicitly, follow the priority below.

## Tool Scope

`[tools]` covers build tools, package managers, and CLI tools as well as runtimes. For example:

- runtime: `java`, `python`, `node`
- build tool: `gradle`, `maven`
- package manager / workflow tool: `uv`, `pnpm`
- CLI tool: `ruff`, `shellcheck`, `"github:owner/repo"`

## Backend Priority

Follow the order recommended by the official docs. Prefer backends that install the publisher's own prebuilt release.

1. Registry short name or core tool
2. `packslip:`: when the publisher ships signed packslip manifests
3. `aqua:` or `github:`, `gitlab:`, `forgejo:`: forge release assets
4. `http:`, `s3:`: archives you host yourself
5. Language package backends (`cargo:`, `go:`, `npm:`, `pypi:`, `gem:`, `dotnet:`): when the tool ships only as a package, or you need package options such as extras or features
6. `vfox:` plugins: only when installation needs custom logic
7. `asdf:`: legacy. Not available on Windows and never the default choice

`ubi:` is deprecated and removed in mise 2027.1.0. Migrate to `github:` (or `gitlab:` / `http:` for other hosts).

## Version Request Syntax

| Form | Example | Meaning |
| --- | --- | --- |
| exact | `"3.14.8"` | That release |
| prefix | `"3.14"`, `"24"` | The newest release that starts with the prefix |
| `latest` | `"latest"` | The release the backend calls latest. Banned in tracked config |
| alias | `"lts"` | The request the alias stands for |
| `prefix:` | `"prefix:1.20"` | Prefix match even when a release has exactly that name |
| `ref:` and friends | `"ref:main"` | Only on backends that build from source |
| `path:` | `"path:/opt/homebrew/opt/node@24"` | Use an existing directory as the installation. Requires trust since 2026.10.9 |
| `sub-` | `"sub-1:latest"` | Subtract from the resolved version |

- Prefixes and `latest` skip prereleases. If you really need one, use an exact version or the `prerelease` tool option.
- npm-style ranges such as `^24` or `>=20` are not supported. mise warns, treats the value as a literal version, and fails to install.
- For several versions, use an array. The first value provides the default command: `python = ["3.14", "3.13"]`.

## Tool Options

- Use the table form when you need options: `version = "0.60"` and `minimum_release_age = "1d"` under `[tools.trivy]`.
- Options belong to a backend. An option `pypi:` understands means nothing to `aqua:`, so check the backend docs.
- Tool option tables and inline options in the name (`"tool[opt=value]"`) require trust.
- `[tool_config] locked = true` forces the tools of this config root to resolve only from the lockfile. See `references/lockfile.md`.

## Version Files

- Idiomatic version files such as `.nvmrc`, `.python-version`, and `.java-version` are not read by default. Add the tool to `idiomatic_version_file_enable_tools`.
- When `mise.toml` and a version file in the same directory declare the same tool, `mise.toml` wins. Pick one source of truth.
- Tools in `.tool-versions` are not recorded in `mise.lock`. Move them to `mise.toml` if you need a lockfile.

## Checking and Switching Backends

- `mise tool <name> --backend`: the backend a short name actually uses
- `mise registry <name>`: the registry's backend candidates in order
- The backend recorded in the lockfile stays even when the registry changes. Switch explicitly with `mise backends switch <tool>`.

## Review Checklist

- Does each tool name match a real `mise` registry entry, core tool, or explicit backend identifier?
- Does each request satisfy organization policy and the profile floor?
- Are there no deprecated backends such as `ubi:` and no `asdf:` used as the default choice?
- Are npm-style ranges and `latest` absent from tracked config?
- Do the version file strategy and `mise.toml` agree?
- Are runtime, build tool, and package manager declared in a combination that fits the profile?
- Did you decide whether the lockfile guarantees reproducibility or an exact pin is needed?

## Ecosystem Reference Map

- Java vendor and idiomatic files: `references/ecosystems/java-runtime.md`
- Gradle selector and wrapper boundary: `references/ecosystems/java-gradle.md`
- Python selector and version files: `references/ecosystems/python-runtime.md`
- uv selector and Python workflow: `references/ecosystems/python-uv.md`
- Spring service conventions: `references/ecosystems/spring-service.md`
- Lockfile operations: `references/lockfile.md`
