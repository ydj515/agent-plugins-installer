# Architecture Diagram Extension

This Gemini CLI extension bundles a workflow for building standalone HTML architecture diagrams and resource allocation plans from spreadsheets, architecture photos or screenshots, and text requirements.

Preferred workflow:

- use `architecture-diagram` to create or update a single HTML file with card-based zones, SVG connectors, and resource allocation tables
- derive cards, connectors, allocation tables, and KPIs from one data model inside the HTML
- record the source file, sheet, row, or image region for each resource and connection
- mark unreadable or conflicting inputs as needing confirmation instead of guessing
- treat the bundled reference HTML as a visual reference only, not as data to copy
