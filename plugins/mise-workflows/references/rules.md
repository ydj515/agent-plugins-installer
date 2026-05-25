# Rules

## Rule Family

- `PARSE*`: TOML parse failure
- `MWC*`: tools, backend, config rules
- `MWE*`: env and local override rules
- `MWP*`: profile inference rules
- `MWV*`: version policy rules
- `MWJ*`: Java selector and vendor policy rules

## 현재 구현된 규칙 prefix

- `PARSE001`
- `MWC001`, `MWC002`
- `MWE001`, `MWE002`
- `MWP001`, `MWP002`, `MWP003`
- `MWV002`
- `MWJ001`

## Current Profile Rules

- `MWP001`: `python-uv-app` 신호가 있는데 `[tools]`에 `python`, `uv`가 모두 없을 때
- `MWP002`: `java-gradle-app` 신호가 있는데 `[tools]`에 `java`, `gradle`가 모두 없을 때
- `MWP003`: `java-spring-service` 신호가 있는데 `[tools]`에 `java`, `gradle`가 모두 없을 때

## 출력 기대치

- JSON과 human-readable 모두 지원
- 각 진단은 `owner_skill`을 포함
- `fix_hint`는 짧고 실행 가능해야 함
- 관련 ecosystem reference가 있다면 `docs` 링크나 후속 읽기 대상을 함께 준다
