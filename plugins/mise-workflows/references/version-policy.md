# Version Policy

## Version Selection Procedure

1. Decide the profile.
2. Read the ecosystem references for that profile.
3. Check candidates with `mise ls-remote <tool>` or `mise latest <tool@request>`.
4. Narrow the request to a major/minor range first where possible.
5. Exclude prereleases.
6. Pick the newest stable candidate that passes `minimum_release_age`.
7. Recheck against the ecosystem reference that the floor is not too low.

## Storage Strategy

- `mise.toml`: requests (prefixes)
- `mise.lock`: exact resolution, URLs, and checksums
- Allow an exact pin with `mise use --pin` only when a lockfile is not possible and reproducibility matters more

## Minimum Release Age

Holding back newly published versions for a while reduces supply-chain risk.

- The default is 24 hours. It applies to `aqua`, `cargo`, core, `forgejo`, `gem`, `github`, `gitlab`, `go`, `npm`, `packslip`, `pypi`, `spm`, and `ubi` tools.
- `http`, `s3`, `conda`, `dotnet`, `asdf`, and `vfox` apply a cutoff only when you set one.
- The setting is named `minimum_release_age`. It accepts a duration (`7d`, `6mo`) or a date (`2026-06-01`); `0s` turns it off.
- To strengthen the organization default, write `[settings] minimum_release_age = "7d"`.
- Relax it per tool for tools that must update quickly, such as security scanners: `[tools.trivy] minimum_release_age = "1d"`.
- For a full exemption, use `minimum_release_age_excludes = ["trivy", "npm:*"]`. Lists from several configs are merged.
- Precedence: the `--minimum-release-age` flag > tool option > setting or default.
- The cutoff applies only when mise picks a new version. Exact versions, versions recorded in `mise.lock`, and installed versions are not filtered.
- `install_before` is deprecated. Migrate to `minimum_release_age`.

## Update Flow

- `mise outdated`: tools with a newer version inside their request
- `mise lock --bump [tool]`: move only the lockfile to the newest allowed version; `mise.toml` stays the same
- `mise upgrade [tool]`: install and update the lockfile
- `mise upgrade --bump`: raise the request itself. Major changes go through review

## Default Guards

- No `latest`
- No prereleases by default
- No requests that are too low
- No npm-style ranges
- Turning `minimum_release_age` off with `0s` is allowed only with a recorded reason

## Review Questions

- Can `mise` resolve this request?
- Does this request satisfy the profile and ecosystem-specific floor?
- Did you decide whether an exact pin is needed or the lockfile is enough?
- Did build tools and package managers go through the same procedure?
- Is there a reason recorded for any release age relaxation or exclusion?
