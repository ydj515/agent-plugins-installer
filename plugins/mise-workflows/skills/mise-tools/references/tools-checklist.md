# Tools Execution Checklist

## 먼저 확인할 것

- profile이 이미 정해졌는가
- 공통 정책은 `../../../references/policy-core.md`와 `../../../references/version-policy.md`를 따르는가
- selector floor는 관련 ecosystem reference에 정의되어 있는가
- runtime, build tool, package manager를 같이 봐야 하는 저장소인가

## 작성 순서

1. tool 이름을 확정한다. registry short name이 있으면 그것을 쓴다.
2. backend를 직접 골라야 하면 `packslip` → `aqua`, `github` → `http` → 언어 패키지 → plugin 순으로 본다.
3. `mise ls-remote` 또는 `mise latest`로 실제 후보를 본다.
4. request를 정한다. npm 스타일 range와 `latest`는 쓰지 않는다.
5. 필요한 tool option(`minimum_release_age`, `version_order` 등)을 table로 적는다.
6. lock 전략을 정한다(`../../../references/lockfile.md`).
7. ecosystem-specific rule이 있으면 root ecosystem reference를 읽는다.

## ecosystem handoff

- Java runtime: `../../../references/ecosystems/java-runtime.md`
- Gradle build: `../../../references/ecosystems/java-gradle.md`
- Python runtime: `../../../references/ecosystems/python-runtime.md`
- uv workflow: `../../../references/ecosystems/python-uv.md`
- Spring service: `../../../references/ecosystems/spring-service.md`
