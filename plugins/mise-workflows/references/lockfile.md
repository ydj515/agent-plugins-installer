# Lockfile

## Purpose

This document describes how to pin tool versions reproducibly with `mise.lock`. Application dependency lockfiles (`uv.lock`, `package-lock.json`) are separate and are kept alongside it.

## Principles

- Keep human-readable requests in `mise.toml` and exact versions, URLs, and checksums in `mise.lock`.
- Team repositories commit `mise.lock`. When a dependency graph sidecar (the `.mise/locks` directory) appears, commit it too.
- CI and Docker install with `mise install --locked`.
- Review lockfile changes like code changes. A lockfile with provenance information becomes a trust input.

## Creating a Lockfile

```toml
[settings]
lockfile = true
```

- `lockfile = true`: create and update lockfiles.
- Unset: update existing lockfiles but create none. Create one yourself with `mise lock`.
- `lockfile = false`: lockfiles are off. Combining it with `locked = true` is an error.
- `mise lock` installs nothing; it resolves and records the tools of the current config root, including task `tools`.
- Tools that exist only in `.tool-versions` are not recorded.

## Which Lockfile Is Used

| Tool declared in | Lockfile | Commit |
| --- | --- | --- |
| `mise.toml` | `mise.lock` | Yes |
| `mise.<env>.toml` | `mise.<env>.lock` | Yes |
| `mise.local.toml` | `mise.local.lock` | No |
| `mise.<env>.local.toml` | `mise.<env>.local.lock` | No |
| global config | `mise.lock` created by `mise lock --global` | Only when kept in a settings repository |
| monorepo subproject (`[monorepo] lockfile = true`) | The lockfile of the same name at the root | Yes |

If you ignore `mise.local.lock`, also ignore its sidecar, the `.mise/locks/mise.local` directory.

## Platforms

Backends that record URLs need an entry for every platform that installs the tools.

```sh
mise lock --platform linux-x64,linux-arm64,macos-arm64
```

The `lockfile_platforms` setting sets the default platform list.

## Updating

| Goal | Command |
| --- | --- |
| Change the request and install | `mise use node@26` |
| Install the newest version the request allows and update the lockfile | `mise upgrade node` |
| Move only the lockfile to the newest allowed version | `mise lock --bump node` |
| Lock an exact version while keeping the prefix request | `mise lock node@24.11.0` |
| Install what the lockfile records | `mise install --locked` |

Run automated update bots as `MISE_SAFE=1 mise lock --bump --json` so the repository config cannot run code.

## Strict Mode

- `mise install --locked` or `MISE_LOCKED=1`: fail when the lockfile has no entry.
- `[tool_config] locked = true`: require lockfile entries for the tools of this config root. Use it for project-level policy.
- `locked_scopes` can be set only in global config.

## Monorepo

```toml
monorepo_root = true

[monorepo]
config_roots = ["packages/api", "packages/web"]
lockfile = true
```

- With `lockfile = true`, subproject tools are collected in the root lockfile.
- If the setting is unset and subproject lockfiles exist, mise warns from 2026.12.0, and root lockfiles become the default from 2027.6.0.
- If older mise versions must be supported, keep the existing layout with `lockfile = false`.

## Backend Changes

When the registry moves a tool to another backend, the backend recorded in the lockfile stays. When mise warns, move it explicitly with `mise backends switch <tool>` and review the diff.

## Troubleshooting

- Checksum mismatch: confirm the upstream change is intentional, then refresh only that entry with `mise lock <tool>`. Do not work around it by deleting checksums.
- `No tools configured to lock`: check whether the tools live only in global config or `.tool-versions`.
- Merge conflict: resolve `mise.toml` first, keep either side of the lockfile, then rewrite it with `mise lock`.

## Relation to Minimum Release Age

A version recorded in the lockfile installs even when it is inside the `minimum_release_age` window. The cutoff applies only when a new version is chosen.

## Review Questions

- Are `mise.lock` and any needed sidecars committed?
- Are there entries for every platform developers and CI use?
- Are local lockfiles ignored?
- Does CI install with `--locked`?
- In a monorepo, is the root lockfile policy explicit?
