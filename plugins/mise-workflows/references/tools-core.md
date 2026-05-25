# Tools Core

## 목적

이 문서는 `mise`의 `[tools]` 섹션을 설계하거나 리뷰할 때 따르는 공통 기준을 정의한다. 언어별 vendor 규칙이나 framework별 예외는 root `references/ecosystems/` 문서에서 다룬다.

## 기본 원칙

- 가능한 경우 core tool을 우선 사용한다.
- `mise`가 직접 해석 가능한 selector만 사용한다.
- version 후보는 `mise ls-remote <tool>` 또는 `mise latest <tool@selector>` 결과 안에서만 고른다.
- tracked `mise.toml`에는 `latest`를 직접 저장하지 않는다.
- 사람이 읽기 쉬운 selector는 `mise.toml`에 두고, exact resolution은 `mise.lock`으로 관리한다.
- backend 선택은 `core tool -> maintained backend -> legacy fallback` 순으로 판단한다.

## 도구 범위

`[tools]`는 runtime뿐 아니라 build tool과 package manager도 포함한다. 예:

- runtime: `java`, `python`, `node`
- build tool: `gradle`
- package manager / workflow tool: `uv`

## Backend 우선순위

1. core tool
2. registry에 등록된 유지보수 backend
3. `github:` 또는 `aqua:` 같은 명시적 backend
4. 예외적 상황에서만 legacy plugin 계열

## 검토 체크리스트

- tool 이름이 실제 `mise` registry 또는 core tool과 일치하는가
- selector가 조직 policy와 profile floor를 만족하는가
- `ubi:` 같은 deprecated backend를 사용하지 않는가
- `asdf:`가 기본 선택처럼 쓰이지 않는가
- version file 전략과 `mise.toml`이 서로 충돌하지 않는가
- runtime, build tool, package manager가 profile과 맞는 조합으로 선언되어 있는가

## ecosystem reference map

- Java vendor와 idiomatic file: `references/ecosystems/java-runtime.md`
- Gradle selector와 wrapper 경계: `references/ecosystems/java-gradle.md`
- Python selector와 version file: `references/ecosystems/python-runtime.md`
- uv selector와 Python workflow: `references/ecosystems/python-uv.md`
- Spring 서비스 관례: `references/ecosystems/spring-service.md`
