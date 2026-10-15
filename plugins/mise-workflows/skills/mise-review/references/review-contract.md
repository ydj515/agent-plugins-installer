# Rules

## 핵심 출력

- rule id
- severity
- owner skill
- why
- fix hint
- docs 또는 다음에 읽을 ecosystem reference
- evidence

## rule family

- `PARSE*`: TOML parse
- `MWC*`: tools/config
- `MWE*`: env
- `MWT*`: tasks
- `MWV*`: versions
- `MWL*`: lockfile
- `MWJ*`: Java selector/vendor policy
- `MWP*`: profiles

전체 규칙 목록은 `../../../references/rules.md`를 읽는다.

## 리뷰 순서

1. validator를 실행한다.
2. `mise tasks validate`를 함께 실행한다.
3. error와 policy-error를 먼저 정리하고 owner skill로 넘긴다.
4. warning은 제거 예정 버전과 함께 보고한다.
5. info는 권장 사항으로 묶어 보고한다.
