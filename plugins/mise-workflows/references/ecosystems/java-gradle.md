# Java Gradle

## 역할

- Gradle selector floor와 wrapper 경계를 다룬다.
- Java runtime 규칙 위에 build tool 관점의 판단을 얹는다.
- Spring 서비스 관례 자체는 별도 문서로 분리한다.

## 기본 원칙

- Gradle selector floor는 shared policy와 profile 맥락 안에서 판단한다.
- 프로젝트 build 진입점은 Gradle wrapper(`gradlew`)다. wrapper가 정한 Gradle 버전이 실제 build 버전이다.
- `mise`의 `gradle`은 wrapper 생성·갱신(`gradle wrapper`)과 개발 환경 정렬용이다. 두 버전이 크게 어긋나지 않게 맞춘다.
- runtime selector와 build selector를 같은 규칙으로 뭉뚱그리지 않는다.
- registry의 `gradle`은 `aqua:gradle/gradle-distributions` backend를 쓴다.

## 기본 정책

- 신규 프로젝트 추천 selector: `9.8` (Gradle 9 계열)
- 기존 Gradle 8 프로젝트: `8.14`를 유지하고 Gradle 9 migration 항목을 확인한 뒤 올린다
- Gradle 9는 Gradle 자체를 JVM 17 이상에서 실행한다. Java runtime selector와 함께 확인한다
- 2026-10-16 기준 후보: `mise latest gradle@9` → `9.8.1`, `mise latest gradle@8` → `8.14.6`

## 점검 질문

- profile이 실제로 Gradle을 요구하는가
- selector가 현재 지원 floor보다 낮지 않은가
- wrapper(`gradle/wrapper/gradle-wrapper.properties`)의 버전과 `mise.toml` selector가 같은 major인가
- Java runtime 규칙은 `references/ecosystems/java-runtime.md`와 함께 봤는가

## 조합 원칙

- Java runtime 규칙은 `references/ecosystems/java-runtime.md`
- Gradle selector와 wrapper 판단은 이 문서
- Spring 서비스 관례는 `references/ecosystems/spring-service.md`

## 같이 볼 문서

- Java runtime 정책: `references/ecosystems/java-runtime.md`
- Spring 서비스 관례: `references/ecosystems/spring-service.md`
- Java app starter: `references/examples/java-gradle-app.md`
