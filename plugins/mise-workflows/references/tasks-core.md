# Tasks Core

## 목적

이 문서는 `mise` task 설계, file task, monorepo task composition에 대한 공통 기준을 정의한다.

## 기본 원칙

- task 이름은 목적이 바로 드러나게 짓는다.
- `description`은 사람뿐 아니라 에이전트가 읽는 문맥이므로 비워두지 않는다.
- 복잡한 인자 처리는 modern `usage` 흐름을 우선 사용한다.
- file task는 formatter-safe header를 사용한다.
- monorepo dependency는 추론보다 명시를 우선한다.
- long-running workflow는 shell session에 매이지 않게 설계한다.

## 권장 패턴

- 짧은 실행 흐름은 `[tasks]`에 유지
- 반복적이거나 긴 shell은 별도 스크립트로 분리
- file task header는 `#MISE` 또는 `# [MISE]` 형식을 유지
- monorepo dependency는 `:task`처럼 명시적으로 적기
- hidden helper task로 검증/guard를 분리
- release는 DAG를 명시적으로 적고 build artifact를 publish 전에 보장

## 자주 같이 읽을 문서

- `task-arguments.md`
- `task-advanced.md`
- `task-patterns.md`
- `release-workflow-patterns.md`

## 회피 패턴

- deprecated task template helper
- bare dependency 이름 남발
- formatter가 깨뜨리는 file task comment
- 너무 많은 책임이 섞인 단일 task
- long-running remote workflow를 `depends`로만 연결

## 검토 체크리스트

- task가 profile 관례와 맞는가
- 인자 정의 방식이 하나로 통일되어 있는가
- long-running shell이 재사용 가능한 스크립트로 분리되어 있는가
- release/publish task가 build dependency와 artifact 검증을 보장하는가
