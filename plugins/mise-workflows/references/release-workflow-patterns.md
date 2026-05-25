# Release Workflow Patterns

## 목적

이 문서는 `mise` task로 release DAG를 설계할 때의 공통 패턴을 정리한다.

## 권장 DAG

1. `release:preflight`
2. `release:build`
3. `release:smoke`
4. `release:publish`
5. `release:full`

핵심은 publish가 build artifact를 명시적으로 의존해야 한다는 점이다.

```toml
[tasks.release:preflight]
description = "검증: 작업 디렉터리, 인증, 테스트 준비 상태를 확인한다."
run = "./scripts/release-preflight.sh"

[tasks.release:build]
description = "배포 가능한 artifact를 생성한다."
depends = ["release:preflight"]
run = "./scripts/release-build.sh"

[tasks.release:publish]
description = "검증된 artifact만 배포한다."
depends = ["release:build"]
run = "./scripts/release-publish.sh"

[tasks.release:full]
description = "release workflow 전체를 실행한다."
depends = ["release:publish"]
run = "echo release complete"
```

## 선택적 재실행

build를 다시 실행하지 않고 publish만 재시도해야 한다면 guard task를 둔다.

- artifact 존재 확인
- 버전 bump 여부 확인
- release credential 확인

## 자주 보이는 문제

- publish task가 build를 의존하지 않음
- orchestrator가 실제 DAG를 실행하지 않고 안내 문구만 출력함
- wheel, jar, binary가 서로 다른 경로에 흩어져 검증이 어려움
- tool dependency가 빠져 release 단계에서 뒤늦게 실패함

## Review 질문

- publish는 build artifact를 직접 보장하는가
- selective rerun과 full orchestrator 둘 다 존재하는가
- release에 필요한 외부 도구가 `[tools]`에 같이 선언되어 있는가
