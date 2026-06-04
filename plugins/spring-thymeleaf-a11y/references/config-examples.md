# Config Examples

## Audit Config Example

```json
{
  "baseUrl": "http://localhost:8080",
  "outputDir": "./reports/a11y",
  "reportName": "local-dev-audit.json",
  "tags": ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
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
cd plugins/spring-thymeleaf-a11y/scripts
npm install --ignore-scripts
npm run audit -- --config ../../examples/local-a11y-config.json
npm run fix-guide -- --report ../../examples/reports/a11y/local-dev-audit.json
npm run autofix -- --report ../../examples/reports/a11y/local-dev-audit.json --dry-run
```

## 경로 원칙

- `outputDir`는 config 파일 기준 상대 경로로 해석한다.
- 페이지 `url`이 상대 경로면 `baseUrl`이 필요하다.
- 인증이 필요한 플로우는 추후 확장 시 storage state나 사전 로그인 스텝을 추가한다.
