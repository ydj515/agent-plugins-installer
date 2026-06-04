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

## 경로 원칙

- `outputDir`는 config 파일 기준 상대 경로로 해석한다.
- `--output-dir` 또는 `--output`는 URL 직접 실행 시 현재 작업 디렉터리 기준 상대 경로로 해석한다.
- 페이지 `url`이 상대 경로면 `baseUrl`이 필요하다.
- 인증이 필요한 플로우는 추후 확장 시 storage state나 사전 로그인 스텝을 추가한다.
