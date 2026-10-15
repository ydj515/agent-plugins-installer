# java-gradle-app

## 언제 쓰는가

- 일반 Java 애플리케이션
- `build.gradle` 또는 `build.gradle.kts`를 사용하는 저장소
- runtime은 `mise`, 프로젝트 실행 진입점은 Gradle wrapper로 가져가고 싶은 경우

## selector 기준

- Java runtime: `zulu-25`
- Gradle: `9.8`

2026-10-16 기준 exact candidate는 다음이었다.

- `mise latest java@zulu-25` -> `zulu-25.36.205.0`
- `mise latest gradle@9.8` -> `9.8.1`

기존 Java 21 / Gradle 8 프로젝트는 `zulu-21` / `8.14`를 유지하고 단계적으로 올린다.

## Example `mise.toml`

```toml
[tools]
java = "zulu-25"
gradle = "9.8"

[settings]
lockfile = true

[env]
JAVA_TOOL_OPTIONS = "-Dfile.encoding=UTF-8"

[tasks.build]
description = "Compile and package the Java application with the repository wrapper."
usage = '''
about "mise run build: compile and package the Java application with the repository wrapper"
'''
run = "./gradlew build"

[tasks.test]
description = "Run the Gradle test task using the repository wrapper."
usage = '''
about "mise run test: run the Gradle test task using the repository wrapper"
'''
run = "./gradlew test"

[tasks.check]
description = "Run the standard verification lifecycle before packaging."
usage = '''
about "mise run check: run the standard verification lifecycle before packaging"
'''
depends = ["test"]
run = "./gradlew check"

[tasks.wrapper]
description = "Regenerate the Gradle wrapper with the mise-managed Gradle version."
usage = '''
about "mise run wrapper: regenerate the Gradle wrapper with the mise-managed Gradle version"
'''
run = "gradle wrapper"
```

## Notes

- 팀 정책상 `java = "25"` 같은 vendor 없는 selector는 쓰지 않는다. mise 2026.10.5부터 vendor 기본값이 바뀌어 같은 값이 다른 build로 해석될 수 있다.
- wrapper가 실제 build 버전을 정한다. `mise.toml`의 `gradle`은 wrapper 갱신과 개발 환경 정렬용이다.
- 실제 실행 task는 wrapper를 우선 사용해 repository-local Gradle contract를 따른다.
- `mise.lock`은 커밋한다.
