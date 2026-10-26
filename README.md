# agent-plugins-installer

[![CI](https://github.com/ydj515/agent-plugins-installer/actions/workflows/ci.yml/badge.svg)](https://github.com/ydj515/agent-plugins-installer/actions/workflows/ci.yml)
[![Release Publish Package](https://github.com/ydj515/agent-plugins-installer/actions/workflows/release-publish.yml/badge.svg)](https://github.com/ydj515/agent-plugins-installer/actions/workflows/release-publish.yml)
[![npm version](https://img.shields.io/npm/v/agent-plugins-installer.svg?logo=npm)](https://www.npmjs.com/package/agent-plugins-installer)
[![Node.js](https://img.shields.io/badge/Node.js-24.19.0%20(%3E%3D20.0.0)-339933?logo=nodedotjs&logoColor=white)](./mise.toml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Codex, Claude Code, Gemini CLI를 위한 번들 플러그인과 익스텐션을 단일 인터페이스로 설치·관리하는 npm CLI입니다.
공통 소스 번들(`plugins/<plugin-id>/`)과 타깃별 오버레이를 결합해 에이전트마다 다른 로컬 마켓플레이스·익스텐션 구조를 자동으로 프로비저닝합니다.
저장소를 직접 클론하지 않고도 `npx` 한 줄로 대화형 위저드 또는 비대화형 명령을 실행할 수 있습니다.

**기술 스택:** Node.js (ESM, `>=20.0.0`) · npm CLI · node:test · mise · GitHub Actions

## 주요 기능

- **멀티 에이전트 통합 설치:** 하나의 통합 번들을 Codex 플러그인, Claude Code 플러그인, Gemini CLI 익스텐션 규격에 맞춰 변환 및 등록
- **대화형 위저드와 직접 제어:** 인자 없이 실행하는 터미널 UI 위저드와 `--plugins`, `--tag`, `--group`, `--dry-run` 기반의 CLI 명령(`install`, `list`, `update`, `remove`) 지원
- **스코프 분리 및 상태 관리:** 사용자 전역(`user`)과 프로젝트(`project`/`workspace`) 범위를 분리하고, 소유권 및 상태 파일로 안전한 업데이트·삭제 보장

## 번들 카탈로그

[`catalog.json`](./catalog.json)에 포함된 기본 통합 번들 목록입니다.

| ID | 설명 |
| --- | --- |
| `github` | GitHub PR·이슈·CI 워크플로우 연동 번들 |
| `vercel` | Vercel 배포 및 프로젝트 구성 연동 번들 |
| `superpowers` | 계획 수립, TDD, 디버깅, 협업 워크플로우 번들 |
| `mise-workflows` | `mise.toml` 작성, 리뷰, 락파일·CI 표준화 번들 |
| `web-a11y` | Playwright·axe 기반 웹 접근성 진단 및 수정 번들 |
| `architecture-diagram` | 요구사항·스프레드시트·이미지 기반 HTML 아키텍처 다이어그램 생성 번들 |
| `hiring-analyzer` | 7가지 근거 기반 관점의 이력서 분석 및 사실 보존 리라이팅 번들 |

## 요구 사항

- **CLI 실행:** Node.js `>=20.0.0` 및 대상 에이전트 CLI (`codex`, `claude`, `gemini`)
- **로컬 개발:** [mise](https://mise.jdx.dev/) — 개발용 Node.js 버전(`24.19.0`)은 [`mise.toml`](./mise.toml)에 고정되어 있으며 `mise`가 설치합니다.

## 빠른 시작

### `npx`로 바로 사용하기

```bash
# 대화형 설치 위저드 실행
npx agent-plugins-installer

# 타깃 및 스코프 지정 설치
npx agent-plugins-installer install codex --scope workspace --plugins github,mise-workflows
npx agent-plugins-installer install claude --scope user --plugins github,vercel
npx agent-plugins-installer install gemini --scope user --plugins vercel

# 설치 목록 확인, 업데이트, 제거
npx agent-plugins-installer list all --scope user
npx agent-plugins-installer update codex --scope workspace --plugins github
npx agent-plugins-installer remove codex --scope workspace --plugins github
```

### 로컬 개발 환경 실행

```bash
mise trust       # 최초 1회, mise.toml 검토 후 신뢰
mise install     # 고정된 Node.js(24.19.0) 설치
mise run verify  # 테스트 + 패키지 번들 검증 + npx 스모크 테스트
```

에이전트별 상세 프로비저닝 경로, 직접 탐색용 마켓플레이스 매니페스트(`.generated/direct/`), 배포 절차는 [사용 및 아키텍처 가이드](./docs/GUIDE.md)에 설명합니다.

## 주요 명령

| 명령 | 설명 |
| --- | --- |
| `mise run start` | 로컬 CLI 실행 (`node src/cli.js`) |
| `mise run test` | 직접 설치 번들 동기화 후 자동화 테스트 실행 (`npm test`) |
| `mise run test-matrix` | CI 지원 런타임(Node 20, 22, 24) 전체 테스트 실행 |
| `mise run pack` | 배포용 npm 타르볼 구성 검증 (`npm pack --dry-run`) |
| `mise run smoke` | 타르볼 생성 후 격리 환경에서 `npx` 설치 스모크 테스트 |
| `mise run verify` | `test` + `pack` + `smoke` 통합 품질 검증 |

전체 task 목록은 `mise tasks`로 확인할 수 있습니다.

## 문서

- [사용 및 아키텍처 가이드](./docs/GUIDE.md)
- [구현 계획 및 설계 배경](./docs/IMPLEMENTATION_PLAN.md)
- [변경 이력 (CHANGELOG)](./CHANGELOG.md)

## 기여

변경 전 [기여 가이드](./CONTRIBUTING.md)를 확인해 주세요.
