# Config Examples

## Audit Config Example

```json
{
  "baseUrl": "http://localhost:3000",
  "outputDir": "./reports/a11y",
  "reportName": "local-dev-audit.json",
  "markdownReportName": "local-dev-audit.md",
  "browser": {
    "headless": true
  },
  "pages": [
    {
      "name": "home",
      "url": "/",
      "waitForNetworkIdle": true
    },
    {
      "name": "login",
      "url": "/login",
      "waitForSelector": "form"
    },
    {
      "name": "order-form",
      "url": "/orders/new",
      "waitForSelector": "#order-form",
      "waitForTimeoutMs": 500
    }
  ]
}
```

## 실행 예시

```bash
cd plugins/web-a11y/scripts
npm run audit -- --url http://localhost:3000
npm run audit -- --urls http://localhost:3000,http://localhost:3000/login --output-dir ./reports/a11y
npm run audit -- --config ../../examples/local-a11y-config.json
```

The audit command writes both JSON and Markdown reports.

If `node_modules/` is missing, read `runtime-strategy.md` before installing dependencies. Prefer
`npm ci --ignore-scripts --prefer-offline --no-audit --no-fund` over `npm install`.

## Path Principles

- `outputDir` is resolved relative to the config file.
- `--output-dir` or `--output` is resolved relative to the current working directory when running directly with URL input.
- If a page `url` is relative, `baseUrl` is required.
- For flows that require authentication, add storage state or a pre-login step when extending the runner.
