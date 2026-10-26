# Guide

`agent-plugins-installer`의 상세 사용법, 타깃별 동작 방식, 저장소 마켓플레이스 매니페스트, 로컬 개발 및 배포 가이드입니다.

## 아키텍처 개요

`agent-plugins-installer`는 공통 소스 번들을 유지한 뒤 설치 시점에 각 에이전트 CLI가 요구하는 디렉터리 구조와 매니페스트로 변환해 프로비저닝합니다.

- **공통 소스:** [`plugins/<plugin-id>/`](../plugins)
- **타깃 오버레이:** `plugins/<plugin-id>/targets/<codex|claude|gemini>/`
- **설치기 역할:** 공통 번들과 타깃 오버레이를 병합해 에이전트별 로컬 번들을 생성하고, 각 CLI의 마켓플레이스·플러그인·익스텐션 등록 명령을 실행합니다.

지원 타깃:

- **Codex:** 로컬 플러그인 복사 및 마켓플레이스(`marketplace.json`) 프로비저닝
- **Claude Code:** 로컬 플러그인 복사 및 로컬 마켓플레이스 프로비저닝
- **Gemini CLI:** 로컬 익스텐션 번들 복사 및 `gemini extensions install/enable` 실행 (Gemini는 플러그인 대신 익스텐션 모델을 사용합니다)

## CLI 사용법

### 대화형 모드 (Interactive)

인자 없이 실행하면 터미널 대화형 위저드가 시작됩니다(TTY 필요).

```bash
npx agent-plugins-installer
```

### 직접 실행 모드 (Direct CLI)

```bash
npx agent-plugins-installer install <codex|claude|gemini|all> [--scope user|workspace|project] [--cwd <path>] [--dry-run] [--force] [--plugins <a,b>] [--tag <tag>] [--group <group>]
npx agent-plugins-installer list <codex|claude|gemini|all> [--scope user|workspace|project] [--cwd <path>] [--plugins <a,b>] [--tag <tag>] [--group <group>]
npx agent-plugins-installer remove <codex|claude|gemini|all> [--scope user|workspace|project] [--cwd <path>] [--dry-run] (--plugins <a,b> | --tag <tag> | --group <group>)
npx agent-plugins-installer update <codex|claude|gemini|all> [--scope user|workspace|project] [--cwd <path>] [--dry-run] [--plugins <a,b>] [--tag <tag>] [--group <group>]
```

주요 옵션:

- `--scope`: `user`(기본값) 또는 `project`(`workspace` 별칭 지원)
- `--cwd`: `project`/`workspace` 범위 설치 시 대상 프로젝트 루트 경로 지정
- `--plugins`: 설치·조회·삭제·업데이트할 플러그인 ID 목록 (쉼표 구분)
- `--tag` / `--group`: [`catalog.json`](../catalog.json) 메타데이터 기반 필터링 (`--plugins`와 동시 사용 불가)
- `--dry-run`: 실제 파일 복사나 CLI 명령 실행 없이 예정 작업만 출력
- `--force`: 기존 관리 대상 디렉터리를 강제로 덮어쓰기 (`install` 전용)

## 타깃별 상세 동작

### Codex

- 플러그인 소스를 `.codex/plugins/<plugin-id>`에 복사합니다.
- 마켓플레이스 매니페스트 경로:
  - `user` 범위: `~/.agents/plugins/marketplace.json`
  - `project`(`workspace`) 범위: `<cwd>/.agents/plugins/marketplace.json`
- 실행 명령:
  1. `codex plugin marketplace add <marketplace-root>`
  2. `codex plugin add <plugin>@agent-plugins-installer`
  3. `codex plugin list --marketplace agent-plugins-installer`
- 설치 후 새로운 스킬·플러그인이 로드되도록 Codex를 재시작하거나 새 스레드를 시작하세요.

### Claude Code

- 통합 소스를 `.claude/plugins/<plugin-id>`에 복사합니다.
- 로컬 마켓플레이스 매니페스트를 `.claude/.claude-plugin/marketplace.json`에 생성합니다.
- 실행 명령:
  1. `claude plugin marketplace add <local-marketplace-path> --scope <scope>`
  2. `claude plugin install <plugin>@agent-plugins-installer --scope <scope>`
- 설치 상태를 `.claude/.agent-plugins-installer-state.json`에 기록합니다.
- 설치 후 Claude Code에서 `/reload-plugins`를 실행하거나 세션을 재시작하세요.

### Gemini CLI

- Gemini CLI는 플러그인이 아닌 익스텐션(`extensions`) 단위로 동작합니다.
- `user` 범위:
  - `~/.gemini/extensions/<extension-id>`에 번들을 복사하고 `gemini extensions install <local-extension-path> --consent`를 실행합니다.
  - 상태 파일: `~/.gemini/.agent-plugins-installer-state.json`
- `project`(`workspace`) 범위:
  - `<cwd>/.gemini/extensions/<extension-id>`에 번들을 복사하고 현재 워크스페이스에 대해 `gemini extensions enable <name> --scope workspace`를 실행합니다.
  - 상태 파일: `<cwd>/.gemini/.agent-plugins-installer-state.json`

## 저장소 직접 탐색용 마켓플레이스 매니페스트

이 저장소는 CLI 설치 외에도 저장소 자체를 마켓플레이스로 직접 참조할 수 있도록 루트 매니페스트를 포함합니다.

- **Codex:** [`.agents/plugins/marketplace.json`](../.agents/plugins/marketplace.json)
- **Claude Code:** [`.claude-plugin/marketplace.json`](../.claude-plugin/marketplace.json)

직접 설치용 독립 번들은 `.generated/direct/<agent>/<plugin-id>` 아래에 생성되며, 공통 소스(`plugins/<plugin-id>/`)와 타깃 오버레이(`plugins/<plugin-id>/targets/<agent>/`)를 병합해 만듭니다.

직접 설치용 번들 수동 갱신:

```bash
npm run sync:direct-bundles
```

`npm test`와 `npm run test:real-cli`는 검증 전에 위 동기화 스크립트를 자동으로 실행합니다.

## 로컬 개발 및 검증

Node.js 버전(`24.19.0`)과 개발 태스크는 [`mise.toml`](../mise.toml)에 정의되어 있습니다.

```bash
mise trust
mise install
mise run verify
```

주요 검증 명령:

- `npm test` / `mise run test`: 직접 설치 번들 동기화 후 전체 단위·통합 테스트 실행
- `mise run test-matrix`: CI 지원 버전(Node `20`, `22`, `24`) 전체 테스트 실행
- `mise run pack`: 배포될 npm 타르볼 구성 확인 (`npm pack --dry-run`)
- `mise run smoke`: 타르볼 패킹 후 격리된 임시 디렉터리에서 `npx` 설치 스모크 테스트 실행
- `npm run test:real-cli`: 실제 에이전트 CLI 대상 E2E 검증

## CI 및 배포

- **CI ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)):** Push, Pull Request, 수동 실행 시 Ubuntu 환경의 Node.js `20`, `22`, `24` 매트릭스에서 테스트, `npm pack --dry-run`, 타르볼 `npx` 스모크 테스트를 수행합니다.
- **Release ([`.github/workflows/release-publish.yml`](../.github/workflows/release-publish.yml)):** `package.json`의 `version`과 일치하는 GitHub Release 태그(예: `v0.1.10`)가 발행되면 매트릭스 검증을 다시 통과한 뒤 npm Trusted Publishing(`id-token: write`)으로 공개 배포합니다.
