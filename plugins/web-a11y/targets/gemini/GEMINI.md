# Web A11y Extension

This Gemini CLI extension bundles Playwright-based accessibility audit reporting and axe remediation workflows for React, Next.js, Thymeleaf, and other web application URLs.

Preferred workflow:

- use `a11y-audit-guide` to inspect target URLs and produce JSON plus Markdown reports
- use `a11y-fix-guide` to remediate actionable axe findings from JSON or Markdown reports
- treat selectors in the report as rendered DOM locations, not source-code locations
- ask before changing anything for `color-contrast` findings
- keep any follow-up edits scoped to the current web application unless the user asks to widen the change
