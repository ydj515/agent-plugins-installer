# 기여 가이드

`agent-plugins-installer`에 기여해 주셔서 감사합니다. 변경 사항을 제출하기 전에 아래 개발 환경 설정과 검증 절차를 확인해 주세요. 상세한 동작 방식과 타깃별 레이아웃은 [사용 및 아키텍처 가이드](./docs/GUIDE.md)에 정리되어 있습니다.

## 1. 개발 환경 준비

Node.js 버전(`24.19.0`)과 공통 작업은 [`mise.toml`](./mise.toml)에 정의되어 있습니다. 런타임 호환성은 Node.js `20`, `22`, `24`를 지원합니다.

```bash
mise trust
mise install
mise tasks
```

## 2. 코드 및 플러그인 번들 작성 규칙

- **플러그인 소스 구조:** 공통 소스는 [`plugins/<plugin-id>/`](./plugins) 아래에 작성하며, 타깃별 매니페스트 오버레이는 `plugins/<plugin-id>/targets/<codex|claude|gemini>/`에 배치합니다.
- **카탈로그 및 직접 번들 동기화:** 플러그인 메타데이터를 [`catalog.json`](./catalog.json) 또는 `plugins/`에서 수정한 경우 아래 명령으로 `.generated/direct/` 번들과 루트 마켓플레이스 매니페스트 정합성을 유지하세요.
  ```bash
  npm run sync:direct-bundles
  ```
- **커밋 메시지:** `feat:`, `fix:`, `docs:`, `chore:`, `build:`, `test:` 등 Conventional Commits 형식을 따릅니다.

## 3. 필수 검증

모든 변경 사항은 Pull Request를 제출하기 전에 아래 검증 명령을 통과해야 합니다.

```bash
mise run verify
```

Node 버전 호환성이나 패키징에 영향을 주는 변경인 경우 매트릭스 테스트를 함께 실행해 주세요.

```bash
mise run test-matrix
```

## 4. 참고 문서

- [사용 및 아키텍처 가이드](./docs/GUIDE.md)
- [구현 계획 및 설계 배경](./docs/IMPLEMENTATION_PLAN.md)
- [변경 이력 (CHANGELOG)](./CHANGELOG.md)
