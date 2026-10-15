# Version Policy Checklist

## Shared Checks

- Does `mise ls-remote` or `mise latest` resolve it?
- Is it not a prerelease?
- Does it pass `minimum_release_age` (versions recorded in the lockfile are exempt)?
- Does it satisfy the selector floor?
- Is there a recorded reason for any release age relaxation or exclusion?

## Output Expectations

- `mise.toml`: requests
- `mise.lock`: exact resolution
- If the organization changes the default release age, set it in `[settings] minimum_release_age`
