# java-spring-service

## 언제 쓰는가

- Spring Boot 서비스
- `build.gradle*`, `gradlew`, `application.yml`, `@SpringBootApplication` 신호가 있는 저장소
- Java/Gradle 기본 규칙 위에 service-oriented env/task가 필요한 경우

## selector 기준

- Java runtime: `zulu-25`
- Gradle: `9.8`

2026-10-16 기준 exact candidate는 다음이었다.

- `mise latest java@zulu-25` -> `zulu-25.36.205.0`
- `mise latest gradle@9.8` -> `9.8.1`

사용하는 Spring Boot 버전이 Java 25를 지원하지 않으면 `zulu-21`을 유지한다.

## Example `mise.toml`

```toml
[tools]
java = "zulu-25"
gradle = "9.8"

[settings]
lockfile = true

[env]
SPRING_PROFILES_ACTIVE = { default = "local" }
SERVER_PORT = "8080"

[tasks.boot]
description = "Start the Spring Boot service with the repository wrapper."
usage = '''
about "mise run boot: start the Spring Boot service with the repository wrapper"
'''
env.SPRING_DATASOURCE_URL = { required = "Set the local database URL in mise.local.toml" }
run = "./gradlew bootRun"

[tasks.test]
description = "Run the service test suite."
usage = '''
about "mise run test: run the service test suite"
'''
run = "./gradlew test"

[tasks.package]
description = "Build a deployable jar after verification succeeds."
usage = '''
about "mise run package: build a deployable jar after verification succeeds"
'''
depends = ["test"]
sources = ["build.gradle*", "settings.gradle*", "src/main/**"]
outputs = ["build/libs"]
run = "./gradlew bootJar"
```

`mise.local.toml` (커밋하지 않음):

```toml
[env]
SPRING_DATASOURCE_URL = "jdbc:postgresql://localhost:5432/app"
SPRING_DATASOURCE_PASSWORD = { value = "local-only", redact = true }
```

## Notes

- `required`를 `boot` task의 `env`에만 둬서, 접속 정보가 필요 없는 `test`나 CI는 영향을 받지 않게 한다. 별도 `_verify-env` helper task가 필요 없다.
- local DB credentials나 secret은 tracked config 대신 `mise.local.toml`, SOPS 파일, 또는 redacted file loading으로 분리한다.
- `bootRun`과 package lifecycle을 분리해 dev flow와 release flow를 읽기 쉽게 유지한다.
- Spring 특화 규칙은 `references/ecosystems/spring-service.md`, runtime/build 규칙은 각각 `references/ecosystems/java-runtime.md`, `references/ecosystems/java-gradle.md`를 본다.
