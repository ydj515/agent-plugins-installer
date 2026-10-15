# Rules

## Rule Family

- `PARSE*`: TOML parse failure
- `MWC*`: tools, backend, config rules
- `MWE*`: env and local override rules
- `MWT*`: task rules
- `MWV*`: version policy rules
- `MWL*`: lockfile rules
- `MWJ*`: Java selector and vendor policy rules
- `MWP*`: profile inference rules

## Implemented Rules

| Rule | Severity | Owner | Checks |
| --- | --- | --- | --- |
| `PARSE001` | error | `mise-review` | TOML parse failure |
| `MWC001` | warning | `mise-tools` | `ubi:` backend (removed in 2027.1.0) |
| `MWC002` | warning | `mise-tools` | `asdf:` backend |
| `MWC003` | warning | `mise-tools` | Deprecated top-level keys such as `[alias]` and `experimental_monorepo_root` |
| `MWE001` | error | `mise-env` | Top-level `env_file`, `dotenv`, `env_path` |
| `MWE002` | warning | `mise-env` | Local config or lockfile missing from `.gitignore` |
| `MWE003` | warning | `mise-env` | `env.mise.*` (removed in 2026.12.0) |
| `MWE004` | error | `mise-env` | `redactions` inside `[env]` |
| `MWE005` | warning | `mise-env` | `python.uv_venv_auto = true` |
| `MWE006` | warning | `mise-env` | `_.python.venv` and `python.uv_venv_auto` used together |
| `MWE007` | warning | `mise-env` | Python `virtualenv` tool option |
| `MWT001` | warning | `mise-tasks` | Tera `arg()`, `option()`, `flag()` (removed in 2027.5.0) |
| `MWT002` | policy-error | `mise-tasks` | Task missing `description`, `usage` (with `about`), or `run` (or `file`) |
| `MWV002` | policy-error | `mise-policy` | `latest` in tracked config |
| `MWV003` | warning | `mise-policy` | Request that looks like a prerelease |
| `MWV004` | error | `mise-tools` | npm-style ranges such as `^24` or `>=20` |
| `MWV005` | warning | `mise-policy` | Deprecated `install_before` |
| `MWL001` | info | `mise-lock` | Tools declared but no `mise.lock` |
| `MWL002` | error | `mise-lock` | `lockfile = false` combined with `locked = true` |
| `MWJ001` | policy-error | `mise-tools` | Java request without a vendor (`21`, `lts`) |
| `MWP001` | error | `mise-profiles` | `python-uv-app` signals but `python` or `uv` missing |
| `MWP002` | error | `mise-profiles` | `java-gradle-app` signals but `java` or `gradle` missing |
| `MWP003` | error | `mise-profiles` | `java-spring-service` signals but `java` or `gradle` missing |

## Files Checked

- `mise.toml`, `mise.*.toml`, `.mise.toml`, `.mise.*.toml`
- `.config/mise.toml`, `.config/mise/config.toml`, `mise/config.toml`, `.mise/config.toml`
- `conf.d/*.toml` fragments (`.config/mise/conf.d`, `mise/conf.d`, `.mise/conf.d`)
- `.gitignore`, `mise.lock`, and profile signal files (`pyproject.toml`, `uv.lock`, `build.gradle*`, Spring signals)

## Use With Official Checks

The validator checks organization policy and deprecations. Run mise's own checks as well.

- `mise tasks validate`: dependency cycles, references to missing tasks, `usage` parse errors, invalid `timeout`
- `mise doctor`: the mise installation
- `mise doctor project`: the `[doctor.checks]` the project declares

## Output Expectations

- Support both JSON and human-readable output
- Exit code 1 when there is an error or policy-error
- Each diagnostic includes `owner_skill`, `why`, `fix_hint`, `docs`, and `evidence`
- `fix_hint` is short and actionable
- Include related ecosystem references in `docs` when relevant
