# Spring Service

## 역할

- Spring 서비스 profile에 필요한 service-oriented convention을 정리한다.
- Java runtime과 Gradle build 규칙을 대체하지 않고 조합한다.

## 기본 원칙

- Spring 서비스 판단은 실제 저장소 신호가 있을 때만 적용한다.
- local DB credentials나 secret은 tracked config 대신 `mise.local.toml` 또는 redacted file loading으로 분리한다.
- `bootRun`과 package lifecycle을 분리해 dev flow와 release flow를 읽기 쉽게 유지한다.

## 조합 규칙

- Java runtime: `references/ecosystems/java-runtime.md`
- Gradle build: `references/ecosystems/java-gradle.md`
- shared policy: `references/policy-core.md`

## 점검 질문

- 저장소에 `spring-boot`, `@SpringBootApplication`, `application.yml` 같은 실신호가 있는가
- runtime/build selector 결정은 Java/Gradle 문서에서 먼저 정리했는가
- service 전용 env/task만 추가하고 generic runtime/build 규칙과 뒤섞지 않았는가

## 같이 볼 문서

- Java runtime 정책: `references/ecosystems/java-runtime.md`
- Gradle build 정책: `references/ecosystems/java-gradle.md`
- Spring starter example: `references/examples/java-spring-service.md`
