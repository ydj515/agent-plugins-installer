# Profile Catalog

## 대표 profile 카탈로그

이 문서는 현재 문서화된 starter profile을 모아둔 catalog다.

- 이 목록은 exhaustive list가 아니다.
- 이 목록 밖의 저장소도 core skill과 ecosystem reference 조합으로 다룰 수 있다.
- 반복적으로 등장하는 조합만 named profile로 승격한다.
- validator가 직접 추론하는 profile rule은 대표 조합 위주로 먼저 추가한다.
- 저장소 신호와 선택 기준은 `profile-composition.md`가 소유한다.
- 실제 starter `mise.toml` 샘플은 `profile-examples.md`와 `references/examples/`가 소유한다.

### `python-uv-app`

- 목적: 일반 Python 애플리케이션
- required tools: `python`, `uv`
- related references: `references/ecosystems/python-runtime.md`, `references/ecosystems/python-uv.md`

### `python-uv-lib`

- 목적: 라이브러리 또는 패키지 배포 중심 Python 저장소
- 성격: `python-uv-app`의 특화 변형으로, 배포/publish workflow가 더 중요할 때 사용
- required tools: `python`, `uv`
- related references: `references/ecosystems/python-runtime.md`, `references/ecosystems/python-uv.md`

### `java-gradle-app`

- 목적: 일반 Java 애플리케이션
- required tools: `java`, `gradle`
- related references: `references/ecosystems/java-runtime.md`, `references/ecosystems/java-gradle.md`

### `java-spring-service`

- 목적: Spring 기반 서비스
- required tools: `java`, `gradle`
- related references: `references/ecosystems/java-runtime.md`, `references/ecosystems/java-gradle.md`
- optional references: `references/ecosystems/spring-service.md`
