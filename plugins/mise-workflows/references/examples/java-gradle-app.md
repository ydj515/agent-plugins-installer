# java-gradle-app

## 언제 쓰는가

- 일반 Java 애플리케이션
- `build.gradle` 또는 `build.gradle.kts`를 사용하는 저장소
- runtime은 `mise`, 프로젝트 실행 진입점은 주로 Gradle wrapper로 가져가고 싶은 경우

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
JAVA_TOOL_OPTIONS = "-Dfile.encoding=UTF-8"

[tasks.build]
description = "Compile and package the Java application with the repository wrapper."
run = "./gradlew build"

[tasks.test]
description = "Run the Gradle test task using the repository wrapper."
run = "./gradlew test"

[tasks.check]
description = "Run the standard verification lifecycle before packaging."
depends = ["test"]
run = "./gradlew check"
```

## Notes

- 팀 정책상 `java = "21"` 같은 shorthand는 쓰지 않고 vendor-qualified selector를 유지한다.
- wrapper가 있어도 개발 환경 정렬을 위해 `gradle` tool을 선언할 수 있다.
- 실제 실행 task는 wrapper를 우선 사용해 repository-local Gradle contract를 따른다.
