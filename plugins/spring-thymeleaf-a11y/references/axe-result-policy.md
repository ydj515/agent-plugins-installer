# Axe Result Policy

## 판정 기준

- `FAIL`
  - 하나 이상의 `violations`가 있다.
- `REVIEW`
  - `violations`는 없지만 `incomplete`가 남아 있다.
- `PASS`
  - `violations = 0` 이고 `incomplete = 0` 이다.

## 우선순위

1. `critical`
2. `serious`
3. `moderate`
4. `minor`

## 해석 원칙

- `violations`
  - 자동으로 확정 가능한 실패다.
- `incomplete`
  - 자동 판정 보류 항목이다. 수동 검토 없이는 닫지 않는다.
- `passes`
  - 현재 문맥에서 통과한 규칙이다.
- `inapplicable`
  - 현재 페이지에 적용되지 않는 규칙이다.

## 보고 원칙

- 페이지별 요약과 전체 요약을 모두 남긴다.
- `critical`과 `serious`는 수정 가이드 상단에 노출한다.
- `incomplete`는 숨기지 말고 별도 검토 목록으로 분리한다.
