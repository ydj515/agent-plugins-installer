---
name: a11y-autofix
description: Use when a Spring Boot or Thymeleaf project already has an accessibility report and the user explicitly wants safe automated fixes, a dry-run change plan, or a rerun loop for unresolved accessibility violations.
---

# A11y Autofix

## Overview

Read an existing accessibility report, derive only safe Thymeleaf-oriented fix candidates, and prepare the next rerun step. Prefer this skill when the user wants automation after the audit report already exists.

## Workflow

1. Confirm the report path and project root before changing files.
2. Read `../../references/axe-result-policy.md` and `../../references/thymeleaf-fix-patterns.md`.
3. Generate a dry-run plan first.
4. Apply only low-risk fixes with unambiguous intent.
5. Re-run the audit loop after changes.
6. Leave unresolved or context-heavy findings for manual review.

## Safe Changes Only

- Missing `alt` on decorative or descriptive images when the intended meaning is clear
- Missing `label` and `for` linkage when a unique form field pairing is obvious
- Missing `aria-describedby` when an existing help text element is already present
- Missing accessible names on buttons when the visible text is already present in the template

## Avoid These Changes

- Landmark restructuring
- Heading hierarchy rewrites
- Link text rewrites that require content judgment
- Widget ARIA changes for custom JavaScript components
- Cross-template fragment edits without verifying downstream impact

## Commands

From the plugin `scripts/` directory:

```bash
npm install --ignore-scripts
npm run autofix -- --report <path-to-report.json> --dry-run
npm run rerun -- --config <path-to-audit-config.json> --report <path-to-report.json>
```

## Output Rules

- Emit a plan file even when no file edits are applied.
- Record why a rule was skipped instead of silently ignoring it.
- Keep `incomplete` items open unless the user provides a manual resolution.

## Handoff

- Use this skill only after `$a11y-audit-guide` has produced a report.
- If a safe fix cannot be proven, stop at the guide and ask for user confirmation before editing.
