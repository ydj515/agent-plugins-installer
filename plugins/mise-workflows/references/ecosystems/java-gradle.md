# Java Gradle

## 역할

- Gradle selector floor와 wrapper 경계를 다룬다.
- Java runtime 규칙 위에 build tool 관점의 판단을 얹는다.
- Spring 서비스 관례 자체는 별도 문서로 분리한다.

## 기본 원칙

- Gradle selector floor는 shared policy와 profile 맥락 안에서 판단한다.
- wrapper가 프로젝트 실행 진입점이어도, 개발 환경 정렬을 위해 `mise` 관리 Gradle이 필요할 수 있다.
- runtime selector와 build selector를 같은 규칙으로 뭉뚱그리지 않는다.

## 점검 질문

- profile이 실제로 Gradle을 요구하는가
- selector가 현재 지원 floor보다 낮지 않은가
- wrapper와 `mise`의 책임 경계가 문서화되어 있는가
- Java runtime 규칙은 `references/ecosystems/java-runtime.md`와 함께 봤는가

## 조합 원칙

- Java runtime 규칙은 `references/ecosystems/java-runtime.md`
- Gradle selector와 wrapper 판단은 이 문서
- Spring 서비스 관례는 `references/ecosystems/spring-service.md`

## 같이 볼 문서

- Java runtime 정책: `references/ecosystems/java-runtime.md`
- Spring 서비스 관례: `references/ecosystems/spring-service.md`
- Java app starter: `references/examples/java-gradle-app.md`
