# Version Policy

## 버전 선택 절차

1. profile을 결정한다.
2. 해당 profile의 관련 ecosystem reference를 확인한다.
3. `mise ls-remote <tool>` 또는 `mise latest <tool@request>`로 후보를 확인한다.
4. 가능한 경우 major/minor request 범위를 먼저 좁힌다.
5. prerelease를 제외한다.
6. `minimum_release_age`를 통과한 최신 stable 후보를 고른다.
7. 너무 낮은 floor가 아닌지 ecosystem reference 규칙으로 다시 확인한다.

## 저장 전략

- `mise.toml`: request(prefix) 중심
- `mise.lock`: exact resolution, URL, checksum 중심
- 예외적으로 lockfile을 쓸 수 없고 reproducibility가 더 중요하면 `mise use --pin`으로 exact pin 허용

## Minimum Release Age

새로 배포된 버전을 일정 시간 보류해 공급망 공격 위험을 줄인다.

- 기본값은 24시간이다. `aqua`, `cargo`, core, `forgejo`, `gem`, `github`, `gitlab`, `go`, `npm`, `packslip`, `pypi`, `spm`, `ubi` 도구에 적용된다.
- `http`, `s3`, `conda`, `dotnet`, `asdf`, `vfox`는 값을 설정할 때만 적용된다.
- 설정 이름은 `minimum_release_age`다. 기간(`7d`, `6mo`) 또는 날짜(`2026-06-01`)를 받으며 `0s`는 끈다.
- 조직 기본값을 강화하려면 `[settings] minimum_release_age = "7d"`처럼 적는다.
- 보안 패치처럼 빨리 받아야 하는 도구는 tool option으로 개별 완화한다: `[tools.trivy] minimum_release_age = "1d"`.
- 완전 제외가 필요하면 `minimum_release_age_excludes = ["trivy", "npm:*"]`를 쓴다. 여러 config의 목록은 합쳐진다.
- 우선순위: `--minimum-release-age` 플래그 > tool option > setting 또는 기본값.
- cutoff는 mise가 새 버전을 고를 때만 적용된다. exact version, `mise.lock`에 기록된 버전, 이미 설치된 버전은 걸러지지 않는다.
- `install_before`는 deprecated다. `minimum_release_age`로 옮긴다.

## 업데이트 흐름

- `mise outdated`: request 범위 안에서 더 새 버전이 있는 도구
- `mise lock --bump [tool]`: `mise.toml`은 그대로 두고 lockfile만 최신 허용 버전으로 이동
- `mise upgrade [tool]`: 설치와 lockfile 갱신
- `mise upgrade --bump`: request 자체를 올린다. major 변경은 리뷰를 거친다

## 기본 가드

- `latest` 금지
- prerelease 기본 금지
- 너무 낮은 request 금지
- npm 스타일 range 금지
- `minimum_release_age`를 0으로 끄는 설정은 사유를 남긴 경우에만 허용

## Review 질문

- 이 request는 `mise`가 해석 가능한가
- 이 request는 profile과 ecosystem-specific floor를 만족하는가
- exact pin이 필요한지, lockfile만으로 충분한지 구분했는가
- build tool과 package manager도 같은 절차로 검토했는가
- release age 완화나 제외에 근거가 있는가
