# Web A11y Extension

This Gemini CLI extension bundles Playwright-based accessibility audit reporting for React, Next.js, Thymeleaf, and other web application URLs.

Preferred workflow:

- use `a11y-audit-guide` to inspect target URLs and produce JSON plus Markdown reports
- treat selectors in the report as rendered DOM locations, not source-code locations
- keep any follow-up edits scoped to the current web application unless the user asks to widen the change
