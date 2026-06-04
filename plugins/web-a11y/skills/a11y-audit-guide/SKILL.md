---
name: a11y-audit-guide
description: Use when auditing one or more web URLs with Playwright and axe-core, producing JSON and Markdown accessibility reports for rendered pages across React, Next.js, Vue, Angular, Spring/Thymeleaf, or static HTML.
---

# A11y Audit Guide

## Overview

Run a Playwright + axe audit for one or more web URLs and produce JSON plus Markdown reports. Do not edit code with this skill.

## Workflow

1. Confirm the target URL or URL list; read `../../references/config-examples.md` only if config-based multi-page input is needed.
2. If runtime readiness is unclear, read `../../references/runtime-strategy.md`; do not install by default.
3. Run the scripted audit or documented fallback to produce JSON and Markdown reports.
4. Classify with `../../references/axe-result-policy.md`.
5. Summarize critical and serious violations first, then list `incomplete` as manual-review items.

## Commands

From the plugin `scripts/` directory:

```bash
npm run audit -- --url <url>
npm run audit -- --urls <url1,url2> --output-dir <report-dir>
npm run audit -- --config <path-to-audit-config.json>
```

## Reporting

- State whether the report used the scripted runner, a fresh setup, or a fallback.
- Produce both `.json` and `.md` outputs for every audit.
- Treat report selectors as rendered DOM locations, not source-code locations.
