# Hub-Spoke Architecture

## 목적

이 문서는 monorepo나 다중 도메인 저장소에서 `mise.toml`을 루트 허브와 하위 스포크로 나눠 운영하는 방식을 정리한다.

## 언제 쓰는가

- 루트에 공통 tool/runtime만 두고 싶을 때
- 하위 디렉터리별 env/task 차이가 큰 저장소일 때
- 실험용, 서비스용, 배치용 디렉터리의 작업 흐름이 다를 때

## Hub 책임

루트 `mise.toml`은 다음을 우선 소유한다.

- 공통 `[tools]`
- 공통 `[env]`
- 조직 공통 task entrypoint
- profile routing의 기본값

루트 파일은 가급적 lean하게 유지하고, 도메인별 세부 task와 env는 하위로 위임한다.

## Spoke 책임

하위 디렉터리의 `mise.toml`은 다음을 소유한다.

- 도메인별 `[env]` 확장 또는 override
- 도메인별 `[tasks]`
- 해당 디렉터리만의 local-only 설정

## 상속 규칙

- 하위 config는 상위 tool/runtime 맥락을 공유한다.
- 하위 env는 상위 env를 확장하되, override는 꼭 필요한 경우만 한다.
- local config는 디렉터리 수준에서만 적용된다고 가정한다.

## 권장 패턴

- Hub는 공통 runtime, shared secrets loading strategy, orchestration task만 유지
- Spoke는 build/test/run처럼 도메인 작업을 정의
- profile은 hub에서 1차 분류하고, spoke에서 optional skill을 더 읽게 만든다

## 회피 패턴

- 루트와 하위 디렉터리에 같은 tool selector를 반복 선언
- spoke에서 shared policy를 다시 정의
- 모든 task를 루트 하나에 몰아넣기
