---
name: a11y-fix-guide
description: Fix actionable accessibility findings from Playwright/axe-core audit JSON or Markdown reports in a local web codebase. Use when Codex is asked to remediate, patch, or implement fixes for axe rules such as button-name, link-name, select-name, page-has-heading-one, landmark-one-main, region, bypass, labels, ARIA, keyboard, focus, and related rendered DOM findings. Do not automatically fix color-contrast findings; always ask the user before making any color-contrast change.
---

# A11y Fix Guide

## Overview

Use an axe audit report to make focused source-code fixes, then rerun an audit to verify the rendered page. Treat report selectors as rendered DOM locations, not source-code locations.

Do not edit `color-contrast` findings without explicit user confirmation in the current thread, even when the user asks to "fix all" accessibility issues.

## Workflow

1. Read the audit artifact.
   - Prefer the `.json` report because it contains `nodes[].html` and `failureSummary`.
   - Use the `.md` report as a human summary when both files are present.
   - Classify `violations` before `incomplete`, ordered by `critical`, `serious`, `moderate`, then `minor`.

2. Split findings into two queues.
   - `color-contrast`: report the affected selectors and ask whether to modify colors before editing anything for that rule.
   - All other actionable findings: continue with source mapping and fixes.

3. Map rendered DOM to source.
   - Search stable identifiers first: ids, semantic class names, route paths, link hrefs, visible text, form names, labels, and component names.
   - Use `rg` against likely template/component files such as `.html`, `.tsx`, `.jsx`, `.vue`, `.svelte`, `.jsp`, `.ftl`, `.mustache`, `.hbs`, `.erb`, `.java`, and route/view folders.
   - If selectors are generated or positional, use `nodes[].html` and nearby visible text to find the source.
   - If the deployed page does not match the local source, report that mismatch instead of guessing.

4. Fix narrowly.
   - Preserve existing framework conventions, styling system, and component APIs.
   - Prefer semantic HTML and native accessible names over ARIA when practical.
   - Avoid broad redesigns, unrelated refactors, and global CSS changes unless the finding is clearly global.

5. Verify.
   - Run the project tests or the narrowest relevant checks when available.
   - Rerun an axe audit for the affected URL/state using `a11y-audit-guide` or the same Playwright/axe path that produced the report.
   - Summarize fixed rules, remaining findings, and any `incomplete` manual-review items.

## Color Contrast Gate

When any finding has `id: "color-contrast"`:

1. Do not change color tokens, CSS variables, theme values, image overlays, gradients, or component color props yet.
2. Summarize the affected selectors, example HTML, and whether the item is a confirmed `violation` or `incomplete`.
3. Ask the user for explicit approval to modify color contrast.
4. Continue fixing non-color findings if that can be done safely without touching colors.
5. After approval, prefer the smallest change that preserves brand intent and meets WCAG contrast targets.

If only `color-contrast` findings remain, stop after asking for approval.

## Rule Patterns

Read `references/remediation-patterns.md` when choosing fixes for common axe rule ids.

## Reporting

In the final response:

- State which report file was used.
- List fixed rules by axe id and impact.
- List skipped `color-contrast` items if user approval was not given.
- Include verification commands and results.
- Mention that selectors are rendered DOM locations, not source-code locations.
