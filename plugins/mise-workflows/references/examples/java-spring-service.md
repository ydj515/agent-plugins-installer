# java-spring-service

## 언제 쓰는가

- Spring Boot 서비스
- `build.gradle*`, `gradlew`, `application.yml`, `@SpringBootApplication` 신호가 있는 저장소
- Java/Gradle 기본 규칙 위에 service-oriented env/task가 필요한 경우

## selector 기준

- Java runtime: `zulu-21`
- Gradle: `8.14`

2026-05-24 기준 exact candidate는 다음이었다.

- `mise latest java@zulu-21` -> `zulu-21.50.19.0`
- `mise latest gradle@8` -> `8.14.5`

## Example `mise.toml`

```toml
[tools]
java = "zulu-21"
gradle = "8.14"

[env]
SPRING_PROFILES_ACTIVE = "local"
SERVER_PORT = "8080"

[tasks._verify-env]
hide = true
description = "Validate the Spring runtime profile before starting the service."
run = '[ -n "$SPRING_PROFILES_ACTIVE" ] || { echo "Missing SPRING_PROFILES_ACTIVE"; exit 1; }'

[tasks.boot]
description = "Start the Spring Boot service with the repository wrapper."
depends = ["_verify-env"]
run = "./gradlew bootRun"

[tasks.test]
description = "Run the service test suite."
run = "./gradlew test"

[tasks.package]
description = "Build a deployable jar after verification succeeds."
depends = ["test"]
run = "./gradlew bootJar"
```

## Notes

- local DB credentials나 secret은 tracked config 대신 `mise.local.toml` 또는 redacted file loading으로 분리한다.
- `bootRun`과 package lifecycle을 분리해 dev flow와 release flow를 읽기 쉽게 유지한다.
- Spring 특화 규칙은 `references/ecosystems/spring-service.md`, runtime/build 규칙은 각각 `references/ecosystems/java-runtime.md`, `references/ecosystems/java-gradle.md`를 본다.
