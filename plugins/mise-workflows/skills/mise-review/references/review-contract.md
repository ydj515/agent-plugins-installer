# Review Contract

## Core Output

- rule id
- severity
- owner skill
- why
- fix hint
- docs, or the ecosystem reference to read next
- evidence

## Rule Families

- `PARSE*`: TOML parse
- `MWC*`: tools/config
- `MWE*`: env
- `MWT*`: tasks
- `MWV*`: versions
- `MWL*`: lockfile
- `MWJ*`: Java selector/vendor policy
- `MWP*`: profiles

For the full rule list, read `../../../references/rules.md`.

## Review Order

1. Run the validator.
2. Run `mise tasks validate` as well.
3. Resolve errors and policy-errors first and hand them to the owner skill.
4. Report warnings together with their removal version.
5. Group info diagnostics as recommendations.
