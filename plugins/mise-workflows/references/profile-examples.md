# Profile Examples

이 문서는 대표 starter profile의 예제 `mise.toml` 문서를 모아둔 index다.

- 여기에 없는 조합이 곧 미지원이라는 뜻은 아니다.
- 예제가 없는 경우에도 core skill과 ecosystem reference 조합으로 `mise.toml`을 설계하거나 리뷰할 수 있다.
- 이 문서의 목적은 전체 지원 범위를 제한하는 것이 아니라, 반복적으로 자주 쓰는 시작점을 제공하는 것이다.

## Examples

- [python-uv-app.md](./examples/python-uv-app.md): 일반 Python 애플리케이션 starter
- [python-uv-lib.md](./examples/python-uv-lib.md): package build/publish 중심 Python 라이브러리 starter
- [java-gradle-app.md](./examples/java-gradle-app.md): 일반 Java 애플리케이션 starter
- [java-spring-service.md](./examples/java-spring-service.md): Spring 서비스 starter

## 버전 선택 기준

예제는 request 중심으로 적고, exact resolution은 `mise.lock`에 맡긴다. 다만 selector floor 자체는 임의로 정하지 않고, 실제 `mise`가 해석 가능한 후보 범위 안에서 고른다.

2026-10-16 기준(mise 2026.9.18, 기본 `minimum_release_age` 24시간 적용)으로 확인한 대표 후보:

- `mise latest python@3.14` -> `3.14.8`
- `mise latest uv@0.13` -> `0.13.1`
- `mise latest java@zulu-25` -> `zulu-25.36.205.0`
- `mise latest java@zulu-21` -> `zulu-21.52.203.0`
- `mise latest gradle@9` -> `9.8.1`
- `mise latest gradle@8` -> `8.14.6`

예제 파일에서는 이 exact patch를 그대로 적기보다, 재현성은 `mise.lock`에 맡기고 사람이 읽기 쉬운 request를 주로 사용한다.

## 공통 요소

- 모든 예제는 `[settings] lockfile = true`로 `mise.lock`을 만들고 커밋하는 흐름을 전제로 한다.
- CI는 `mise install --locked` 후 `mise run ci` 또는 `test` task를 호출한다. 자세한 내용은 `ci-integration.md`를 본다.
