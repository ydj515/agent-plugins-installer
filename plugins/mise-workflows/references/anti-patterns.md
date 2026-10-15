# Anti-Patterns

## Tools / Versions

- Storing `latest` directly in a tracked `mise.toml`
- Using npm-style ranges such as `^24` or `>=20` as requests (treated as literals and fail to install)
- Writing requests that `mise ls-remote <tool>` does not list
- Keeping deprecated backends such as `ubi:` (removed in 2027.1.0)
- Reaching for `asdf:` or plugins when a registry short name or core tool exists
- Mixing runtimes, build tools, and package managers without a profile
- Turning `minimum_release_age` off with `0s` without a reason, or keeping the deprecated `install_before`
- Keeping deprecated top-level keys such as `[alias]` or `experimental_monorepo_root`

## Lockfile

- Keeping only prefix requests in a team repository without `mise.lock`
- Committing `mise.local.lock` or the `.mise/locks/mise.local` directory
- Installing in CI without `--locked` and missing incomplete lockfiles
- Working around a checksum mismatch by deleting the lockfile entry
- Running a lockfile bump bot on untrusted branches without safe mode

## Env / Secrets

- Putting secrets or user-local paths directly in tracked config
- Keeping deprecated env keys such as `env_file`, `dotenv`, `env_path`, or `env.mise.*`
- Putting `redactions` inside `[env]` (it is a top-level key)
- Adding `mise.local.toml` or `mise.*.local.toml` without `.gitignore` entries
- Coupling the entry point tightly to `mise`, as in `mise exec -- script.py`
- Assuming secrets load through shell activation in non-interactive jobs
- Spawning a subprocess with `exec()` on every render to read secrets or file values
- Declaring `python.uv_venv_auto = true` (deprecated) together with `_.python.venv`
- Using Tera v1-only helpers (`trim_start_matches`, `as_str`, and so on) in new templates
- Not clearing `__MISE_DIFF` before SSH, causing remote trust problems

## Tasks

- Mixing a `usage` spec with deprecated Tera `arg()`, `option()`, `flag()`
- Cramming long shell into a single TOML string
- File task headers that formatters can break
- Leaving task `description` empty so agents have to guess the purpose
- Chaining long-running remote workflows only through `depends`
- Allowing publish or release tasks that do not guarantee the build artifact
- Using task names with `:` as unquoted TOML keys
- Wrapping task commands that use the `[tools]` version in `mise exec <tool>@<version> --`

## Profiles / Ownership

- Mixing language, build, or package manager rules directly into a profile
- Hiding shared policy in ecosystem references and defining it twice
- Repeating the same declarations in root and child `mise.toml` without monorepo routing
