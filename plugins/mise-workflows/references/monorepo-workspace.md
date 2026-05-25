# Monorepo Workspace

## 목적

이 문서는 `uv` workspace나 다중 패키지 저장소에서 `mise`와 workspace 도구를 함께 사용할 때의 운영 기준을 정리한다.

## Python uv workspace

- `.venv`는 가능하면 workspace root에 한 번만 만든다.
- dev dependency는 root `pyproject.toml`에 hoist하는 편이 관리가 쉽다.
- 하위 패키지는 runtime 정책은 공유하되 package metadata만 개별 관리한다.

## Root 중심 배치

루트에는 보통 다음이 온다.

- 공통 `mise.toml`
- workspace root `pyproject.toml`
- 공통 `uv.lock`
- 공통 dev dependency group

하위 패키지에는 보통 다음이 온다.

- package별 `pyproject.toml`
- package별 task 또는 추가 env

## Monorepo task와의 연결

- 루트 task는 bootstrap, lint-all, test-all, release orchestration을 담당한다.
- 하위 task는 package-local build/test/run을 담당한다.
- experimental monorepo task를 쓴다면 `mise-tasks`의 advanced reference를 함께 읽는다.

## 검토 질문

- workspace root에 공통 `.venv`를 둘지 package별로 분리할지 명확한가
- dev dependency가 중복되지 않는가
- root와 package의 책임이 분리되어 있는가
