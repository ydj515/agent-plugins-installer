# Java Runtime

## 역할

- Java runtime selector와 vendor policy를 다룬다.
- `.java-version`, `.sdkmanrc` 같은 idiomatic version file과 tracked `mise.toml`의 정합성을 다룬다.
- build tool 규칙이나 Spring 서비스 관례 자체는 이 문서가 직접 소유하지 않는다.

## 기본 원칙

- Java는 vendor-qualified selector를 사용한다.
- vendor가 없는 `21`, `lts`는 정책 허용이 없으면 피한다.
- runtime 선택과 build tool 선택을 분리한다.
- `JAVA_HOME`이 암묵적으로 맞을 거라고 가정하지 말고 tool selector와 version file을 함께 확인한다.

## vendor를 명시해야 하는 이유

- vendor가 없는 request는 `java.shorthand_vendor` setting을 따른다.
- 이 기본값은 mise 2026.10.5에서 `openjdk`에서 `temurin`으로 바뀌었다. 같은 `java = "21"`이 mise 버전에 따라 다른 build로 해석된다.
- `openjdk` 기준으로 기록된 lockfile entry는 새 기본값과 맞지 않아 `mise install --locked`가 실패할 수 있다.
- 공식 문서도 shared config에는 vendor를 명시하라고 권장한다.

## 기본 정책

- 팀 기본 vendor: `zulu`
- 신규 프로젝트 추천 selector: `zulu-25` (Java 25 LTS)
- 기존 Java 21 프로젝트: `zulu-21` 유지. framework와 build tool 지원을 확인한 뒤 25로 올린다
- tracked config에서 vendor가 없는 `21`, `25`, `lts`는 정책 위반 후보
- JRE만 필요하면 `temurin-jre-25`처럼 variant를 명시한다
- 2026-10-16 기준 후보: `mise latest java@zulu-25` → `zulu-25.36.205.0`, `mise latest java@zulu-21` → `zulu-21.52.203.0`

## Version File

- `.java-version`, `.sdkmanrc`는 `idiomatic_version_file_enable_tools`에 `java`를 추가해야 읽힌다.
- `.java-version`에 vendor 없이 `21`만 있으면 `java.shorthand_vendor`를 따른다. 공유 파일이라면 `mise.toml`을 source of truth로 둔다.
- `.sdkmanrc`의 vendor 식별자는 mise 이름으로 변환된다(`21.0.9-tem` → `temurin-21.0.9`).

## 점검 질문

- selector가 `zulu-25`처럼 vendor를 명시하는가
- selector 후보가 `mise ls-remote java zulu-25` 결과와 맞는가
- `.java-version` 또는 관련 idiomatic file 전략과 충돌하지 않는가
- build/test workflow가 있으면 `references/ecosystems/java-gradle.md`와 함께 봤는가

## 같이 볼 문서

- Gradle selector와 wrapper 경계: `references/ecosystems/java-gradle.md`
- Spring 서비스 관례: `references/ecosystems/spring-service.md`
- Java starter example: `references/examples/java-gradle-app.md`
