# Java Runtime

## 역할

- Java runtime selector와 vendor policy를 다룬다.
- `.java-version` 같은 idiomatic version file과 tracked `mise.toml`의 정합성을 다룬다.
- build tool 규칙이나 Spring 서비스 관례 자체는 이 문서가 직접 소유하지 않는다.

## 기본 원칙

- Java는 vendor-qualified selector를 우선 사용한다.
- shorthand major는 정책 허용이 없으면 피한다.
- runtime 선택과 build tool 선택을 분리한다.
- `JAVA_HOME`이 암묵적으로 맞을 거라고 가정하지 말고 tool selector와 version file을 함께 확인한다.

## 기본 정책

- 기본 추천 selector: `zulu-21`
- tracked config에서 vendor가 없는 `21`은 정책 위반 후보
- shorthand vendor 정책을 쓰더라도 repo config에서는 명시 selector를 우선한다

## 점검 질문

- selector가 `zulu-21`처럼 vendor를 명시하는가
- selector 후보가 `mise ls-remote java` 결과와 맞는가
- `.java-version` 또는 관련 idiomatic file 전략과 충돌하지 않는가
- build/test workflow가 있으면 `ecosystems/java-gradle.md`와 함께 봤는가

## 같이 볼 문서

- Gradle selector와 wrapper 경계: `references/ecosystems/java-gradle.md`
- Spring 서비스 관례: `references/ecosystems/spring-service.md`
- Java starter example: `references/examples/java-gradle-app.md`
