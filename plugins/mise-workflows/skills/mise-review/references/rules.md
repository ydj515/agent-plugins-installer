# Rules

## 핵심 출력

- rule id
- severity
- owner skill
- why
- fix hint
- docs 또는 다음에 읽을 ecosystem reference

## rule family

- `PARSE*`: TOML parse
- `MWC*`: tools/config
- `MWE*`: env
- `MWP*`: profiles
- `MWV*`: versions
- `MWJ*`: Java selector/vendor policy

## current profile checks

- `MWP001`: `python-uv-app` required tools
- `MWP002`: `java-gradle-app` required tools
- `MWP003`: `java-spring-service` required tools
