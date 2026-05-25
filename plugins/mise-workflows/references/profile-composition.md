# Profile Composition

## 구성 원칙

- profile은 도구 선언과 skill 조합의 라우터다.
- core skill은 workflow를 제공하고, ecosystem reference는 세부 selector/runtime/build 관례를 제공한다.
- profile은 언어별 세부 규칙 저장소가 아니다.
- profile은 공통 policy와 ecosystem rule을 조합하는 역할만 맡는다.
- profile 이름과 required skill 목록은 `profile-catalog.md`가 소유한다.
- 실제 starter `mise.toml` 샘플은 `profile-examples.md`와 개별 example 문서가 소유한다.

## 선택 절차

1. 저장소의 언어와 build tool 신호를 본다.
2. 가장 가까운 profile 하나를 우선 선택한다.
3. related reference를 읽는다.
4. optional reference는 실제 저장소 특성이 맞을 때만 읽는다.
5. monorepo면 root hub/spoke 책임을 먼저 본 뒤 profile을 적용한다.
6. named profile이 깔끔하게 맞지 않으면 core skill과 ecosystem reference를 직접 조합한다.

## 선택 신호

### `python-uv-app`

- 대표 신호:
  - `pyproject.toml`
  - `uv.lock`
  - 애플리케이션 실행 진입점
  - 로컬 개발용 `.venv` / `uv sync` 흐름
- 읽을 것:
  - `references/ecosystems/python-runtime.md`
  - `references/ecosystems/python-uv.md`
  - `references/examples/python-uv-app.md`

### `python-uv-lib`

- 대표 신호:
  - `pyproject.toml`
  - build backend 설정
  - publish/release task
  - package build 또는 distribution artifact 중심 workflow
- 읽을 것:
  - `references/ecosystems/python-runtime.md`
  - `references/ecosystems/python-uv.md`
  - `references/examples/python-uv-lib.md`

### `java-gradle-app`

- 대표 신호:
  - `build.gradle` 또는 `build.gradle.kts`
  - `gradlew`
  - 일반 Java build/test/package workflow
- 읽을 것:
  - `references/ecosystems/java-runtime.md`
  - `references/ecosystems/java-gradle.md`
  - `references/examples/java-gradle-app.md`

### `java-spring-service`

- 대표 신호:
  - `build.gradle*`
  - `gradlew`
  - `spring-boot`
  - `@SpringBootApplication`
  - `application.yml` 또는 `application.properties`
- 읽을 것:
  - `references/ecosystems/java-runtime.md`
  - `references/ecosystems/java-gradle.md`
  - 필요 시 `references/ecosystems/spring-service.md`
  - `references/examples/java-spring-service.md`

## 빠른 매핑 예시

- `build.gradle` + Spring 흔적 -> `java-spring-service`
- `pyproject.toml` + uv workflow -> `python-uv-app` 또는 `python-uv-lib`
- `pyproject.toml` + workspace root + `uv.lock` -> `python-uv-*` + `monorepo-workspace.md`

구체적인 시작점이 필요하면 `profile-examples.md`와 개별 example 문서를 같이 읽는다.
