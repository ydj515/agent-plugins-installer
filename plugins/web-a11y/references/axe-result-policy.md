# Axe Result Policy

## Status Criteria

- `FAIL`
  - One or more `violations` are present.
- `REVIEW`
  - No `violations` are present, but one or more `incomplete` items remain.
- `PASS`
  - `violations = 0` and `incomplete = 0`.

## Priority Order

1. `critical`
2. `serious`
3. `moderate`
4. `minor`

## Interpretation Rules

- `violations`
  - Automatically confirmed accessibility failures.
- `incomplete`
  - Items that require manual review before they can be closed.
- `passes`
  - Rules that passed in the current rendered page state.
- `inapplicable`
  - Rules that do not apply to the current page.

## Reporting Rules

- Preserve both page-level and overall summaries.
- Check `critical` and `serious` results first when summarizing a report.
- Do not hide `incomplete` results; keep them as manual-review items.
